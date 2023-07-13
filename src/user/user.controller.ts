import { Body, Controller, Get, Post } from '@nestjs/common';
import { Roles } from '@prisma/client';
import { Roles as Role } from 'src/roles.decorator';
import { UserService } from './user.service';
import { UpdateUserDTO } from './dto';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('getAllUsers')
  @Role(Roles.Admin)
  getAllUsers() {
    return this.userService.getAllUser();
  }

  @Post('updateUser')
  @Role(Roles.Admin)
  updateUser(@Body() dto: UpdateUserDTO) {
    return this.userService.updateUser(dto);
  }
}
