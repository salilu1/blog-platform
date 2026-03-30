import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User, Role, Post } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /** =========================
   * GET SINGLE POST (CACHED)
   ========================== */
  async findOne(id: string) {
    const cacheKey = `post:${id}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      console.log('⚡ Cache hit (post)');
      return cached;
    }

    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
        likes: true,
        comments: {
          include: {
            author: true,
            likes: true,
          },
        },
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    await this.redis.set(cacheKey, post, 60);

    return post;
  }

  /** =========================
   * GET ALL POSTS (CACHED)
   ========================== */
  async findAll(skip = 0, take = 10, search?: string) {
    const cacheKey = `posts:${skip}:${take}:${search || 'all'}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      console.log('⚡ Cache hit (posts)');
      return cached;
    }

    const posts = await this.prisma.post.findMany({
      skip,
      take,
      where: search ? { title: { contains: search } } : undefined,
      include: {
        author: true,
        likes: true,
        comments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.redis.set(cacheKey, posts, 60);

    return posts;
  }

  /** =========================
   * CREATE POST
   ========================== */
  async create(
    createPostDto: CreatePostDto,
    user: User,
    file?: Express.Multer.File,
  ) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can create posts');
    }

    const post = await this.prisma.post.create({
      data: {
        ...createPostDto,
        authorId: user.id,
        filePath: file?.filename ?? null,
      },
      include: {
        author: true,
        likes: true,
        comments: true,
      },
    });

    // ❗ Better cache invalidation
    await this.redis.delPattern('posts:*');

    return post;
  }

  /** =========================
   * UPDATE POST
   ========================== */
  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    user: User,
    file?: Express.Multer.File,
  ) {
    // 🔥 IMPORTANT: fetch from DB directly (NOT cache)
    const existingPost = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      throw new NotFoundException('Post not found');
    }

    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can update posts');
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        ...updatePostDto,
        filePath: file?.filename ?? existingPost.filePath,
      },
      include: {
        author: true,
        likes: true,
        comments: true,
      },
    });

    // ❗ invalidate cache properly
    await this.redis.del(`post:${id}`);
    await this.redis.delPattern('posts:*');

    return updated;
  }

  /** =========================
   * DELETE POST
   ========================== */
  async remove(id: string, user: User) {
    const existingPost = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      throw new NotFoundException('Post not found');
    }

    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can delete posts');
    }

    const deleted = await this.prisma.post.delete({
      where: { id },
    });

    await this.redis.del(`post:${id}`);
    await this.redis.delPattern('posts:*');

    return deleted;
  }

  /** =========================
   * LIKE POST
   ========================== */
  async toggleLike(postId: string, user: User) {
    const existing = await this.prisma.like.findFirst({
      where: { postId, userId: user.id },
    });

    if (existing) {
      await this.prisma.like.delete({
        where: { id: existing.id },
      });

      await this.redis.del(`post:${postId}`);

      return { liked: false };
    }

    await this.prisma.like.create({
      data: { postId, userId: user.id },
    });

    await this.redis.del(`post:${postId}`);

    return { liked: true };
  }

  async unlikePost(postId: string, user: User) {
    await this.prisma.like.deleteMany({
      where: { postId, userId: user.id },
    });

    await this.redis.del(`post:${postId}`);

    return { unliked: true };
  }
}