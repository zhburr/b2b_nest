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
      console.log(file);

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
    const productSKUsToUpdate = [];

    try {
      await this.prisma.$transaction(
        async (tx) => {
          const order = await tx.orderUpload.create({
            data: {
              csv: file.filename,
              userId: user.id,
            },
          });

          console.log(order);

          for (let orderLine of data) {
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

            productSKUsToUpdate.push(orderLine.ProductSKU);
          }

          await tx.orderLine.createMany({
            data: orderLinesToCreate,
          });

          const productUpdates = productSKUsToUpdate.map((sku) => ({
            where: {
              sku: sku,
            },
            data: {
              quantity: {
                decrement: orderLinesToCreate.find(
                  (ol) => ol.productSku === sku,
                ).productQuantity,
              },
            },
          }));

          console.log(productUpdates); // Check the generated array

          for (const updateObj of productUpdates) {
            await tx.product.update({
              where: updateObj.where,
              data: updateObj.data,
            });
          }
        },
        { timeout: 2000 },
      );
    } catch (error) {
      console.log('Transaction is fialed it should roll back now');
      throw new Error('Something went wrong');
    }
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
      return this.sharedService.sendResponse({}, false, error.message);
    }
  }

  async getAllPostage() {
    const allPostage = await this.prisma.postage.findMany({});

    return this.sharedService.sendResponse(allPostage, true);
  }
}
