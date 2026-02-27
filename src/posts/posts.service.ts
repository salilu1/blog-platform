import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User, Role } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}
  async findOne(id: string) {
  const post = await this.prisma.post.findUnique({
    where: { id },
    include: {
      author: true,
      likes: true,
      comments: true,
    },
  });

  if (!post) {
    throw new NotFoundException('Post not found');
  }

  return post;
}

  async create(createPostDto: CreatePostDto, user: User) {
    return this.prisma.post.create({
      data: {
        ...createPostDto,
        authorId: user.id,
      },
    });
  }

  async findAll(skip = 0, take = 10, search?: string) {
  return this.prisma.post.findMany({
    skip,
    take,
    where: search
      ? {
          title: { contains: search },
        }
      : undefined,
    include: {
      author: true,
      likes: true,
      comments: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

  async update(id: string, updatePostDto: UpdatePostDto, user: User) {
    const post = await this.findOne(id);

    if (user.role !== Role.ADMIN && post.authorId !== user.id) {
      throw new ForbiddenException('You cannot edit this post');
    }

    return this.prisma.post.update({
      where: { id },
      data: updatePostDto,
    });
  }

  async remove(id: string, user: User) {
    const post = await this.findOne(id);

    if (user.role !== Role.ADMIN && post.authorId !== user.id) {
      throw new ForbiddenException('You cannot delete this post');
    }

    return this.prisma.post.delete({ where: { id } });
  }

//   async likePost(postId: string, user: User) {
//   try {
//     return await this.prisma.like.create({
//       data: {
//         postId,
//         userId: user.id,
//       },
//     });
//   } catch (error) {
//     if (
//       error instanceof Prisma.PrismaClientKnownRequestError &&
//       error.code === 'P2002'
//     ) {
//       throw new BadRequestException('You already liked this post');
//     }
//     throw error;
//   }
// }
async likePost(postId: string, user: User) {
  // Check if user already liked this post
  const existing = await this.prisma.like.findFirst({
    where: {
      postId,
      userId: user.id,
    },
  });

  if (existing) {
    // User already liked → remove like
    await this.prisma.like.delete({
      where: { id: existing.id },
    });
    return { liked: false }; // indicate it was removed
  }

  // User hasn't liked → create like
  await this.prisma.like.create({
    data: {
      postId,
      userId: user.id,
    },
  });
  return { liked: true }; // indicate it was added
}
  async unlikePost(postId: string, user: User) {
    return this.prisma.like.deleteMany({
      where: { postId, userId: user.id },
    });
  }
}