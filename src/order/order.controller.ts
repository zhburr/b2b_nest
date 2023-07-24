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
import { FileInterceptor } from '@nestjs/platform-express';
import { OrderService } from './order.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CsvValidationPipe } from 'src/auth/csv-validation.pipe';
import { OrderCSVDTO, UpsertPostageDTO } from './dto';
import { Roles as Role } from 'src/roles.decorator';
import { Roles } from '@prisma/client';

@Controller('order')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post('uploadOrder')
  @Role(Roles.Client)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/orders',
        filename: (req, file, callback) => {
          const unique = Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const fileName = `${unique}${ext}`;
          callback(null, fileName);
        },
      }),
    }),
  )
  @UsePipes(new CsvValidationPipe(OrderCSVDTO))
  uploadOrder(
    @UploadedFile()
    file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.orderService.uploadOrder(req['user'], file);
  }

  @Get('getAllPostage')
  @Role(Roles.Admin)
  getAllPostage() {
    return this.orderService.getAllPostage();
  }

  @Post('upsertPostage')
  @Role(Roles.Admin)
  upsertPostage(@Body() dto: UpsertPostageDTO) {
    return this.orderService.upsertPostage(dto);
  }
}
