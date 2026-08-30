import {
  BookOpen,
  ClipboardCheck,
  FileText,
  Globe,
  Library,
  MessageCircle,
  PlayCircle,
  Stethoscope,
  Users,
} from 'lucide-react';

import { CATEGORY_LABELS } from '../lib/constants.js';

const ICONS = {
  'book-open': BookOpen,
  stethoscope: Stethoscope,
  'clipboard-check': ClipboardCheck,
  'file-text': FileText,
  'play-circle': PlayCircle,
  users: Users,
  library: Library,
};

export function CategoryIcon({ name, size = 24 }) {
  const Icon = ICONS[name] ?? BookOpen;
  return <Icon size={size} aria-hidden="true" />;
}

const LINK_TYPE_STYLES = {
  drive: 'bg-amber-50 text-amber-800 border-amber-200',
  whatsapp: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  telegram: 'bg-sky-50 text-sky-800 border-sky-200',
  youtube: 'bg-red-50 text-red-800 border-red-200',
  pdf: 'bg-violet-50 text-violet-800 border-violet-200',
  website: 'bg-brand-light text-brand border-brand-border',
};

const LINK_TYPE_ICONS = {
  whatsapp: MessageCircle,
  website: Globe,
};

export function ResourceCard({ resource }) {
  return (
    <article className="card-base group flex h-full flex-col p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-cardHover">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand transition-colors group-hover:bg-brand group-hover:text-white">
          <CategoryIcon name={resource.iconName} />
        </div>
        <div className="min-w-0">
          <h3 className="text-base leading-snug">{resource.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {resource.yearTag && (
              <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold text-white">
                {resource.yearTag}
              </span>
            )}
            <span className="rounded-full border border-brand-border bg-white px-2.5 py-0.5 text-[11px] font-semibold text-brand-mid">
              {CATEGORY_LABELS[resource.category] ?? resource.category}
            </span>
          </div>
        </div>
      </div>

      {resource.description && (
        <p className="mt-4 line-clamp-3 flex-none text-sm leading-relaxed text-slate-500">{resource.description}</p>
      )}

      {resource.links?.length > 0 && (
        <ul className="mt-4 space-y-2">
          {resource.links.slice(0, 4).map((link) => {
            const LinkIcon = LINK_TYPE_ICONS[link.type];
            return (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:brightness-95 ${
                    LINK_TYPE_STYLES[link.type] ?? LINK_TYPE_STYLES.website
                  }`}
                >
                  {LinkIcon ? <LinkIcon size={14} aria-hidden="true" /> : <FileText size={14} aria-hidden="true" />}
                  <span className="truncate">{link.label}</span>
                </a>
              </li>
            );
          })}
          {resource.links.length > 4 && (
            <li className="text-xs font-medium text-slate-400">+{resource.links.length - 4} more items</li>
          )}
        </ul>
      )}

      {resource.links?.length > 0 && (
        <div className="mt-auto pt-5">
          <a
            href={resource.links[0].url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full !py-2.5 text-xs"
            aria-label={`Open ${resource.title}`}
          >
            Open Resource
          </a>
        </div>
      )}
    </article>
  );
}
