import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, FolderOpen, Newspaper } from 'lucide-react';

import { ContentItemCard } from './ContentItem.jsx';
import { postExcerpt } from '../lib/blog.jsx';

const subCount = (sub) => sub.totalItems ?? (sub._count?.items ?? sub.items?.length ?? 0) + (sub._count?.posts ?? sub.posts?.length ?? 0);

function SubTopics({ nodes, depth = 0, flat = false, basePath = '/mbbs' }) {
  return (
    <ul className={depth > 0 ? 'mt-2 space-y-1.5 border-l-2 border-brand-light pl-4' : 'space-y-2 sm:space-y-3'}>
      {nodes.map((sub) => (
        <li key={sub.id}>
          <Link
            to={`${basePath}/topic/${sub.slug}`}
            className="card-base group flex items-center gap-3 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cardHover"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${depth === 0 ? 'bg-brand-light text-brand' : 'bg-slate-100 text-slate-500'} transition-colors group-hover:bg-brand group-hover:text-white`}>
              <FolderOpen size={20} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className={`font-semibold leading-snug ${depth === 0 ? '' : 'text-sm'}`}>{sub.name}</h4>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {subCount(sub)} {subCount(sub) === 1 ? 'item' : 'items'} inside
              </p>
            </div>
            <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-slate-300 group-hover:text-brand" />
          </Link>
          {!flat && sub.children?.length > 0 && <SubTopics nodes={sub.children} depth={depth + 1} basePath={basePath} />}
        </li>
      ))}
    </ul>
  );
}

export function CategorySection({ category, subcategories = [], posts = [], items = [], subtopicsHeading = true, basePath = '/mbbs' }) {
  const hasSubtopics = subcategories.length > 0;

  return (
    <section className="scroll-mt-24">
      <div className="flex items-start gap-4 border-b-2 border-brand-light pb-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-card">
          <BookOpen size={26} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-brand sm:text-3xl">{category.name}</h2>
          {category.description ? (
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500 sm:text-base">{category.description}</p>
          ) : (
            <p className="mt-1.5 text-sm text-slate-400">Browse notes, files and video explanations below.</p>
          )}
        </div>
      </div>

      {hasSubtopics && (
        <div className="mt-6">
          {subtopicsHeading && (
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Sub-topics</h3>
          )}
          <div className={subtopicsHeading ? 'mt-4' : 'mt-0'}>
            <SubTopics nodes={subcategories} flat={!subtopicsHeading} basePath={basePath} />
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <div className="mt-10">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Notes &amp; Blog</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`${basePath}/post/${post.id}`}
                className="card-base group flex flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cardHover"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand group-hover:bg-brand group-hover:text-white">
                    <Newspaper size={18} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold leading-snug text-brand">{post.title}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </span>
                </div>
                {postExcerpt(post.body) && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">{postExcerpt(post.body)}</p>}
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                  Read article
                  <ChevronRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-10">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Content</h3>
          <div className="mt-4 space-y-4">
            {items.map((item) => (
              <ContentItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {!hasSubtopics && posts.length === 0 && items.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          Nothing added in this topic yet.
        </p>
      )}
    </section>
  );
}