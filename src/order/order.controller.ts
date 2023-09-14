import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrderService } from './order.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CsvValidationPipe } from 'src/auth/csv-validation.pipe';
import {
  OrderCSVDTO,
  OrderLineCSVDTO,
  OrderLinePaginationDTO,
  UpdateOrderDTO,
  UpdateOrderLineDTO,
  UpsertPostageDTO,
} from './dto';
import { Roles as Role } from 'src/roles.decorator';
import { Roles } from '@prisma/client';
import { Response, Request } from 'express';
import { SharedService } from 'src/shared/shared.service';
import { deleteFile, getFile } from 'src/common/helper';
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Public } from 'src/public.decorator';

@Controller('order')
export class OrderController {
  constructor(
    private orderService: OrderService,
    private sharedService: SharedService,
    private userService: UserService,
    private prisma: PrismaService,
  ) {}

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

  @Get('getUserOrderList')
  @Role(Roles.Client)
  getUserOrderList(@Req() req: Request, @Res() res: Response) {
    try {
      const data = this.orderService.getUserOrderList(req['user']);
      return res.status(200).send(this.sharedService.sendResponse(data, true));
    } catch (error) {
      return res
        .status(500)
        .send(this.sharedService.sendResponse('', false, error.message));
    }
  }

  @Get('getOrderById')
  @Role(Roles.Client, Roles.Admin)
  async getOrderById(
    @Req() req: Request,
    @Res() res: Response,
    @Query('orderId') orderId: string,
  ) {
    try {
      if (req['user'].role === Roles.Client) {
        const orderIdExists = await this.orderService.checkUserOrderId(
          req['user'].id,
          Number(orderId),
        );

        if (!orderIdExists) {
          return res
            .status(500)
            .send(
              this.sharedService.sendResponse(
                '',
                false,
                'Order does not exsist',
              ),
            );
        }
      }

      const order = await this.orderService.getOrderById(
        Number(orderId),
        req['user'].role === Roles.Admin,
      );

      if (!order) {
        return res
          .status(500)
          .send(
            this.sharedService.sendResponse('', false, 'Order does not exsist'),
          );
      }
      return res.status(200).send(this.sharedService.sendResponse(order, true));
    } catch (error) {
      return res
        .status(500)
        .send(this.sharedService.sendResponse('', false, error.message));
    }
  }

  @Get('getAllPendingOrderList')
  @Role(Roles.Admin)
  async getAllOrderList(@Res() res: Response) {
    try {
      const orderList = await this.orderService.getAllPendingOrder();
      return res
        .status(200)
        .send(this.sharedService.sendResponse(orderList, true));
    } catch (error) {
      return res
        .status(500)
        .send(this.sharedService.sendResponse('', false, error.message));
    }
  }

  @Get('getInVoiceData')
  @Role(Roles.Admin)
  async getInvoiceData(
    @Req() req: Request,
    @Res() res: Response,
    @Query('orderId') orderId: string,
  ) {
    try {
      const order = await this.orderService.getOrderById(Number(orderId), true);
      if (!order) {
        res
          .status(500)
          .send(this.sharedService.sendResponse('', false, 'Order not found'));
      }
      const invoiceData = await this.orderService.getInvoiceData(order);
      const userData = await this.orderService.getUserById(order.userId);
      return res
        .status(200)
        .send(this.sharedService.sendResponse({ invoiceData, userData }, true));
    } catch (error) {
      return res
        .status(500)
        .send(this.sharedService.sendResponse('', false, error.message));
    }
  }

