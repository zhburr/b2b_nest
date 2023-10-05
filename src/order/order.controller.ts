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
  createLabelDTO,
} from './dto';
import { Roles as Role } from 'src/roles.decorator';
import { PaymentType, Roles } from '@prisma/client';
import { Response, Request } from 'express';
import { SharedService } from 'src/shared/shared.service';
import { deleteFile, getFile } from 'src/common/helper';
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Public } from 'src/public.decorator';
import * as ExcelJS from 'exceljs';
import { AddNewPaymentDTO } from 'src/user/dto';

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
  async upsertPostage(@Body() dto: UpsertPostageDTO, @Res() res: Response) {
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
        return res
          .status(200)
          .send(
            this.sharedService.sendResponse(
              null,
              false,
              'This combination already exist.',
            ),
          );
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

        return res
          .status(200)
          .send(
            this.sharedService.sendResponse(
              upsertPostage,
              true,
              'Postage upsert sucessfully ',
            ),
          );
      }
    } catch (error) {
      return res
        .status(500)
        .send(
          this.sharedService.sendResponse({}, false, 'Somehting went wrong.'),
        );
    }
  }

  @Post('upsertLabelPrice')
  @Role(Roles.Admin)
  async upsertLabelPrice(@Body() dto: UpsertPostageDTO, @Res() res: Response) {
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
        return res
          .status(200)
          .send(
            this.sharedService.sendResponse(
              null,
              false,
              'This combination already exist.',
            ),
          );
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

  @Get('getAllLabelPrice')
  @Role(Roles.Admin, Roles.Client)
  getAllLablePrice() {
    return this.orderService.getAllLabelPrice();
  }

  @Get('getUserOrderList')
  @Role(Roles.Client)
  async getUserOrderList(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.orderService.getUserOrderList(req['user']);
      return res.status(200).send(this.sharedService.sendResponse(data, true));
    } catch (error) {
      return res
        .status(500)
        .send(
          this.sharedService.sendResponse('', false, 'Something went wrong.'),
        );
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
        .send(
          this.sharedService.sendResponse(
            { invoiceData, userData, hasInvoice: !!order.invoice },
            true,
          ),
        );
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
        const order = await tx.orderUpload.update({
          where: { id: Number(orderId) },
          data: {
            totalAmount: Number(totalAmount),
            invoice: file.filename,
          },
        });

        const latestPayment = await tx.payment.findFirst({
          where: {
            userId: order.userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        const addNewPayment = await tx.payment.create({
          data: {
            userId: order.userId,
            paymentType: PaymentType.Debit,
            amount: totalAmount,
            description: `Debited amount for the order ${orderId}`,
            availableBalance: latestPayment
              ? Number(latestPayment.availableBalance) - Number(totalAmount)
              : Number(totalAmount) * -1,
          },
        });

        const user = await tx.user.findUnique({
          where: { id: order.userId },
        });

        await this.sharedService.sendEmail(
          user.email,
          `B2B Direct invoice`,
          `<p>B2B Direct invoice against order id ${order.id} has been generate.Login to your account and check details.</p>
          <p>Regards</p>
          <p>B2B Direct</p>
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

      if (dto.paid) {
        const order = await this.orderService.getOrderById(dto.orderId, false);
        const getUser = await this.prisma.user.findUnique({
          where: {
            id: order.userId,
          },
        });

        const data: AddNewPaymentDTO = {
          email: getUser.email,
          paymentType: 'Credit',
          amount: Number(order.totalAmount),
          description: `Amount credited for the order ${order.id}`,
        };

        await this.userService.addNewPayment(data);
      }

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
            const data = await tx.orderLine.update({
              where: {
                id: orderLine.Orderline,
              },
              data: {
                trackingCompany: orderLine.Tracking_company ?? undefined,
                trackingNo: orderLine.Tracking_number ?? undefined,
              },
            });
          }
        },
        { timeout: 200000 },
      );

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

  @Get('getOrderLineExcelFile')
  @Role(Roles.Admin)
  async getColouredExcelFile(
    @Res() res: Response,
    @Query('orderId') orderId: string,
  ) {
    try {
      const orderLine = await this.prisma.orderLine.findMany({
        where: {
          orderId: Number(orderId),
        },
        include: {
          product: true,
        },
      });
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      worksheet.columns = [
        { header: 'Name', key: 'buyerName', width: 15 },
        { header: 'Address1`', key: 'buyerAddress1', width: 20 },
        { header: 'Address2`', key: 'buyerAddress2', width: 20 },
        { header: 'Country`', key: 'buyerCountry', width: 20 },
        { header: 'City`', key: 'buyerCity', width: 20 },
        { header: 'Postcode`', key: 'buyerPostCode', width: 10 },
        { header: 'Product SKU', key: 'productSku', width: 20 },
        { header: 'Product quantity', key: 'productQuantity', width: 10 },
        { header: 'Product location', key: 'productlocation', width: 20 },
      ];

      orderLine.forEach((row) => {
        const newRow = { ...row, productlocation: row.product?.location };
        worksheet.addRow(newRow);
      });
      const postcodes: { [postcode: string]: ExcelJS.Row[] } = {};
      worksheet.eachRow({ includeEmpty: true }, (row: any, rowNumber: any) => {
        if (rowNumber === 1) return; // Skip header row
        const postcode = row.getCell('buyerPostCode').value as string;
        if (postcodes[postcode]) {
          postcodes[postcode].push(row);
        } else {
          postcodes[postcode] = [row];
        }
      });
      // Apply highlighting to rows with the same postcode
      Object.values(postcodes).forEach((rows) => {
        if (rows.length > 1) {
          rows.forEach((row) => {
            row.eachCell((cell: any) => {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFF0000' },
              };
            });
          });
        }
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${orderId}.xlsx`,
      );
      const buffer = await workbook.xlsx.writeBuffer();
      res.end(buffer);
    } catch (error) {
      return res
        .status(200)
        .send(
          this.sharedService.sendResponse(null, false, 'Something went wrong.'),
        );
    }
  }

  @Post('createLabelOrder')
  @Role(Roles.Client)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/labels',
        filename: (req, file, callback) => {
          const unique = Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const fileName = `${unique}${ext}`;
          callback(null, fileName);
        },
      }),
    }),
  )
  async createLabelOrder(
    @UploadedFile()
    file: Express.Multer.File,
    @Body() dto: createLabelDTO,
    @Res() res: Response,
  ) {
    try {
      const createLabelOrder = await this.prisma.labelOrders.create({
        data: {
          weight_from: dto.weight_from,
          weight_to: dto.weight_to,
          price: dto.price,
          inputFile: file.filename,
          quantity: dto.quantity,
          userId: dto.userId,
        },
      });

      const adminUsers = await this.prisma.user.findMany({
        where: {
          role: Roles.Admin,
        },
      });

      const emailHtml = `
      <p>A print label order has been placed.Please visit the website to see the details.</p>
      `;
      for (let admin of adminUsers) {
        await this.sharedService.sendEmail(
          admin.email,
          'Print label order',
          emailHtml,
        );
      }

      return res
        .status(200)
        .send(
          this.sharedService.sendResponse(
            null,
            true,
            'Label order has been placed',
          ),
        );
    } catch (error) {
      return res
        .status(200)
        .send(
          this.sharedService.sendResponse(null, false, 'Something went wrong.'),
        );
    }
  }

  @Get('getLabelOrderList')
  @Role(Roles.Client)
  async getLabelOrderList(@Res() res: Response, @Query('email') email: string) {
    try {
      const list = await this.prisma.labelOrders.findMany({
        where: {
          user: {
            email,
          },
        },
      });

      return res.status(200).send(this.sharedService.sendResponse(list, true));
    } catch (error) {
      return res
        .status(500)
        .send(
          this.sharedService.sendResponse(null, false, 'Somehting went wrong.'),
        );
    }
  }

  @Post('getAllLabelOrderList')
  @Role(Roles.Admin)
  async getALlLabelOrderList(@Res() res: Response, @Body('all') all: boolean) {
    try {
      let whereClause = {};
      if (!all) {
        whereClause = {
          deliverd: false,
        };
      }

      const list = await this.prisma.labelOrders.findMany({
        where: whereClause,
        include: {
          user: true,
        },
      });

      return res.status(200).send(this.sharedService.sendResponse(list, true));
    } catch (error) {
      return res
        .status(500)
        .send(
          this.sharedService.sendResponse(null, false, 'Somehting went wrong.'),
        );
    }
  }

  @Post('updateLabelOrder')
  @Role(Roles.Admin)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/labels',
        filename: (req, file, callback) => {
          const unique = Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const fileName = `${unique}${ext}`;
          callback(null, fileName);
        },
      }),
    }),
  )
  async updateLabelOrder(
    @UploadedFile()
    file: Express.Multer.File,
    @Res() res: Response,
    @Body('labelId') id: string,
  ) {
    try {
      const update = await this.prisma.labelOrders.update({
        where: {
          id: Number(id),
        },
        data: {
          outputFile: file.filename,
          deliverd: true,
        },
      });

      return res
        .status(200)
        .send(
          this.sharedService.sendResponse(
            null,
            true,
            'File uploaded sucessfully.',
          ),
        );
    } catch (error) {
      return res
        .status(200)
        .send(
          this.sharedService.sendResponse(null, false, 'Something went wrong.'),
        );
    }
  }
}
