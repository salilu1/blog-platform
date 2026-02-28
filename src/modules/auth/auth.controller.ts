import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

interface LoginDto {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto): Promise<LoginResponse> {
    // validate credentials and get user without password
    const user = await this.authService.validateUser(body.email, body.password);
    // return access token + user
    return this.authService.login(user);
  }
}