import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { User, Role } from '@prisma/client';

/** Type for comments with nested replies */
export interface CommentWithReplies {
  id: string;
  content: string;
  parentId: string | null;
  postId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  likes: { userId: string }[];
  replies: CommentWithReplies[];
}

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  /** Create a comment or reply */
  async create(postId: string, dto: CreateCommentDto, user: User) {
    // Check if the post exists
    const postExists = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!postExists) throw new NotFoundException('Post not found');

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        postId,
        authorId: user.id,
        parentId: dto.parentId ?? null,
      },
      include: {
        author: true,
        likes: true,
      },
    });
  }

  /** Fetch all root comments with nested replies recursively */
  async findByPost(postId: string): Promise<CommentWithReplies[]> {
    // Fetch root comments
    const rootComments = await this.prisma.comment.findMany({
      where: { postId, parentId: null },
      include: { author: true, likes: true },
      orderBy: { createdAt: 'asc' },
    });

    // Recursive function to fetch replies
    const fetchReplies = async (parentId: string): Promise<CommentWithReplies[]> => {
      const replies = await this.prisma.comment.findMany({
        where: { parentId },
        include: { author: true, likes: true },
        orderBy: { createdAt: 'asc' },
      });

      return await Promise.all(
        replies.map(async (r) => ({
          ...r,
          replies: await fetchReplies(r.id),
        }))
      );
    };

    return await Promise.all(
      rootComments.map(async (c) => ({
        ...c,
        replies: await fetchReplies(c.id),
      }))
    );
  }

  /** Get a single comment with nested replies */
  async findOne(id: string): Promise<CommentWithReplies> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { author: true, likes: true },
    });

    if (!comment) throw new NotFoundException('Comment not found');

    // Add nested replies
    const fetchReplies = async (parentId: string): Promise<CommentWithReplies[]> => {
      const replies = await this.prisma.comment.findMany({
        where: { parentId },
        include: { author: true, likes: true },
        orderBy: { createdAt: 'asc' },
      });

      return await Promise.all(
        replies.map(async (r) => ({
          ...r,
          replies: await fetchReplies(r.id),
        }))
      );
    };

    return { ...comment, replies: await fetchReplies(comment.id) };
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
      include: { author: true, likes: true },
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

  /** Remove like from comment */
  async unlike(commentId: string, user: User) {
    await this.prisma.like.deleteMany({ where: { commentId, userId: user.id } });
    return { unliked: true };
  }
}