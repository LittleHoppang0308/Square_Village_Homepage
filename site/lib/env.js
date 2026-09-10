export const GITHUB_API = process.env.GITHUB_API_URL || 'https://api.github.com';
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
export const GITHUB_REPO = process.env.GITHUB_REPO || '';
export const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

export const DISCORD_API = process.env.DISCORD_API_URL || 'https://discord.com/api/v10';
export const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
export const DISCORD_CHANNELS = process.env.DISCORD_CHANNELS || '';

export const SYNC_SECRET = process.env.SYNC_SECRET || '';
export const CRON_SECRET = process.env.CRON_SECRET || '';

export const LAUNCHER_REPO = process.env.LAUNCHER_REPO || 'LittleHoppang0308/squarevillage-launcher';

/** 저장소 연결이 갖춰졌는지 — 없으면 씨드 데이터로 동작한다 */
export const hasGithub = Boolean(GITHUB_TOKEN && GITHUB_REPO);
