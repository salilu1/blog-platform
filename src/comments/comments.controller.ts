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

  // Create comment on post
  @UseGuards(JwtAuthGuard)
  @Post('posts/:postId/comments')
  create(
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
    @Req() req,
  ) {
    return this.commentsService.create(postId, dto, req.user);
  }

  // Get comments of a post (with nested replies)
  @Get('posts/:postId/comments')
  findByPost(@Param('postId') postId: string) {
    return this.commentsService.findByPost(postId);
  }

  // Update comment
  @UseGuards(JwtAuthGuard)
  @Patch('comments/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @Req() req,
  ) {
    return this.commentsService.update(id, dto, req.user);
  }

  // Delete comment
  @UseGuards(JwtAuthGuard)
  @Delete('comments/:id')
  remove(@Param('id') id: string, @Req() req) {
    return this.commentsService.remove(id, req.user);
  }

  // Like comment
  @UseGuards(JwtAuthGuard)
  @Post('comments/:id/like')
  like(@Param('id') id: string, @Req() req) {
    return this.commentsService.likeComment(id, req.user);
  }

  // Unlike comment
  @UseGuards(JwtAuthGuard)
  @Post('comments/:id/unlike')
  unlike(@Param('id') id: string, @Req() req) {
    return this.commentsService.unlikeComment(id, req.user);
  }
}