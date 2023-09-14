import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as csvParser from 'csv-parser';
import { createFile } from 'src/common/helper';
@Injectable()
export class SharedService {
  constructor(private mailService: MailerService) {}
  generateRandomOtp(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }

  unique() {
    return Math.round(Math.random() * 1e9);
  }

  async sendEmail(toEmail: string, subject: string, emailHtml: string) {
    await this.mailService.sendMail({
      from: '"B2B Direct" <zohaib.ur.rehman97@gmail.com>',
      to: toEmail, // list of receivers
      subject: subject, // Subject line
      text: '',
      html: emailHtml,
    });
  }

  sendResponse<Type>(
    body: Type,
    succeed: boolean,
    message?: string,
  ): { Content: Type; Succeed: boolean; message?: string } {
    return {
      Content: body,
      Succeed: succeed,
      message: message,
    };
  }

  parseCsvFile = (
    fileBuffer: Buffer,
    validationClass?: any,
  ): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const results = [];

      const parser = csvParser({ separator: ',' });

      parser.on('data', (data) => {
        if (validationClass) {
          const transformedData = plainToInstance(validationClass, data);
          validate(transformedData).then((errors) => {
            results.push(transformedData);
          });
        } else {
          results.push(data);
        }
      });

      parser.on('end', () => {
        resolve(results);
      });

      parser.on('error', (error) => {
        console.log(error, 'error');

        reject(error);
      });

      parser.write(fileBuffer);
      parser.end();
    });
  };

  async createCsv(data: any[], path: string): Promise<string> {
    console.log(data);

    const csvRows = [];

    // Create the CSV header row
    const header = Object.keys(data[0]).join(',');
    csvRows.push(header);

    // Create CSV data rows
    data.forEach((item) => {
      console.log(item);

      const row = Object.values(item).join(',');
      csvRows.push(row);
    });

    // Join rows with line breaks to create the CSV content
    const csvContent = csvRows.join('\n');
    const fileName = `${this.unique()}.csv`;

    // Write CSV content to the file
    await createFile(path, fileName, csvContent);
    return fileName;
  }
}
