/**
 * Anti-Spam Rate Limiter Utility for GigMe Campus
 * Protects against:
 * 1. Rapid-fire spam messages in chat
 * 2. Rapid-fire duplicate gig creations
 * 3. 9-digit user ID brute-force search enumeration
 */

export type RateLimitAction = 'CHAT' | 'POST_GIG' | 'SEARCH_ID' | 'AI_QUERY';

interface RateLimitRule {
  minIntervalMs: number; // Minimum gap between consecutive calls
  maxCallsInWindow: number; // Max allowable calls within window
  windowMs: number; // Time window duration in ms
  actionNameVi: string;
}

const RULES: Record<RateLimitAction, RateLimitRule> = {
  CHAT: {
    minIntervalMs: 1000, // Ít nhất 1.0 giây giữa 2 tin nhắn
    maxCallsInWindow: 6, // Tối đa 6 tin nhắn trong 10 giây
    windowMs: 10000,
    actionNameVi: 'gửi tin nhắn chat',
  },
  POST_GIG: {
    minIntervalMs: 12000, // Ít nhất 12 giây giữa 2 lần đăng bài
    maxCallsInWindow: 3, // Tối đa 3 bài đăng trong 60 giây
    windowMs: 60000,
    actionNameVi: 'đăng công việc mới',
  },
  SEARCH_ID: {
    minIntervalMs: 600, // Ít nhất 0.6 giây giữa 2 lần tra cứu ID 9 số
    maxCallsInWindow: 5, // Tối đa 5 lần tra cứu trong 10 giây
    windowMs: 10000,
    actionNameVi: 'tìm kiếm ID 9 số',
  },
  AI_QUERY: {
    minIntervalMs: 1500,
    maxCallsInWindow: 8,
    windowMs: 30000,
    actionNameVi: 'hỏi Trợ lý AI GigMe',
  },
};

// In-memory timestamps store: `${action}:${userId}` -> number[]
const timestampsMap = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remainingCooldownSeconds: number;
  remainingCallsInWindow: number;
  errorMsg?: string;
}

export const rateLimiter = {
  check: (action: RateLimitAction, userId: string = 'guest'): RateLimitResult => {
    const rule = RULES[action];
    const key = `${action}:${userId}`;
    const now = Date.now();
    const timestamps = timestampsMap.get(key) || [];

    // Filter out timestamps outside window
    const validTimestamps = timestamps.filter((t) => now - t < rule.windowMs);
    timestampsMap.set(key, validTimestamps);

    // 1. Check minimum interval between calls
    if (validTimestamps.length > 0) {
      const lastCall = validTimestamps[validTimestamps.length - 1];
      const elapsedSinceLast = now - lastCall;
      if (elapsedSinceLast < rule.minIntervalMs) {
        const waitMs = rule.minIntervalMs - elapsedSinceLast;
        const waitSec = Math.max(1, Math.ceil(waitMs / 1000));
        return {
          allowed: false,
          remainingCooldownSeconds: waitSec,
          remainingCallsInWindow: 0,
          errorMsg: `Bạn đang ${rule.actionNameVi} quá nhanh! Vui lòng chờ ${waitSec} giây để bảo vệ hệ thống chống spam.`,
        };
      }
    }

    // 2. Check max calls in window
    if (validTimestamps.length >= rule.maxCallsInWindow) {
      const oldestInWindow = validTimestamps[0];
      const waitMs = rule.windowMs - (now - oldestInWindow);
      const waitSec = Math.max(1, Math.ceil(waitMs / 1000));
      return {
        allowed: false,
        remainingCooldownSeconds: waitSec,
        remainingCallsInWindow: 0,
        errorMsg: `Bạn đã thực hiện ${rule.actionNameVi} đạt giới hạn (${rule.maxCallsInWindow} lần/${Math.round(rule.windowMs / 1000)}s). Vui lòng đợi ${waitSec} giây.`,
      };
    }

    return {
      allowed: true,
      remainingCooldownSeconds: 0,
      remainingCallsInWindow: rule.maxCallsInWindow - validTimestamps.length,
    };
  },

  record: (action: RateLimitAction, userId: string = 'guest'): void => {
    const key = `${action}:${userId}`;
    const now = Date.now();
    const list = timestampsMap.get(key) || [];
    list.push(now);
    timestampsMap.set(key, list);
  },

  reset: (action?: RateLimitAction, userId?: string): void => {
    if (action && userId) {
      timestampsMap.delete(`${action}:${userId}`);
    } else if (action) {
      for (const key of timestampsMap.keys()) {
        if (key.startsWith(`${action}:`)) timestampsMap.delete(key);
      }
    } else {
      timestampsMap.clear();
    }
  },
};
