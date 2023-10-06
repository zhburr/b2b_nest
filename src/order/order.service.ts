import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { deleteFile, getFile } from 'src/common/helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderCSVDTO, UpsertPostageDTO } from './dto';
import { SharedService } from 'src/shared/shared.service';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private sharedService: SharedService,
  ) {}

  async uploadOrder(user: User, file) {
    try {
      const checkUploadStatus = await this.prisma.user.findUnique({
        where: {
          email: user.email,
        },
      });

      if (!checkUploadStatus.canUploadOrder) {
        throw new Error(
          'You can not upload order.Please contact B2B Direct for further details',
        );
      }

      const getfile: any = await getFile(file.path);
      const jsonData: OrderCSVDTO[] = await this.sharedService.parseCsvFile(
        getfile,
        OrderCSVDTO,
      );

      const productSKUs = [...new Set(jsonData.map((item) => item.ProductSKU))];

      const products = await this.prisma.product.findMany({
        where: {
          sku: {
            in: productSKUs,
          },
          userId: user.id,
        },
      });

      const productMap = products.reduce((map, product) => {
        map[product.sku] = product;
        return map;
      }, {});

      const orderMap = jsonData.reduce((map, item) => {
        if (map[item.ProductSKU]) {
          map[item.ProductSKU] += item.ProductQuantity;
        } else {
          map[item.ProductSKU] = item.ProductQuantity;
        }
        return map;
      }, {});

      const bulkOrderItems = jsonData.map((item) => {
        const product = productMap[item.ProductSKU];

        if (!product) {
          throw new Error(
            `Product with ID ${item.ProductSKU} does not exist. Check the SKU and try again.`,
          );
        }

        const availableQuantity =
          product.quantity - (orderMap[item.ProductSKU] || 0);

        return {
          ...item,
          availableQuantity,
          isValid: item.ProductQuantity <= availableQuantity,
        };
      });

      const invalidProductSKUs = bulkOrderItems
        .filter((item) => !item.isValid)
        .map((item) => item.ProductSKU);

      if (invalidProductSKUs.length > 0) {
        await deleteFile(file.path);
        const errorMessage = `Products ${invalidProductSKUs.join(
          ', ',
        )} do not have enough quantity. Please update the quantity and try again.`;
        return this.sharedService.sendResponse({}, false, errorMessage);
      }

      await this.insertOrderData(file, user, jsonData);
      return this.sharedService.sendResponse({}, true, 'Order has been upload');
    } catch (error) {
      await deleteFile(file.path);
      return this.sharedService.sendResponse({}, false, error.message);
    }
  }

  private async insertOrderData(file, user: User, data: OrderCSVDTO[]) {
    const orderLinesToCreate = [];

    try {
      await this.prisma.$transaction(
        async (tx) => {
          const order = await tx.orderUpload.create({
            data: {
              csv: file.filename,
              userId: user.id,
            },
          });

          for (const orderLine of data) {
            orderLinesToCreate.push({
              orderId: order.id,
              productSku: orderLine.ProductSKU,
              productQuantity: orderLine.ProductQuantity,
              buyerName: orderLine.BuyerName,
              buyerAddress1: orderLine.BuyerAddress1,
              buyerAddress2: orderLine.BuyerAddress2 ?? undefined,
              buyerCity: orderLine.BuyerCity,
              buyerCountry: orderLine.BuyerCountry,
              buyerPostCode: orderLine.BuyerPostCode,
            });
          }

          await tx.orderLine.createMany({
            data: orderLinesToCreate,
          });

          const productUpdates = orderLinesToCreate.map((order) => ({
            where: {
              sku: order.productSku,
            },
            data: {
              quantity: {
                decrement: order.productQuantity,
              },
            },
          }));

          // Check the generated array

          for (const updateObj of productUpdates) {
            await tx.product.update({
              where: updateObj.where,
              data: updateObj.data,
            });
          }
        },
        { timeout: 200000 },
      );
    } catch (error) {
      throw new Error('Something went wrong');
    }
  }

  async getUserOrderList(user: User) {
    const orderList = await this.prisma.orderUpload.findMany({
      where: {
        userId: user.id,
      },
    });

    return orderList;
  }

  async checkUserOrderId(userId: number, orderId: number) {
    const check = await this.prisma.orderUpload.findFirst({
      where: {
        id: orderId,
        user: {
          id: userId,
        },
      },
    });

    return check ? true : false;
  }

  async getOrderById(orderId: number, includeProduct = false) {
    const order = await this.prisma.orderUpload.findUnique({
      where: {
        id: orderId,
      },
      include: {
        OrderLine: {
          include: {
            product: includeProduct,
          },
        },
      },
    });

    return order;
  }

  async upsertPostage(dto: UpsertPostageDTO) {
    try {
      const existingPostage = await this.prisma.postage.findFirst({
        where: {
          OR: [
            {
              weight_from: {
                lte: dto.weightFrom,
              },
              weight_to: {
                gte: dto.weightFrom,
              },
            },
            {
              weight_from: {
                lte: dto.weightTo,
              },
              weight_to: {
                gte: dto.weightTo,
              },
            },
            {
              weight_from: {
                gte: dto.weightFrom,
              },
              weight_to: {
                lte: dto.weightTo,
              },
            },
          ],
          NOT: {
            id: dto.id,
          },
        },
      });

      if (existingPostage) {
        throw new Error(`This combination already exist.`);
      } else {
        const upsertPostage = await this.prisma.postage.upsert({
          where: {
            id: dto.id,
          },
          update: {
            weight_from: dto.weightFrom,
            weight_to: dto.weightTo,
            price: dto.price,
          },
          create: {
            weight_from: dto.weightFrom,
            weight_to: dto.weightTo,
            price: dto.price,
          },
        });

        return this.sharedService.sendResponse(
          upsertPostage,
          true,
          'Postage upsert sucessfully ',
        );
      }
    } catch (error) {
      return this.sharedService.sendResponse(
        {},
        false,
        'Somehting went wrong.',
      );
    }
  }

  async getAllPostage() {
    try {
      const allPostage = await this.prisma.postage.findMany({});

      return this.sharedService.sendResponse(allPostage, true);
    } catch (error) {
      return this.sharedService.sendResponse(
        null,
        false,
        'Something went wrong.',
      );
    }
  }

  async getAllLabelPrice() {
    try {
      const allPostage = await this.prisma.labelPrice.findMany({});

      return this.sharedService.sendResponse(allPostage, true);
    } catch (error) {
      return this.sharedService.sendResponse(
        null,
        false,
        'Something went wrong.',
      );
    }
  }

  async getAllPendingOrder() {
    const order = await this.prisma.orderUpload.findMany({
      where: {
        OR: [{ delivered: false }, { paid: false }],
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return order;
  }

  async getInvoiceData(order) {
    const invoiceList = [];

    for (let item of order.OrderLine) {
      const totalWeight =
        Number(item.product.weight) * Number(item.productQuantity);
      const price = await this.getPostageByWeight(totalWeight);
      const editedProduct = {
        ...item,
        totalWeight,
        totalPrice: price,
      };

      invoiceList.push(editedProduct);
    }

    return invoiceList;
  }

  async getPostageByWeight(weight: number) {
    const postage = await this.prisma.postage.findFirst({
      where: {
        weight_from: { lte: weight },
        weight_to: { gte: weight },
      },
    });
    return postage ? postage.price : 0;
  }

  async getUserById(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    delete user.password;

    return user;
  }

  async updateOrderField(orderId: number, updateData: any) {
    const update = await this.prisma.orderUpload.update({
      where: { id: orderId },
      data: updateData,
    });

    return update;
  }

  async updateOrderLineField(orderLineId: number, updateData: any) {
    const update = await this.prisma.orderLine.update({
      where: {
        id: orderLineId,
      },
      data: updateData,
    });

    return update;
  }

  async getOrderLine(orderId: number, pageIndex: number, pageSize: number) {
    const orderLines = await this.prisma.orderLine.findMany({
      where: {
        orderId,
      },
      take: pageSize,
      skip: pageIndex * pageSize,
    });

    return orderLines;
  }

  async getUserOrderByEmail(email: string) {
    const orders = await this.prisma.orderUpload.findMany({
      where: {
        user: {
          email: email,
        },
      },
    });

    return orders;
  }

  async upsertLabelPrice(dto: UpsertPostageDTO) {
    try {
      const existingPostage = await this.prisma.labelPrice.findFirst({
        where: {
          OR: [
            {
              weight_from: {
                lte: dto.weightFrom,
              },
              weight_to: {
                gte: dto.weightFrom,
              },
            },
            {
              weight_from: {
                lte: dto.weightTo,
              },
              weight_to: {
                gte: dto.weightTo,
              },
            },
            {
              weight_from: {
                gte: dto.weightFrom,
              },
              weight_to: {
                lte: dto.weightTo,
              },
            },
          ],
          NOT: {
            id: dto.id,
          },
        },
      });

      if (existingPostage) {
        throw new Error(`This combination already exist.`);
      } else {
        const upsertPostage = await this.prisma.labelPrice.upsert({
          where: {
            id: dto.id,
          },
          update: {
            weight_from: dto.weightFrom,
            weight_to: dto.weightTo,
            price: dto.price,
          },
          create: {
            weight_from: dto.weightFrom,
            weight_to: dto.weightTo,
            price: dto.price,
          },
        });

        return this.sharedService.sendResponse(
          upsertPostage,
          true,
          'Label price upsert sucessfully ',
        );
      }
    } catch (error) {
      return this.sharedService.sendResponse(
        {},
        false,
        'Something went wrong.',
      );
    }
  }
}
