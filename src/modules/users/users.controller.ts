import {
  Controller,
  Get,
  UseGuards,
  Post,
  Body,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Public registration
  @Post()
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // Logged-in user profile
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  // Admin-only endpoint
  @UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Get('all')
getAllUsers() {
  return this.usersService.findAll();
}
//   @UseGuards(JwtAuthGuard)
//   @Roles(Role.ADMIN)
//   @Get('all')
//   getAllUsers() {
//     return this.usersService.findAll();
//   }
}