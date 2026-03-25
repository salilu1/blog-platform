import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
// Import your Guards (assuming you have them set up)
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard) // Uncomment these when your Auth is ready
  @Roles('ADMIN') 
  async getStats() {
    return this.adminService.getDashboardStats();
  }
}