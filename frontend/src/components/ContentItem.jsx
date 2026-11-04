import { Download, Eye, File, FileImage, FileText, Folder, Link2, Play, Presentation } from 'lucide-react';

import { CONTENT_TYPE_LABELS } from '../lib/constants.js';
import { youtubeId } from '../lib/blog.jsx';

const TYPE_ICONS = {
  book: FileText,
  pdf: FileText,
  ppt: Presentation,
  video: Play,
  link: Link2,
  image: FileImage,
  file: File,
};

const TYPE_STYLES = {
  book: 'bg-violet-50 text-violet-700',
  pdf: 'bg-red-50 text-red-700',
  ppt: 'bg-orange-50 text-orange-700',
  video: 'bg-sky-50 text-sky-700',
  link: 'bg-emerald-50 text-emerald-700',
  image: 'bg-pink-50 text-pink-700',
  file: 'bg-slate-100 text-slate-600',
};

export function formatBytes(bytes) {
  if (bytes == null) return '';
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function targetFor(item) {
  if (item.filePath) return item.filePath;
  if (item.url) return item.url;
  return null;
}

export function ContentItemCard({ item }) {
  const Icon = TYPE_ICONS[item.type] ?? FileText;
  const target = targetFor(item);
  const isExternal = Boolean(item.url && !item.filePath);
  const typeLabel = CONTENT_TYPE_LABELS[item.type] ?? item.type;
  const embedId = item.type === 'video' ? youtubeId(item.url) : null;

  return (
    <article className="card-base group flex flex-col gap-5 p-6">
      {embedId && (
        <div className="overflow-hidden rounded-2xl bg-slate-900 shadow-card">
          <iframe
            className="aspect-video w-full"
            src={`https://www.youtube-nocookie.com/embed/${embedId}`}
            title={item.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${TYPE_STYLES[item.type] ?? 'bg-slate-100 text-slate-600'}`}>
          <Icon size={30} aria-hidden="true" />
        </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-[11px] font-semibold text-brand-mid">
            {typeLabel}
          </span>
          {item.category && <span className="text-[11px] font-medium text-slate-400">{item.category.name}</span>}
        </div>
        <h3 className="mt-1.5 text-lg font-semibold leading-snug">{item.title}</h3>
        <p className="mt-0.5 text-sm text-slate-500">
          {item.author ? <span className="font-medium text-slate-600">{item.author}</span> : null}
          {item.edition ? <span className="text-slate-400"> · {item.edition}</span> : null}
          {formatBytes(item.fileSize) ? <span className="text-slate-400"> · {formatBytes(item.fileSize)}</span> : null}
        </p>
        {item.description && <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.description}</p>}
      </div>

      {target ? (
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <a
            href={target}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center justify-center gap-2 !py-2.5 text-xs"
          >
            <Eye size={15} aria-hidden="true" />
            {item.type === 'video' ? 'Watch' : isExternal ? 'Open Link' : 'Read Online'}
          </a>
          {!isExternal && (
            <a
              href={target}
              download={item.fileName}
              className="btn-secondary inline-flex items-center justify-center gap-2 !py-2.5 text-xs"
            >
              <Download size={15} aria-hidden="true" />
              Download
            </a>
          )}
        </div>
      ) : (
        <p className="shrink-0 text-xs font-medium text-slate-400">No file attached yet</p>
      )}
      </div>
    </article>
  );
}

export function TopicCard({ category, children, footer }) {
  return (
    <div className="card-base flex h-full flex-col p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-light text-brand">
          <Folder size={26} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold leading-snug">{category.name}</h3>
          {category.description && <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{category.description}</p>}
        </div>
      </div>
      {children}
      {footer}
    </div>
  );
}