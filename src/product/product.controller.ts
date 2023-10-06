import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CsvValidationPipe } from 'src/auth/csv-validation.pipe';
import {
  GetProductByUserIdDTO,
  GetProductsDTO,
  ProductCSVDto,
  UpdateProduct,
  UpdateProductApprovalStatus,
  UpdateUserProductAdminDTO,
  updateProductQuantityDTO,
} from './dto';
import { Response, Request } from 'express';
import { Roles as Role } from 'src/roles.decorator';
import { Roles } from '@prisma/client';
import { SharedService } from 'src/shared/shared.service';
import { Public } from 'src/public.decorator';
import { deleteFile, getFile } from 'src/common/helper';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('product')
export class ProductController {
  constructor(
    private productService: ProductService,
    private sharedService: SharedService,
    private prisma: PrismaService,
  ) {}

  @Post('uploadListing')
  @Role(Roles.Client)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, callback) => {
          const unique = Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const fileName = `${unique}${ext}`;
          callback(null, fileName);
        },
      }),
    }),
  )
  @UsePipes(new CsvValidationPipe(ProductCSVDto))
  async uploadProductListing(
    @UploadedFile()
    file: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const existingSkus = [];
      const getfile: any = await getFile(file.path);

      const jsonData: ProductCSVDto[] = await this.sharedService.parseCsvFile(
        getfile,
        ProductCSVDto,
      );

      for (const product of jsonData) {
        const exisitingProduct = await this.prisma.product.findFirst({
          where: {
            sku: product.SKU,
            NOT: {
              userId: req['user'].id,
            },
          },
        });

        if (exisitingProduct) {
          existingSkus.push(exisitingProduct);
        }
      }

      if (existingSkus.length) {
        await deleteFile(file.path);

        return res
          .status(200)
          .send(
            this.sharedService.sendResponse(
              null,
              false,
              `SKU ${existingSkus[0].sku} already exsist. After changing it try uploading again.`,
            ),
          );
      }

      const newProductUpload = await this.productService.uploadProductListing(
        req['user'].id,
        file.filename,
      );

      return res
        .status(200)
        .send(
          this.sharedService.sendResponse(
            newProductUpload,
            true,
            'Products has been uploaded sucessfully',
          ),
        );
    } catch (error) {
      await deleteFile(file.path);
      return res
        .status(500)
        .send(
          this.sharedService.sendResponse('', false, 'Something went wrong.'),
        );
    }
  }

  @Get('allProductApprovalOfUser')
  @Role(Roles.Client)
  allProductApprovalOfUser(@Req() req: Request) {
    return this.productService.allProductApprovalOfUser(req['user']);
  }

  @Get('getAllUserProductApproval')
  @Role(Roles.Admin)
  getProductApprovalofAllUser(@Req() req: Request) {
    return this.productService.getProductApprovalofAllUser(req['user']);
  }

  @Post('updateProductApprovalStatus')
  @Role(Roles.Admin)
  updateProductApprovalStatus(@Body() dto: UpdateProductApprovalStatus) {
    return this.productService.updateProductApprovalStatus(dto);
  }

  @Post('getProductListing')
  @Role(Roles.Client)
  getProductListing(@Body() dto: GetProductsDTO, @Req() req: Request) {
    return this.productService.getProductListing(dto, req['user']);
  }

  @Post('getSelectedUserProduct')
  @Role(Roles.Admin)
  getSelectedUserProduct(@Body() dto: GetProductByUserIdDTO) {
    return this.productService.getSelectedUserProduct(dto);
  }

  @Post('updateUserProductByAdmin')
  @Role(Roles.Admin)
  updateUserProductByAdmin(@Body() dto: UpdateUserProductAdminDTO) {
    return this.productService.updateUserProductByAdmin(dto);
  }

  @Post('updateProduct')
  @Role(Roles.Client)
  async updateProduct(@Res() res: Response, @Body() dto: UpdateProduct) {
    try {
      const data = {
        title: dto.title,
        description: dto.description ?? '',
      };
      const product = await this.productService.updateProductBySKU(
        dto.sku,
        data,
      );

      return res
        .status(200)
        .send(
          this.sharedService.sendResponse(
            null,
            true,
            `Product has been updated`,
          ),
        );
    } catch (error) {
      return res
        .status(500)
        .send(this.sharedService.sendResponse('Something went wrong.', false));
    }
  }

  @Post('updateProductQuantity')
  @Role(Roles.Client)
  async updateProductQuantity(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: updateProductQuantityDTO,
  ) {
    try {
      const product = await this.productService.getProductBySKU(dto.sku);
      const data = {
        Name: product.title,
        SKU: dto.sku,
        Quantity: dto.newQuantity,
        Price: product.price,
        Weight: product.weight,
      };
      const headers = Object.keys(data);

      const csv = await this.sharedService.generateCsv(
        [data],
        `uploads/products`,
        headers,
      );

      const newProductUpload = await this.productService.uploadProductListing(
        req['user'].id,
        csv,
      );

      return res
        .status(200)
        .send(
          this.sharedService.sendResponse(
            '',
            true,
            'Products has been uploaded for quantity update',
          ),
        );
    } catch (error) {
      return res
        .status(500)
        .send(this.sharedService.sendResponse('', false, error.message));
    }
  }

  @Post('addNewProduct')
  @Role(Roles.Client)
  async addNewProduct(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: ProductCSVDto,
  ) {
    try {
      const product = await this.productService.getProductBySKU(dto.SKU);

      if (product) {
        return res
          .status(500)
          .send(
            this.sharedService.sendResponse(
              null,
              false,
              'Product already exist with the given SKU.',
            ),
          );
      }

      const data = {
        Name: dto.Name,
        SKU: dto.SKU,
        Description: dto.Description ?? '',
        Quantity: dto.Quantity,
        Price: dto.Price,
        Weight: dto.Weight,
      };

      const headers = Object.keys(data);

      const csv = await this.sharedService.generateCsv(
        [data],
        `uploads/products`,
        headers,
      );

      const newProductUpload = await this.productService.uploadProductListing(
        req['user'].id,
        csv,
      );

      return res
        .status(200)
        .send(
          this.sharedService.sendResponse(
            '',
            true,
            'Products has been uploaded for quantity update',
          ),
        );
    } catch (error) {
      return res
        .status(500)
        .send(
          this.sharedService.sendResponse(null, false, 'Something went wrong.'),
        );
    }
  }

  @Post('uploadProductImage')
  @Role(Roles.Client)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/productsImage',
        filename: (req, file, callback) => {
          const unique = Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const fileName = `${unique}${ext}`;
          callback(null, fileName);
        },
      }),
    }),
  )
  async uploadProductImage(
    @UploadedFile()
    file: Express.Multer.File,
    @Res() res: Response,
    @Body('productSKU') sku: string,
  ) {
    try {
      const product = await this.productService.getProductBySKU(sku);
      if (product.image) {
        await deleteFile(`uploads\\productsImage\\${product.image}`);
      }

      const update = await this.productService.updateProductBySKU(sku, {
        image: file.filename,
      });

      return res
        .status(200)
        .send(
          this.sharedService.sendResponse(
            null,
            true,
            'Image updated sucessfully.',
          ),
        );
    } catch (error) {
      await deleteFile(file.path);
      return res
        .status(500)
        .send(
          this.sharedService.sendResponse(null, false, 'Something went wrong.'),
        );
    }
  }
}
