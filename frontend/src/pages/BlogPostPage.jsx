import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, FileText, SearchX } from 'lucide-react';

import { Seo } from '../components/Seo.jsx';
import { EmptyState } from '../components/ui/Skeleton.jsx';
import { LIBRARY_SECTIONS, useLibraryPost } from '../hooks/queries.js';
import { BlogBody } from '../lib/blog.jsx';

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function BlogPostPage({ section = 'mbbs' }) {
  const { id } = useParams();
  const { data, isError, isFetching } = useLibraryPost(id, section);
  const sectionMeta = LIBRARY_SECTIONS[section];
  const homePath = sectionMeta.home;
  const post = data?.post;
  const breadcrumb = data?.breadcrumb ?? [];

  return (
    <>
      <Seo
        title={post ? `${post.title} — ${sectionMeta.label}` : 'Notes'}
        description={post?.body ? `${String(post.body).replace(/[#>*_`\[\]()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)}` : `A written ${sectionMeta.label} note.`}
        path={`${homePath}/post/${id}`}
      />

      <section className="bg-gradient-to-br from-brand to-brand-mid py-12 text-white">
        <div className="container-site">
          <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-brand-light" aria-label="Breadcrumb">
            <Link to={homePath} className="inline-flex items-center gap-1 font-medium text-brand-light no-underline hover:text-white">
              <ArrowLeft size={15} aria-hidden="true" /> {sectionMeta.label}
            </Link>
            {breadcrumb.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1.5">
                <ChevronRight size={13} aria-hidden="true" />
                <Link to={`${homePath}/topic/${c.slug}`} className="font-medium text-brand-light no-underline hover:text-white">
                  {c.name}
                </Link>
              </span>
            ))}
          </nav>
          <h1 className="text-2xl !text-white sm:text-3xl">{post?.title ?? 'Post'}</h1>
          {post && <p className="mt-2 text-sm text-brand-light">Updated {formatDate(post.updatedAt)}</p>}
        </div>
      </section>

      <section className="container-site py-12">
        {isError ? (
          <EmptyState icon={SearchX} title="Couldn't open this post">
            It may have been removed — head back to the {sectionMeta.label} section.
          </EmptyState>
        ) : !data && isFetching ? (
          <div className="card-base h-56 animate-pulse" />
        ) : post ? (
          <article className="card-base mx-auto max-w-3xl p-7 sm:p-10">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              {post.category && (
                <Link
                  to={`${homePath}/topic/${post.category.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand"
                >
                  <FileText size={12} aria-hidden="true" /> {post.category.name}
                </Link>
              )}
              <span className="text-xs text-slate-400">
                <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
              </span>
            </div>
            <BlogBody body={post.body} />
            <div className="mt-10 border-t border-brand-light pt-6">
              <Link to={homePath} className="inline-flex items-center gap-2 text-sm font-medium text-brand no-underline hover:underline">
                <ArrowLeft size={15} aria-hidden="true" /> Back to {sectionMeta.label}
              </Link>
            </div>
          </article>
        ) : null}
      </section>
    </>
  );
}