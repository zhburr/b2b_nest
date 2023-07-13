// csv-validation.pipe.ts
import {
  Injectable,
  PipeTransform,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as csv from 'csv-parser';
import * as fs from 'fs';

@Injectable()
export class CsvValidationPipe implements PipeTransform<any> {
  constructor(private readonly dtoClass: any) {}
  async transform(value: any) {
    if (!value) return [];
    const transformedValue = [];
    const file = value;

    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(value.path);
      fileStream
        .pipe(csv())
        .on('data', (data) => {
          const transformedData = plainToInstance(this.dtoClass, data);
          validate(transformedData).then((errors) => {
            if (errors.length > 0) {
              fs.unlink(file.path, (err) => {
                if (err) {
                  console.error(err);
                }
              });
              reject(new ForbiddenException(errors));
            }
            transformedValue.push(transformedData);
          });
        })
        .on('end', () => {
          resolve(file);
        })
        .on('error', (error) => {
          fs.unlink(file.path, (err) => {
            if (err) {
              console.error(err);
            }
          });
          reject(error);
        });
    });
  }
}
