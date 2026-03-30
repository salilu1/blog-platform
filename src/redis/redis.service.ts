import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private client: Redis;

  onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
    });
  }

  /** =========================
   * GET
   ========================== */
  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  /** =========================
   * SET
   ========================== */
  async set(key: string, value: any, ttl = 60) {
    await this.client.set(key, JSON.stringify(value), 'EX', ttl);
  }

  /** =========================
   * DELETE SINGLE KEY
   ========================== */
  async del(key: string) {
    await this.client.del(key);
  }

  /** =========================
   * DELETE BY PATTERN 🔥 (IMPORTANT)
   ========================== */
  async delPattern(pattern: string) {
    const keys = await this.client.keys(pattern);

    if (keys.length === 0) return;

    await this.client.del(...keys); // spread is important
  }
}