'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 배너·이벤트·영상·가이드·시스템·설정을 편집한다.
 * 항목 구조가 영역마다 달라서, 각 영역의 필드 정의(FIELDS)를 표로 렌더한다.
 */
const FIELDS = {
  banners: {
    label: '메인 배너',
    hint: '자동으로 6.5초마다 넘어갑니다. 제목에 // 를 넣으면 줄바꿈됩니다.',
    columns: [
      { key: 'tag', label: '태그', width: 90 },
      { key: 'title', label: '제목', width: 240 },
      { key: 'desc', label: '설명', area: true },
      { key: 'cta', label: '버튼 문구', width: 110 },
      { key: 'href', label: '링크', width: 150 },
      { key: 'navLabel', label: '하단 탭 문구', width: 130 },
      { key: 'theme', label: '색', width: 90, options: ['dusk', 'night', 'sand', 'teal'] },
    ],
  },
  events: {
    label: '이벤트 배너',
    hint: '메인에 두 개까지 보입니다.',
    columns: [
      { key: 'tag', label: '태그', width: 90 },
      { key: 'title', label: '제목', width: 200 },
      { key: 'desc', label: '설명', area: true },
      { key: 'href', label: '링크', width: 150 },
    ],
  },
  videos: {
    label: '공식 영상',
    columns: [
      { key: 'title', label: '제목', area: true },
      { key: 'duration', label: '길이', width: 80 },
      { key: 'href', label: '링크', width: 180 },
    ],
  },
  guides: {
    label: '가이드 · 소개 문서',
    hint: '주소는 /guide/<주소값> 이 됩니다. 본문은 ## 소제목 / - 목록 / | 표 | 를 알아봅니다. 아이콘: book gem anvil flag map sword dagger clock',
    columns: [
      { key: 'slug', label: '주소값', width: 130 },
      { key: 'name', label: '제목', width: 160 },
      { key: 'group', label: '위치', width: 110, options: ['guide', 'intro'] },
      { key: 'icon', label: '아이콘', width: 100 },
      { key: 'summary', label: '한 줄 소개', area: true },
      { key: 'body', label: '본문', area: true, big: true },
    ],
  },
  systems: {
    label: '콘텐츠 & 시스템',
    hint: '코드는 영문 대문자로. 메뉴의 시스템 항목과 앵커가 이 값으로 만들어집니다.',
    columns: [
      { key: 'code', label: '코드', width: 90 },
      { key: 'name', label: '이름', width: 170 },
      { key: 'desc', label: '설명', area: true },
    ],
  },
};

const SETTINGS_FIELDS = [
  { key: 'serverName', label: '서버 이름' },
  { key: 'serverVersion', label: '버전 표기' },
  { key: 'discordInvite', label: '디스코드 초대 링크' },
  { key: 'launcher.version', label: '런처 버전' },
  { key: 'launcher.file', label: '런처 파일명' },
  { key: 'launcher.platform', label: '런처 플랫폼' },
  { key: 'launcher.releasedAt', label: '런처 배포일' },
];

export default function AdminEditor({ data }) {
  const [tab, setTab] = useState('banners');
  const keys = [...Object.keys(FIELDS), 'settings'];

  return (
    <>
      <div className="tabs admin-tabs" role="tablist">
        {keys.map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
            {k === 'settings' ? '설정' : FIELDS[k].label}
          </button>
        ))}
      </div>
      {tab === 'settings'
        ? <SettingsPane initial={data.settings} />
        : <ListPane key={tab} area={tab} spec={FIELDS[tab]} initial={data[tab] || []} />}
    </>
  );
}

