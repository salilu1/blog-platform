import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Make sure PrismaModule is exported from its file

@Module({
  imports: [PrismaModule], // This allows AdminService to use Prisma
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}