  @Post('uploadInvoice')
  @Role(Roles.Admin)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/invoices',
        filename: (req, file, callback) => {
          const unique = Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const fileName = `${unique}${ext}`;
          callback(null, fileName);
        },
      }),
    }),
  )
  async uploadInvoice(
    @Res() res: Response,
    @UploadedFile()
    file: Express.Multer.File,
    @Body('orderId') orderId: string,
    @Body('totalAmount') totalAmount: string,
  ) {
    try {
      await this.prisma.$transaction(async (tx) => {
        // const order = await this.orderService.updateOrderField(
        //   Number(orderId),
        //   {
        //     totalAmount: Number(totalAmount),
        //     invoice: file.filename,
        //   },
        // );

        // const updateData = {
        //   balance: {
        //     increment: totalAmount,
        //   },
        // };
        // await this.userService.updateUserFields(order.userId, updateData);

        const order = await tx.orderUpload.update({
          where: { id: Number(orderId) },
          data: {
            totalAmount: Number(totalAmount),
            invoice: file.filename,
          },
        });

        const user = await tx.user.update({
          where: {
            id: order.userId,
          },
          data: {
            balance: {
              increment: Number(totalAmount),
            },
          },
        });

        await this.sharedService.sendEmail(
          user.email,
          `B2B Direct invoice`,
          `<p>B2B Direct invoice against order id ${order.id} has been generate.Login to your account and check details.</p>
          <p>Regards</p>
          <p>B2BDirect</p>
          `,
        );
      });
      return res
        .status(200)
        .send(
          this.sharedService.sendResponse(
            '',
            true,
            'Invoice saved sucessfully',
          ),
        );
    } catch (error) {
      console.log(error);

      await deleteFile(file.path);
      return res
        .status(500)
        .send(
          this.sharedService.sendResponse(
            '',
            false,
            'Something went wrong.Try again later.',
          ),
        );
    }
  }

  @Post('updateOrder')
  @Role(Roles.Admin)
  async updateOrder(@Res() res: Response, @Body() dto: UpdateOrderDTO) {
    try {
      await this.orderService.updateOrderField(dto.orderId, {
        paid: dto.paid,
        delivered: dto.delivered,
      });

      return res
        .status(200)
        .send(
          this.sharedService.sendResponse(
            '',
            true,
            'Order updated sucessfully',
          ),
        );
    } catch (error) {
      return res
        .status(500)
        .send(this.sharedService.sendResponse('', false, error.message));
    }
  }

  @Post('getOrderLinesByOrderId')
  @Role(Roles.Admin)
  async getOrderLinesByOrderId(
    @Res() res: Response,
    dto: OrderLinePaginationDTO,
  ) {
    try {
      const orderLines = await this.orderService.getOrderLine(
        dto.orderId,
        dto.pageIndex,
        dto.pageSize,
      );

      return res
        .status(200)
        .send(this.sharedService.sendResponse(orderLines, true));
    } catch (error) {
      return res
        .status(500)
        .send(this.sharedService.sendResponse('', false, error.message));
    }
  }

  @Post('updateOrderLine')
  @Role(Roles.Admin)
  async updateOrderLine(@Res() res: Response, @Body() dto: UpdateOrderLineDTO) {
    try {
      await this.orderService.updateOrderLineField(dto.orderLineId, {
        trackingNo: dto.trackingNo,
        trackingCompany: dto.trackingCompany,
      });

      return res
        .status(200)
        .send(
          this.sharedService.sendResponse(
            '',
            true,
            'Order line has been updated sucessfully',
          ),
        );
    } catch (error) {
      console.log(dto);
      return res
        .status(500)
        .send(this.sharedService.sendResponse('', false, error.message));
    }
  }

  @Post('addOrderTracking')
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
  @Role(Roles.Admin)
  async addOrderTracking(
    @Req() req: Request,
    @Res() res: Response,
    @UploadedFile()
    file: Express.Multer.File,
    @Body('orderId') orderId: string,
  ) {
    try {
      const getfile: any = await getFile(file.path);
      const json: OrderLineCSVDTO[] = await this.sharedService.parseCsvFile(
        getfile,
        OrderLineCSVDTO,
      );

      await this.prisma.$transaction(
        async (tx) => {
          for (let orderLine of json) {
            console.log(orderLine, 'input');

            const data = await tx.orderLine.update({
              where: {
                id: orderLine.Orderline,
              },
              data: {
                trackingCompany: orderLine.Tracking_company ?? undefined,
                trackingNo: orderLine.Tracking_number ?? undefined,
              },
            });
            console.log(data, 'data');
          }
        },
        { timeout: 200000 },
      );

      await deleteFile(file.path);
      return res
        .status(200)
        .send(
          this.sharedService.sendResponse(
            '',
            true,
            'Tracking added sucessfully.',
          ),
        );
    } catch (error) {
      console.log(error);

      await deleteFile(file.path);
      return res
        .status(500)
        .send(
          this.sharedService.sendResponse(
            '',
            false,
            'Something went wrong.Try again later.',
          ),
        );
    }
  }

  // addOrderTracking

  @Get('getUserOrders')
  @Role(Roles.Admin)
  async getUserOrders(@Res() res: Response, @Query('email') email: string) {
    try {
      const orders = await this.orderService.getUserOrderByEmail(email);

      return res
        .status(200)
        .send(this.sharedService.sendResponse(orders, true));
    } catch (error) {
      return res
        .status(500)
        .send(this.sharedService.sendResponse('', false, error.message));
    }
  }
}
