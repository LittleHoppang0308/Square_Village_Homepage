/** 저장소를 아직 못 읽을 때 쓰는 기본 형태. 실제 내용은 저장소 루트의 data.json 이 가진다. */
export const EMPTY = {
  settings: {
    serverName: '스퀘어빌리지',
    serverVersion: 'Paper 26.2',
    launcher: { version: '', file: '', platform: 'Windows 64bit', releasedAt: '' },
    discordInvite: '',
  },
  banners: [],
  posts: [],
  events: [],
  videos: [],
  guides: [],
  systems: [],
  sync: { lastRunAt: null, cursors: {} },
};

export function withDefaults(data) {
  const d = data && typeof data === 'object' ? data : {};
  return {
    ...EMPTY,
    ...d,
    settings: { ...EMPTY.settings, ...(d.settings || {}), launcher: { ...EMPTY.settings.launcher, ...((d.settings || {}).launcher || {}) } },
    banners: Array.isArray(d.banners) ? d.banners : [],
    posts: Array.isArray(d.posts) ? d.posts : [],
    events: Array.isArray(d.events) ? d.events : [],
    videos: Array.isArray(d.videos) ? d.videos : [],
    guides: Array.isArray(d.guides) ? d.guides : [],
    systems: Array.isArray(d.systems) ? d.systems : [],
    sync: { lastRunAt: null, cursors: {}, ...(d.sync || {}) },
  };
}
