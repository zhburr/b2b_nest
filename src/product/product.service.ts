import { ForbiddenException, Injectable } from '@nestjs/common';
import { ProductApproval, Status, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SharedService } from 'src/shared/shared.service';
import * as fs from 'fs';
import {
  GetProductByUserIdDTO,
  GetProductsDTO,
  ProductCSVDto,
  UpdateProductApprovalStatus,
} from './dto';
import { getFile } from 'src/common/helper';

@Injectable()
export class ProductService {
  constructor(
    private sharedService: SharedService,
    private prisma: PrismaService,
  ) {}

  async uploadProductListing(user: User, file) {
    try {
      const createProductListing = await this.prisma.productApproval.create({
        data: {
          csv: file.filename,
          userId: user.id,
        },
      });

      return this.sharedService.sendResponse(
        createProductListing,
        true,
        'Products has been uploaded sucessfully',
      );
    } catch (error) {
      console.log(error, file.path);

      fs.unlink(file.path, (err) => {
        if (err) {
          console.error(err);
        }
      });
    }
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
      {},
      true,
      `Listing has been ${dto.status}`,
    );
  }

  // upsertProductfromcsv

  private async upsertProductFromCsv(dto: ProductApproval) {
    const file: any = await getFile(`./uploads/products/${dto.csv}`);
    const jsonData: ProductCSVDto[] = await this.sharedService.parseCsvFile(
      file,
      ProductCSVDto,
    );

    try {
      await this.prisma.$transaction(async () => {
        for (let product of jsonData) {
          await this.prisma.$queryRaw`
  INSERT INTO \`products\` (\`sku\`, \`title\`, \`quantity\`, \`userId\`, \`price\`, \`weight\`, \`updateAt\`)
  VALUES (${product.SKU}, ${product.Name}, ${Number(product.Quantity)}, ${
            dto.userId
          }, ${Number(product.Price) || null}, ${
            product.Weight
          }, CURRENT_TIMESTAMP)
  ON DUPLICATE KEY UPDATE
    \`quantity\` = \`products\`.\`quantity\` + ${Number(product.Quantity)},
    \`title\` = ${product.Name},
    \`price\` = ${Number(product.Price) || null},
    \`weight\` = ${product.Weight},
    \`updateAt\` = CURRENT_TIMESTAMP;
`;
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  async getProductListing(dto: GetProductsDTO, user: User) {
    const products = await this.prisma.product.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        updateAt: 'desc',
      },
      skip: dto.pageIndex * dto.pageSize,
      take: dto.pageSize,
    });

    const totalProduct = await this.prisma.product.count({
      where: { userId: user.id },
    });

    return this.sharedService.sendResponse({ products, totalProduct }, true);
  }

  async getSelectedUserProduct(dto: GetProductByUserIdDTO) {
    const products = await this.prisma.product.findMany({
      where: {
        userId: dto.selectedUserId,
      },
      orderBy: {
        updateAt: 'desc',
      },
      skip: dto.pageIndex * dto.pageSize,
      take: dto.pageSize,
    });

    const totalProduct = await this.prisma.product.count({
      where: { userId: dto.selectedUserId },
    });

    return this.sharedService.sendResponse({ products, totalProduct }, true);
  }
}
