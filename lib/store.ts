// ─── KV SCHEMA ───────────────────────────────────────────────────────────────
//
//  engagement:{id}         → JSON (Engagement) — individual lookup
//  engagements:sorted      → Sorted Set, score = submittedAt timestamp (ms)
//                            ZADD on create, ZRANGEBYSCORE DESC for listing
//
//  OPERATIONS:
//    createEngagement()    → SET engagement:{id} + ZADD engagements:sorted
//    getEngagement(id)     → GET engagement:{id}
//    updateEngagement()    → GET engagement:{id} + SET engagement:{id}
//    listEngagements()     → ZRANGE engagements:sorted DESC + MGET all ids
//    attachReport()        → updateEngagement() (no schema change)
// ─────────────────────────────────────────────────────────────────────────────

import { Redis } from "@upstash/redis";
import { Engagement, RenewalReport } from "@/types";

// Lazily initialize Redis so the module can be imported in test environments
// without requiring live KV credentials.
let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.KV_REST_API_URL ?? "",
      token: process.env.KV_REST_API_TOKEN ?? "",
    });
  }
  return _redis;
}

const ENGAGEMENT_KEY = (id: string) => `engagement:${id}`;
const SORTED_SET_KEY = "engagements:sorted";

export async function createEngagement(
  clientName: string,
  clientEmail?: string
): Promise<Engagement> {
  const id = crypto.randomUUID();
  const engagement: Engagement = {
    id,
    clientName,
    clientEmail,
    submittedAt: new Date().toISOString(),
    status: "pending",
    files: [],
  };

  const redis = getRedis();
  const score = new Date(engagement.submittedAt).getTime();

  await Promise.all([
    redis.set(ENGAGEMENT_KEY(id), engagement),
    redis.zadd(SORTED_SET_KEY, { score, member: id }),
  ]);

  return engagement;
}

export async function getEngagement(id: string): Promise<Engagement | undefined> {
  const result = await getRedis().get<Engagement>(ENGAGEMENT_KEY(id));
  return result ?? undefined;
}

export async function listEngagements(): Promise<Engagement[]> {
  const redis = getRedis();

  // ZRANGE with REV returns ids newest-first
  const ids = await redis.zrange<string[]>(SORTED_SET_KEY, 0, -1, { rev: true });
  if (ids.length === 0) return [];

  const keys = ids.map(ENGAGEMENT_KEY);
  const results = await redis.mget<Engagement[]>(...keys);

  return results.filter((e): e is Engagement => e !== null);
}

export async function updateEngagement(
  id: string,
  updates: Partial<Engagement>
): Promise<Engagement | undefined> {
  const existing = await getEngagement(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates };
  await getRedis().set(ENGAGEMENT_KEY(id), updated);
  return updated;
}

export async function attachReport(
  engagementId: string,
  report: RenewalReport
): Promise<Engagement | undefined> {
  return updateEngagement(engagementId, { report, status: "complete" });
}

export async function deleteEngagement(id: string): Promise<boolean> {
  const redis = getRedis();
  const [deleted] = await Promise.all([
    redis.del(ENGAGEMENT_KEY(id)),
    redis.zrem(SORTED_SET_KEY, id),
  ]);
  return deleted === 1;
}
