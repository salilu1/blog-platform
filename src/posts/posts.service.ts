import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User, Role } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
  const post = await this.prisma.post.findUnique({
    where: { id },
    include: {
      author: true,
      likes: true, // This is for the POST itself
      comments: { 
        include: { 
          author: true, 
          likes: true // ✅ ADD THIS LINE TO GET COMMENT LIKES
        } 
      },
    },
  });
  if (!post) throw new NotFoundException('Post not found');
  return post;
}

  async findAll(skip = 0, take = 10, search?: string) {
    return this.prisma.post.findMany({
      skip,
      take,
      where: search ? { title: { contains: search } } : undefined,
      include: { author: true, likes: true, comments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(createPostDto: CreatePostDto, user: User, file?: Express.Multer.File) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can create posts');
    }

    return this.prisma.post.create({
      data: {
        ...createPostDto,
        authorId: user.id,
        filePath: file?.filename ?? null,
      },
      include: { author: true, likes: true, comments: true },
    });
  }

  async update(id: string, updatePostDto: UpdatePostDto, user: User, file?: Express.Multer.File) {
    const post = await this.findOne(id);

    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can update posts');
    }

    return this.prisma.post.update({
      where: { id },
      data: {
        ...updatePostDto,
        filePath: file?.filename ?? post.filePath,
      },
      include: { author: true, likes: true, comments: true },
    });
  }

  async remove(id: string, user: User) {
    const post = await this.findOne(id);

    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can delete posts');
    }

    return this.prisma.post.delete({ where: { id } });
  }

  async toggleLike(postId: string, user: User) {
    const existing = await this.prisma.like.findFirst({ where: { postId, userId: user.id } });
    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } });
      return { liked: false };
    }
    await this.prisma.like.create({ data: { postId, userId: user.id } });
    return { liked: true };
  }

  async unlikePost(postId: string, user: User) {
    await this.prisma.like.deleteMany({ where: { postId, userId: user.id } });
    return { unliked: true };
  }
}