function useSave(key) {
  const router = useRouter();
  const [state, setState] = useState({ busy: false, msg: '', err: '' });
  const save = async (value) => {
    setState({ busy: true, msg: '', err: '' });
    try {
      const res = await fetch('/api/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || '저장하지 못했습니다');
      setState({ busy: false, msg: '저장했습니다', err: '' });
      router.refresh();
      setTimeout(() => setState((s) => ({ ...s, msg: '' })), 2500);
    } catch (e) {
      setState({ busy: false, msg: '', err: e.message });
    }
  };
  return [state, save];
}

function ListPane({ area, spec, initial }) {
  const [rows, setRows] = useState(initial);
  const [state, save] = useSave(area);

  const set = (i, key, v) => setRows((list) => list.map((r, k) => (k === i ? { ...r, [key]: v } : r)));
  const move = (i, d) => setRows((list) => {
    const next = [...list];
    const j = i + d;
    if (j < 0 || j >= next.length) return next;
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
  const add = () => setRows((list) => [...list, { id: `n${Date.now().toString(36)}` }]);
  const del = (i) => setRows((list) => list.filter((_, k) => k !== i));

  return (
    <div className="admin-pane">
      {spec.hint ? <p className="admin-hint">{spec.hint}</p> : null}

      {rows.length === 0 ? <p className="admin-hint">항목이 없습니다. 아래 「항목 추가」를 누르세요.</p> : null}

      {rows.map((row, i) => (
        <div className="admin-row" key={row.id || i}>
          <div className="admin-grid">
            {spec.columns.map((c) => (
              <label className="af" key={c.key} style={c.area ? { gridColumn: '1 / -1' } : undefined}>
                <span>{c.label}</span>
                {c.options ? (
                  <select
                    id={`${area}-${i}-${c.key}`}
                    value={row[c.key] ?? ''}
                    onChange={(e) => set(i, c.key, e.target.value)}
                  >
                    <option value="">(기본)</option>
                    {c.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : c.area ? (
                  <textarea
                    id={`${area}-${i}-${c.key}`}
                    rows={c.big ? 14 : 2}
                    value={row[c.key] ?? ''}
                    onChange={(e) => set(i, c.key, e.target.value)}
                  />
                ) : (
                  <input
                    id={`${area}-${i}-${c.key}`}
                    value={row[c.key] ?? ''}
                    onChange={(e) => set(i, c.key, e.target.value)}
                    style={c.width ? { maxWidth: c.width } : undefined}
                    autoComplete="off"
                  />
                )}
              </label>
            ))}
          </div>
          <div className="admin-rowtools">
            <button className="btn-quiet" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
            <button className="btn-quiet" onClick={() => move(i, 1)} disabled={i === rows.length - 1}>↓</button>
            <button className="btn-danger" onClick={() => del(i)}>삭제</button>
          </div>
        </div>
      ))}

      <div className="admin-actions">
        <button className="btn-quiet" onClick={add}>항목 추가</button>
        <span className="grow" />
        {state.err ? <span className="cmt-err">{state.err}</span> : null}
        {state.msg ? <span className="ok-msg">{state.msg}</span> : null}
        <button className="btn-green" onClick={() => save(rows)} disabled={state.busy}>
          {state.busy ? '저장 중…' : '저장'}
        </button>
      </div>
    </div>
  );
}

function SettingsPane({ initial }) {
  const [form, setForm] = useState(initial);
  const [state, save] = useSave('settings');

  const get = (path) => path.split('.').reduce((o, k) => (o || {})[k], form) ?? '';
  const set = (path, v) => setForm((f) => {
    const next = structuredClone(f);
    const parts = path.split('.');
    let cur = next;
    parts.slice(0, -1).forEach((k) => { cur[k] = cur[k] || {}; cur = cur[k]; });
    cur[parts[parts.length - 1]] = v;
    return next;
  });

  return (
    <div className="admin-pane">
      <p className="admin-hint">
        런처 버전·파일명·배포일은 사이드의 런처 카드에 그대로 표시됩니다.
        서버 주소·접속자 수는 사이트에서 쓰지 않습니다.
      </p>
      <div className="admin-grid">
        {SETTINGS_FIELDS.map((f) => (
          <label className="af" key={f.key}>
            <span>{f.label}</span>
            <input
              id={`set-${f.key}`}
              value={get(f.key)}
              onChange={(e) => set(f.key, e.target.value)}
              autoComplete="off"
            />
          </label>
        ))}
      </div>
      <div className="admin-actions">
        <span className="grow" />
        {state.err ? <span className="cmt-err">{state.err}</span> : null}
        {state.msg ? <span className="ok-msg">{state.msg}</span> : null}
        <button className="btn-green" onClick={() => save(form)} disabled={state.busy}>
          {state.busy ? '저장 중…' : '저장'}
        </button>
      </div>
    </div>
  );
}
