export const GITHUB_API = process.env.GITHUB_API_URL || 'https://api.github.com';
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
export const GITHUB_REPO = process.env.GITHUB_REPO || '';
export const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

export const DISCORD_API = process.env.DISCORD_API_URL || 'https://discord.com/api/v10';
export const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
export const DISCORD_CHANNELS = process.env.DISCORD_CHANNELS || '';

/* ── 로그인 (OAuth2) ─────────────────────────────────────── */
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
export const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
export const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || '';
/** 운영진으로 인정할 디스코드 역할 ID 들 (콤마 구분) */
export const DISCORD_STAFF_ROLES = process.env.DISCORD_STAFF_ROLES || '';
export const AUTH_SECRET = process.env.AUTH_SECRET || '';

/** 웹에서 쓴 글·댓글을 디스코드 채널로도 보낼지 ("0"/"off" 면 끔) */
export const DISCORD_MIRROR = !/^(0|off|false)$/i.test(process.env.DISCORD_MIRROR || '1');

export const SYNC_SECRET = process.env.SYNC_SECRET || '';
export const CRON_SECRET = process.env.CRON_SECRET || '';

export const LAUNCHER_REPO = process.env.LAUNCHER_REPO || '';
export const SITE_URL = (process.env.SITE_URL || '').replace(/\/+$/, '');

/** 저장소 연결이 갖춰졌는지 — 없으면 씨드 데이터로 동작한다 */
export const hasGithub = Boolean(GITHUB_TOKEN && GITHUB_REPO);
/** 로그인을 쓸 수 있는지 */
export const hasAuth = Boolean(
  DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET && DISCORD_GUILD_ID && AUTH_SECRET && DISCORD_BOT_TOKEN,
);

export function staffRoleIds() {
  return DISCORD_STAFF_ROLES.split(',').map((s) => s.trim()).filter(Boolean);
}
