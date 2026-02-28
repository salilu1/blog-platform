import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /** Create comment or reply */
  @UseGuards(JwtAuthGuard)
  @Post('posts/:postId/comments')
  async create(@Param('postId') postId: string, @Body() dto: CreateCommentDto, @Req() req) {
    return this.commentsService.create(postId, dto, req.user);
  }

  /** Get all comments of a post */
  @Get('posts/:postId/comments')
  async findByPost(@Param('postId') postId: string) {
    return this.commentsService.findByPost(postId);
  }

  /** Update a comment */
  @UseGuards(JwtAuthGuard)
  @Patch('comments/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateCommentDto, @Req() req) {
    return this.commentsService.update(id, dto, req.user);
  }

  /** Delete a comment */
  @UseGuards(JwtAuthGuard)
  @Delete('comments/:id')
  async remove(@Param('id') id: string, @Req() req) {
    return this.commentsService.remove(id, req.user);
  }

  /** Toggle like/unlike on comment */
  @UseGuards(JwtAuthGuard)
  @Post('comments/:id/like')
  async toggleLike(@Param('id') id: string, @Req() req) {
    return this.commentsService.toggleLike(id, req.user);
  }

  /** Remove like from comment */
  @UseGuards(JwtAuthGuard)
  @Post('comments/:id/unlike')
  async unlike(@Param('id') id: string, @Req() req) {
    return this.commentsService.unlike(id, req.user);
  }
}