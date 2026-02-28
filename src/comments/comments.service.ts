import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { User, Role } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  /** Create a comment or reply */
  async create(postId: string, dto: CreateCommentDto, user: User) {
    // Check post existence
    const postExists = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!postExists) throw new NotFoundException('Post not found');

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        postId,
        authorId: user.id,
        parentId: dto.parentId ?? null, // null for root comments
      },
      include: { author: true, likes: true, replies: true },
    });
  }

  /** Fetch all comments for a post (root comments with nested replies) */
  async findByPost(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId, parentId: null }, // root comments
      include: {
        author: true,
        likes: true,
        replies: {
          include: { author: true, likes: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Get single comment with author, likes, and replies */
  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: true,
        likes: true,
        replies: { include: { author: true, likes: true } },
      },
    });

    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  /** Update a comment (author or admin) */
  async update(id: string, dto: UpdateCommentDto, user: User) {
    const comment = await this.findOne(id);

    if (user.role !== Role.ADMIN && comment.authorId !== user.id) {
      throw new ForbiddenException('You cannot edit this comment');
    }

    return this.prisma.comment.update({
      where: { id },
      data: dto,
      include: { author: true, likes: true, replies: true },
    });
  }

  /** Delete a comment (author or admin) */
  async remove(id: string, user: User) {
    const comment = await this.findOne(id);

    if (user.role !== Role.ADMIN && comment.authorId !== user.id) {
      throw new ForbiddenException('You cannot delete this comment');
    }

    return this.prisma.comment.delete({ where: { id } });
  }

  /** Toggle like/unlike on a comment */
  async toggleLike(commentId: string, user: User) {
    const existing = await this.prisma.like.findFirst({
      where: { commentId, userId: user.id },
    });

    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } });
      return { liked: false };
    }

    await this.prisma.like.create({ data: { commentId, userId: user.id } });
    return { liked: true };
  }

  /** Just remove a like from a comment */
  async unlike(commentId: string, user: User) {
    await this.prisma.like.deleteMany({ where: { commentId, userId: user.id } });
    return { unliked: true };
  }
}