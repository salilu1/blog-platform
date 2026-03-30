import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';

import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { AdminModule } from './admin/admin.module';

import { RedisService } from './redis/redis.service'; // ✅ ADD

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    /** ✅ Redis Cache (Nest built-in) */
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: redisStore,
        host: config.get<string>('REDIS_HOST') || 'localhost',
        port: config.get<number>('REDIS_PORT') || 6379,
        ttl: 60, // default TTL
      }),
    }),

    PrismaModule,
    UsersModule,
    AuthModule,
    PostsModule,
    CommentsModule,
    AdminModule,
  ],

  /** ✅ Register RedisService globally */
  providers: [RedisService],

  /** ✅ Make it available everywhere */
  exports: [RedisService],
})
export class AppModule {}