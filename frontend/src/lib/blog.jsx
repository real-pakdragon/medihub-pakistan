import { Fragment } from 'react';

const URL_RE = /^https?:\/\/\S+$/;
const YT_RE = /^https?:\/\/(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\//i;

export function youtubeId(url) {
  if (typeof url !== 'string' || !YT_RE.test(url.trim())) return null;
  const t = url.trim();
  const after = t.split(/[?#]/, 1)[0];
  let id = null;
  if (/youtu\.be\//i.test(after)) {
    id = after.split('youtu.be/')[1];
  } else if (/youtube\.com\/embed\//i.test(t) || /youtube\.com\/(?:shorts|live)\//i.test(t)) {
    const m = after.match(/youtube\.com\/(?:embed|shorts|live)\/([\w-]{6,})/i);
    id = m ? m[1] : null;
  } else {
    const m = t.match(/[?&]v=([\w-]{6,})/i);
    id = m ? m[1] : null;
  }
  return id && /^[\w-]{6,}$/.test(id) ? id : null;
}

function safeUrl(value) {
  const t = typeof value === 'string' ? value.trim() : '';
  return URL_RE.test(t) ? t : null;
}

function escapeText(value) {
  return String(value);
}

function Link({ href, children }) {
  const url = safeUrl(href);
  if (!url) return <Fragment>{children}</Fragment>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand underline decoration-brand-border underline-offset-2 hover:text-brand-mid">
      {children}
    </a>
  );
}

function parseInline(text, keyPrefix) {
  const nodes = [];
  const tokens = text.split(/(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|https?:\/\/\S+)/g);
  let key = 0;
  for (const token of tokens) {
    if (!token) continue;
    const k = `${keyPrefix}-${key++}`;
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      nodes.push(
        <code key={k} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-brand-mid">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const close = token.indexOf('](');
      const label = token.slice(1, close);
      const href = token.slice(close + 2, -1);
      nodes.push(
        <Link key={k} href={href}>
          {label}
        </Link>
      );
    } else if (token.startsWith('**') && token.length > 4) {
      nodes.push(<strong key={k} className="font-semibold">{parseInline(token.slice(2, -2), k)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      nodes.push(<em key={k}>{parseInline(token.slice(1, -1), k)}</em>);
    } else if (/^https?:\/\//.test(token)) {
      const url = safeUrl(token);
      nodes.push(
        <Link key={k} href={url}>
          {url}
        </Link>
      );
    } else {
      nodes.push(<Fragment key={k}>{escapeText(token)}</Fragment>);
    }
  }
  return nodes.length ? nodes : '';
}

function VideoBlock({ url }) {
  const id = youtubeId(url);
  if (!id) return null;
  return (
    <div className="my-2 overflow-hidden rounded-2xl border border-brand-light bg-slate-900 shadow-card">
      <iframe
        className="aspect-video w-full"
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title="YouTube video player"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

function ImageBlock({ alt, url }) {
  const src = safeUrl(url);
  if (!src) return null;
  return (
    <div className="my-2">
      <img src={src} alt={alt || ''} loading="lazy" className="max-h-[480px] w-auto max-w-full rounded-2xl border border-brand-light shadow-card" />
    </div>
  );
}

function renderList(items, ordered) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className={ordered ? 'list-decimal space-y-1.5 pl-6' : 'list-disc space-y-1.5 pl-6'}>
      {items.map((line, i) => (
        <li key={i} className="leading-relaxed">
          {parseInline(line)}
        </li>
      ))}
    </Tag>
  );
}

export function renderBlogBlocks(body) {
  if (!body) return [];
  const lines = String(body).replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  const push = (el) => blocks.push(el);

  const flushParagraph = (acc) => {
    if (!acc.length) return;
    push(<p key={`p-${blocks.length}`} className="text-[15px] leading-[1.85] text-slate-700">{parseInline(acc.join(' '), `p-${blocks.length}`)}</p>);
  };

  let paragraph = [];
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (line === '') {
      flushParagraph(paragraph);
      paragraph = [];
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph(paragraph);
      paragraph = [];
      const level = Math.min(4, heading[1].length);
      const Tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
      push(<Tag key={`h-${blocks.length}`} className={Tag === 'h2' ? 'mt-6 text-xl font-bold text-brand' : 'mt-5 text-lg font-bold text-slate-800'}>{parseInline(heading[2], `h-${blocks.length}`)}</Tag>);
      i += 1;
      continue;
    }

    if (line.startsWith('```')) {
      flushParagraph(paragraph);
      paragraph = [];
      const code = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      push(
        <pre key={`code-${blocks.length}`} className="my-2 overflow-x-auto rounded-2xl bg-slate-900 p-4 text-sm leading-relaxed text-slate-100">
          <code>{code.join('\n')}</code>
        </pre>
      );
      continue;
    }

    const isYt = line === '' ? false : Boolean(youtubeId(line));
    if (isYt) {
      flushParagraph(paragraph);
      paragraph = [];
      push(<VideoBlock key={`vid-${blocks.length}`} url={line} />);
      i += 1;
      continue;
    }

    const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      flushParagraph(paragraph);
      paragraph = [];
      push(<ImageBlock key={`img-${blocks.length}`} alt={image[1]} url={image[2]} />);
      i += 1;
      continue;
    }

    if (line.startsWith('> ')) {
      flushParagraph(paragraph);
      paragraph = [];
      const quote = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quote.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      push(
        <blockquote key={`q-${blocks.length}`} className="my-2 border-l-4 border-brand-mid bg-brand-light/60 px-4 py-3 text-slate-700">
          {parseInline(quote.join(' '), `q-${blocks.length}`)}
        </blockquote>
      );
      continue;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      flushParagraph(paragraph);
      paragraph = [];
      const items = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i += 1;
      }
      push(<div key={`ul-${blocks.length}`} className="my-2">{renderList(items, false)}</div>);
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      flushParagraph(paragraph);
      paragraph = [];
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      push(<div key={`ol-${blocks.length}`} className="my-2">{renderList(items, true)}</div>);
      continue;
    }

    if (line === '---') {
      flushParagraph(paragraph);
      paragraph = [];
      push(<hr key={`hr-${blocks.length}`} className="my-4 border-brand-light" />);
      i += 1;
      continue;
    }

    paragraph.push(line);
    i += 1;
  }
  flushParagraph(paragraph);
  return blocks;
}

export function BlogBody({ body, className = '' }) {
  return <div className={`space-y-3 ${className}`}>{renderBlogBlocks(body)}</div>;
}

export function postExcerpt(body, max = 140) {
  if (!body) return '';
  const text = String(body)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, '')}…` : text;
}