import {
  Body,
  Controller,
  Get,
  Post,
  Req,
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
} from './dto';
import { Request } from 'express';
import { Roles as Role } from 'src/roles.decorator';
import { Roles } from '@prisma/client';

@Controller('product')
export class ProductController {
  constructor(private productService: ProductService) {}

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
  ) {
    return this.productService.uploadProductListing(req['user'], file);
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
}
