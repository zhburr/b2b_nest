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
  UpdateProductApprovalStatus,
  UpdateUserProductAdminDTO,
  updateProductQuantityDTO,
} from './dto';
import { Response, Request } from 'express';
import { Roles as Role } from 'src/roles.decorator';
import { Roles } from '@prisma/client';
import { SharedService } from 'src/shared/shared.service';

@Controller('product')
export class ProductController {
  constructor(
    private productService: ProductService,
    private sharedService: SharedService,
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
  uploadProductListing(
    @UploadedFile()
    file: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const newProductUpload = this.productService.uploadProductListing(
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
      return res
        .status(500)
        .send(this.sharedService.sendResponse('', false, error.message));
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
  updateProduct() {
    try {
    } catch (error) {}
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
      const csv = await this.sharedService.createCsv(
        [data],
        'uploads/products',
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
}
