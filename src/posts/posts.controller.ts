import {
  Controller,
  Get,
  Post as HttpPost,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // 🔹 Shared upload configuration
  private static multerOptions = {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix =
          Date.now() + '-' + Math.round(Math.random() * 1e9);
        callback(null, uniqueSuffix + extname(file.originalname));
      },
    }),
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
        return callback(
          new BadRequestException(
            'Only JPG, JPEG, PNG images and PDF files are allowed',
          ),
          false,
        );
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  };

  /** Admin creates a new post (optional file upload) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpPost()
  @UseInterceptors(FileInterceptor('file', PostsController.multerOptions))
  create(
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    return this.postsService.create(createPostDto, req.user, file);
  }

  /** Get all posts with optional skip, take, search */
  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    return this.postsService.findAll(
      Number(skip) || 0,
      Number(take) || 10,
      search,
    );
  }

  /** Get a single post by ID */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  /** Admin updates a post (optional file upload) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', PostsController.multerOptions))
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    return this.postsService.update(id, updatePostDto, req.user, file);
  }

  /** Admin deletes a post */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.postsService.remove(id, req.user);
  }

  /** Toggle like/unlike for logged-in users */
  @UseGuards(JwtAuthGuard)
  @HttpPost(':id/like')
  toggleLike(@Param('id') id: string, @Req() req) {
    return this.postsService.toggleLike(id, req.user);
  }
}