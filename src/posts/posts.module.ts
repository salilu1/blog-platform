import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    RedisModule // 🔥 THIS FIXES YOUR ERROR
  ],
  controllers: [PostsController],
  providers: [PostsService]
})
export class PostsModule {}
