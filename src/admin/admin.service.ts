import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust path to your Prisma service

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [postCount, userCount, totalLikes, totalComments, topPosts] = await Promise.all([
      this.prisma.post.count(),
      this.prisma.user.count(),
      this.prisma.like.count({ where: { postId: { not: null } } }),
      this.prisma.comment.count(),
      this.prisma.post.findMany({
        take: 3,
        orderBy: {
          likes: { _count: 'desc' },
        },
        select: {
          id: true,
          title: true,
          _count: {
            select: { likes: true, comments: true },
          },
        },
      }),
    ]);

    return {
      summary: [
        { label: 'Total Posts', value: postCount, icon: '📝', color: 'bg-indigo-500' },
        { label: 'Total Likes', value: totalLikes, icon: '❤️', color: 'bg-rose-500' },
        { label: 'Comments', value: totalComments, icon: '💬', color: 'bg-amber-500' },
        { label: 'Users', value: userCount, icon: '👥', color: 'bg-emerald-500' },
      ],
      topPosts,
    };
  }
}