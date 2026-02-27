import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { User, Role } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(postId: string, dto: CreateCommentDto, user: User) {
    return this.prisma.comment.create({
      data: {
        content: dto.content,
        postId,
        authorId: user.id,
        parentId: dto.parentId ?? null,
      },
    });
  }

  async findByPost(postId: string) {
    return this.prisma.comment.findMany({
      where: {
        postId,
        parentId: null, // only root comments
      },
      include: {
        author: true,
        likes: true,
        replies: {
          include: {
            author: true,
            likes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: true,
        likes: true,
        replies: true,
      },
    });

    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  async update(id: string, dto: UpdateCommentDto, user: User) {
    const comment = await this.findOne(id);

    if (user.role !== Role.ADMIN && comment.authorId !== user.id) {
      throw new ForbiddenException('You cannot edit this comment');
    }

    return this.prisma.comment.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, user: User) {
    const comment = await this.findOne(id);

    if (user.role !== Role.ADMIN && comment.authorId !== user.id) {
      throw new ForbiddenException('You cannot delete this comment');
    }

    return this.prisma.comment.delete({
      where: { id },
    });
  }

//   async likeComment(commentId: string, user: User) {
//   try {
//     return await this.prisma.like.create({
//       data: {
//         commentId,
//         userId: user.id,
//       },
//     });
//   } catch (error) {
//     if (
//       error instanceof Prisma.PrismaClientKnownRequestError &&
//       error.code === 'P2002'
//     ) {
//       throw new BadRequestException('You already liked this comment');
//     }
//     throw error;
//   }
// }
async likeComment(commentId: string, user: User) {
  const existing = await this.prisma.like.findFirst({
    where: {
      commentId,
      userId: user.id,
    },
  });

  if (existing) {
    await this.prisma.like.delete({
      where: { id: existing.id },
    });
    return { liked: false };
  }

  await this.prisma.like.create({
    data: {
      commentId,
      userId: user.id,
    },
  });
  return { liked: true };
}

  async unlikeComment(commentId: string, user: User) {
    return this.prisma.like.deleteMany({
      where: {
        commentId,
        userId: user.id,
      },
    });
  }
}