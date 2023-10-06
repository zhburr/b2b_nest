import { Injectable } from '@nestjs/common';
import { Packaging, ProductApproval, Status, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SharedService } from 'src/shared/shared.service';
import {
  GetProductByUserIdDTO,
  GetProductsDTO,
  ProductCSVDto,
  UpdateProductApprovalStatus,
  UpdateUserProductAdminDTO,
} from './dto';
import { deleteFile, getFile } from 'src/common/helper';

@Injectable()
export class ProductService {
  constructor(
    private sharedService: SharedService,
    private prisma: PrismaService,
  ) {}

  async uploadProductListing(userId: number, fileName: string) {
    const createProductListing = await this.prisma.productApproval.create({
      data: {
        csv: fileName,
        userId: userId,
      },
    });

    return createProductListing;
  }

  async allProductApprovalOfUser(user: User) {
    const get = await this.prisma.productApproval.findMany({
      where: {
        userId: user.id,
      },
    });

    return this.sharedService.sendResponse(get, true);
  }

  async getProductApprovalofAllUser(user: User) {
    const getAll = await this.prisma.productApproval.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            id: true,
            email: true,
          },
        },
      },
    });

    return this.sharedService.sendResponse(getAll, true);
  }

  async updateProductApprovalStatus(dto: UpdateProductApprovalStatus) {
    try {
      if (dto.status === Status.Approved) {
        const productApproval = await this.prisma.productApproval.findUnique({
          where: { id: dto.id },
        });
        await this.upsertProductFromCsv(productApproval);
      }
      const update = await this.prisma.productApproval.update({
        where: {
          id: dto.id,
        },
        data: {
          status: dto.status,
          remarks: dto.remarks ?? undefined,
        },
      });

      return this.sharedService.sendResponse(
        null,
        true,
        `Listing has been ${dto.status}`,
      );
    } catch (error) {
      return this.sharedService.sendResponse(
        null,
        false,
        'Something went wrong.',
      );
    }
  }

  // upsertProductfromcsv

  private async upsertProductFromCsv(dto: ProductApproval) {
    const file: any = await getFile(`./uploads/products/${dto.csv}`);
    const jsonData: ProductCSVDto[] = await this.sharedService.parseCsvFile(
      file,
      ProductCSVDto,
    );

    // try {
    //   await this.prisma.$transaction(async (tx) => {
    //     for (const product of jsonData) {
    //       await tx.$queryRaw`
    //   INSERT INTO \`products\` (\`sku\`, \`title\`, \`quantity\`, \`userId\`, \`price\`, \`weight\`, \`updateAt\`)
    //   VALUES (${product.SKU}, ${product.Name}, ${Number(product.Quantity)}, ${
    //         dto.userId
    //       }, ${Number(product.Price) || null}, ${
    //         product.Weight
    //       }, CURRENT_TIMESTAMP)
    //   ON DUPLICATE KEY UPDATE
    //     \`quantity\` = \`products\`.\`quantity\` + ${Number(product.Quantity)},
    //     \`title\` = ${product.Name},
    //     \`price\` = ${Number(product.Price) || null},
    //     \`weight\` = ${product.Weight},
    //     \`updateAt\` = CURRENT_TIMESTAMP;
    // `;
    //     }
    //   });

    await this.prisma.$transaction(
      async (tx) => {
        for (const product of jsonData) {
          const getProduct = await tx.product.findFirst({
            where: {
              userId: dto.userId,
              sku: product.SKU,
            },
          });

          if (getProduct) {
            const updateProduct = await tx.product.update({
              where: {
                userId: dto.id,
                sku: product.SKU,
              },
              data: {
                quantity: {
                  increment: product.Quantity,
                },
                title: product.Name,
                description: product.Description,
                price: product.Price,
                weight: product.Weight,
              },
            });
          } else {
            const createProduct = await tx.product.create({
              data: {
                sku: product.SKU,
                userId: dto.userId,
                title: product.Name,
                description: product.Description,
                quantity: product.Quantity,
                price: product.Price,
                weight: product.Weight,
              },
            });
          }
        }
      },
      { timeout: 200000 },
    );

    // } catch (error) {
    //   console.log(error);
    // }
  }

  async getProductListing(dto: GetProductsDTO, user: User) {
    try {
      if (dto.searchText) {
        const searchTextAsNumber = parseFloat(dto.searchText);
        const products = await this.prisma.product.findMany({
          where: {
            userId: user.id,
            OR: [
              { title: { contains: dto.searchText } },
              { sku: { contains: dto.searchText } },
              { description: { contains: dto.searchText } },
              {
                quantity: isNaN(searchTextAsNumber)
                  ? undefined
                  : searchTextAsNumber,
              },
              {
                price: isNaN(searchTextAsNumber)
                  ? undefined
                  : searchTextAsNumber,
              },
              {
                weight: isNaN(searchTextAsNumber)
                  ? undefined
                  : searchTextAsNumber,
              },
              { location: { contains: dto.searchText } },
            ],
          },
          skip: dto.pageIndex * dto.pageSize,
          take: dto.pageSize,
        });

        const totalProduct = await this.prisma.product.count({
          where: {
            userId: user.id,
            OR: [
              { title: { contains: dto.searchText } },
              { sku: { contains: dto.searchText } },
              { description: { contains: dto.searchText } },
              {
                quantity: isNaN(searchTextAsNumber)
                  ? undefined
                  : searchTextAsNumber,
              },
              {
                price: isNaN(searchTextAsNumber)
                  ? undefined
                  : searchTextAsNumber,
              },
              {
                weight: isNaN(searchTextAsNumber)
                  ? undefined
                  : searchTextAsNumber,
              },
              { location: { contains: dto.searchText } },
            ],
          },
        });

        return this.sharedService.sendResponse(
          { products, totalProduct },
          true,
        );
      } else {
        const products = await this.prisma.product.findMany({
          where: {
            userId: user.id,
          },
          skip: dto.pageIndex * dto.pageSize,
          take: dto.pageSize,
        });

        const totalProduct = await this.prisma.product.count({
          where: { userId: user.id },
        });
        return this.sharedService.sendResponse(
          { products, totalProduct },
          true,
        );
      }
    } catch (error) {
      return this.sharedService.sendResponse(
        null,
        false,
        'Something went wrong.',
      );
    }
  }

  async getSelectedUserProduct(dto: GetProductByUserIdDTO) {
    try {
      if (dto.searchText) {
        const searchTextAsNumber = parseFloat(dto.searchText);
        const products = await this.prisma.product.findMany({
          where: {
            userId: dto.selectedUserId,
            OR: [
              { title: { contains: dto.searchText } },
              { sku: { contains: dto.searchText } },
              { description: { contains: dto.searchText } },
              {
                quantity: isNaN(searchTextAsNumber)
                  ? undefined
                  : searchTextAsNumber,
              },
              {
                price: isNaN(searchTextAsNumber)
                  ? undefined
                  : searchTextAsNumber,
              },
              {
                weight: isNaN(searchTextAsNumber)
                  ? undefined
                  : searchTextAsNumber,
              },
              { location: { contains: dto.searchText } },
            ],
          },
          select: {
            id: true,
            title: true,
            sku: true,
            description: true,
            quantity: true,
            price: true,
            userId: true,
            image: true,
            weight: true,
            location: true,
            packaging: true,
          },
          skip: dto.pageIndex * dto.pageSize,
          take: dto.pageSize,
        });

        const totalProduct = await this.prisma.product.count({
          where: {
            userId: dto.selectedUserId,
            OR: [
              { title: { contains: dto.searchText } },
              { sku: { contains: dto.searchText } },
              { description: { contains: dto.searchText } },
              {
                quantity: isNaN(searchTextAsNumber)
                  ? undefined
                  : searchTextAsNumber,
              },
              {
                price: isNaN(searchTextAsNumber)
                  ? undefined
                  : searchTextAsNumber,
              },
              {
                weight: isNaN(searchTextAsNumber)
                  ? undefined
                  : searchTextAsNumber,
              },
              { location: { contains: dto.searchText } },
            ],
          },
        });

        return this.sharedService.sendResponse(
          { products, totalProduct },
          true,
        );
      } else {
        const products = await this.prisma.product.findMany({
          where: {
            userId: dto.selectedUserId,
          },
          select: {
            id: true,
            title: true,
            sku: true,
            description: true,
            quantity: true,
            price: true,
            userId: true,
            image: true,
            weight: true,
            location: true,
            packaging: true,
          },
          skip: dto.pageIndex * dto.pageSize,
          take: dto.pageSize,
        });

        const totalProduct = await this.prisma.product.count({
          where: { userId: dto.selectedUserId },
        });

        return this.sharedService.sendResponse(
          { products, totalProduct },
          true,
        );
      }
    } catch (error) {
      return this.sharedService.sendResponse(
        null,
        false,
        'Something went wrong.',
      );
    }
  }

  async updateUserProductByAdmin(dto: UpdateUserProductAdminDTO) {
    try {
      const updateProduct = await this.prisma.product.update({
        where: {
          id: dto.productId,
        },
        data: {
          location: dto.productLocation,
          packaging: Packaging[dto.productPackaging] ?? null,
          weight: dto.productWeight,
          quantity: dto.productQuantity,
        },
        select: {
          id: true,
          title: true,
          sku: true,
          description: true,
          quantity: true,
          price: true,
          userId: true,
          image: true,
          weight: true,
          location: true,
          packaging: true,
        },
      });

      return this.sharedService.sendResponse(
        updateProduct,
        true,
        'Product has been updated',
      );
    } catch (error) {
      return this.sharedService.sendResponse(
        null,
        false,
        'Something went wrong.',
      );
    }
  }

  async getProductBySKU(sku: string) {
    const product = await this.prisma.product.findUnique({
      where: {
        sku: sku,
      },
    });
    return product;
  }

  async updateProductBySKU(sku: string, data: any) {
    const update = await this.prisma.product.update({
      where: {
        sku: sku,
      },
      data,
    });
  }
}
