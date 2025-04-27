import Redis from 'ioredis'

export const broker = new Redis(
  (process.env.REDIS_HOST || 'redis://localhost:6379') + '?family=0'
)
