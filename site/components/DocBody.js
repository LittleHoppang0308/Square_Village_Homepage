import { parseDoc, inline } from '@/lib/doc';

export default function DocBody({ text }) {
  const blocks = parseDoc(text);
  if (!blocks.length) {
    return <p className="doc-empty">아직 내용이 없습니다.</p>;
  }
  return (
    <div className="doc">
      {blocks.map((b, i) => {
        if (b.type === 'h') {
          const T = b.level === 1 ? 'h2' : b.level === 3 ? 'h4' : 'h3';
          return <T key={i} className={`dh dh${b.level || 2}`}><Inline text={b.text} /></T>;
        }
        if (b.type === 'quote') {
          return (
            <blockquote key={i}>
              {b.lines.map((l, j) => <p key={j}><Inline text={l} /></p>)}
            </blockquote>
          );
        }
        if (b.type === 'ul') {
          return <ul key={i}>{b.items.map((it, j) => <li key={j}><Inline text={it} /></li>)}</ul>;
        }
        if (b.type === 'ol') {
          return <ol key={i}>{b.items.map((it, j) => <li key={j}><Inline text={it} /></li>)}</ol>;
        }
        if (b.type === 'table') {
          return (
            <div className="doc-table" key={i}>
              <table>
                <thead>
                  <tr>{b.head.map((h, j) => <th key={j}><Inline text={h} /></th>)}</tr>
                </thead>
                <tbody>
                  {b.rows.map((r, j) => (
                    <tr key={j}>{r.map((c, k) => <td key={k}><Inline text={c} /></td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return (
          <p key={i}>
            {b.lines.map((l, j) => (
              <span key={j}>
                <Inline text={l} />
                {j < b.lines.length - 1 ? ' ' : null}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function Inline({ text }) {
  return inline(text).map((p, i) => {
    if (p.t === 'b') return <strong key={i}>{p.v}</strong>;
    if (p.t === 'i') return <em key={i}>{p.v}</em>;
    if (p.t === 'u') return <u key={i}>{p.v}</u>;
    if (p.t === 's') return <s key={i}>{p.v}</s>;
    if (p.t === 'code') return <code key={i}>{p.v}</code>;
    if (p.t === 'link') {
      return (
        <a key={i} href={p.v} target="_blank" rel="noopener noreferrer nofollow">
          {p.label || p.v}
        </a>
      );
    }
    return <span key={i}>{p.v}</span>;
  });
}
