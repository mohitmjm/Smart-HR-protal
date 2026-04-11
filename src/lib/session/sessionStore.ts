// Redis-based SessionStore implementation using Upstash

import type { SessionData, SessionId, SessionStore } from "../langGraph/types/session";

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisRequest(command: string, args: string[] = []): Promise<any> {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Upstash Redis credentials not configured");
  }

  const response = await fetch(`${UPSTASH_REDIS_REST_URL}/${command}/${args.join("/")}`, {
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Redis request failed: ${response.statusText}`);
  }

  return response.json();
}

export const RedisSessionStore: SessionStore = {
  async get(id: SessionId): Promise<SessionData | null> {
    try {
      const result = await redisRequest("GET", [`session:${id}`]);
      return result.result ? JSON.parse(result.result) : null;
    } catch (error) {
      console.error("Redis GET error:", error);
      return null;
    }
  },

  async set(session: SessionData): Promise<void> {
    try {
      const ttl = session.expiresAt 
        ? Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)
        : 900; // Default 15 minutes TTL
      
      await redisRequest("SETEX", [`session:${session.id}`, ttl.toString(), JSON.stringify(session)]);
    } catch (error) {
      console.error("Redis SET error:", error);
      throw error;
    }
  },

  async update(id: SessionId, updates: Partial<Omit<SessionData, "id">>): Promise<SessionData | null> {
    try {
      const current = await this.get(id);
      if (!current) return null;
      
      const updated: SessionData = { ...current, ...updates } as SessionData;
      await this.set(updated);
      return updated;
    } catch (error) {
      console.error("Redis UPDATE error:", error);
      return null;
    }
  },

  async delete(id: SessionId): Promise<void> {
    try {
      await redisRequest("DEL", [`session:${id}`]);
    } catch (error) {
      console.error("Redis DELETE error:", error);
      throw error;
    }
  },
};

// Export as default for backward compatibility
export const InMemorySessionStore = RedisSessionStore;


