import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, SearchX } from 'lucide-react';

import { Seo } from '../components/Seo.jsx';
import { CategorySection } from '../components/CategorySection.jsx';
import { EmptyState } from '../components/ui/Skeleton.jsx';
import { LIBRARY_SECTIONS, useLibraryTopic } from '../hooks/queries.js';

export function LibraryTopicPage({ section = 'mbbs' }) {
  const { slug } = useParams();
  const { data, isError, isFetching } = useLibraryTopic(slug, section);
  const sectionMeta = LIBRARY_SECTIONS[section];
  const homePath = sectionMeta.home;

  const category = data?.category;
  const subcategories = data?.subcategories ?? [];
  const posts = data?.posts ?? [];
  const items = data?.items ?? [];

  return (
    <>
      <Seo
        title={category ? `${category.name} — ${sectionMeta.label}` : sectionMeta.label}
        description={category?.description || `Notes, files and videos for ${category?.name ?? 'this topic'} on MediHub Pakistan.`}
        path={`${homePath}/topic/${slug}`}
      />

      <section className="bg-gradient-to-br from-brand to-brand-mid py-12 text-white">
        <div className="container-site">
          <Link to={homePath} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-brand-light hover:text-white">
            <ArrowLeft size={16} aria-hidden="true" />
            All topics
          </Link>
          <h1 className="text-2xl !text-white sm:text-3xl">{category?.name ?? 'Topic'}</h1>
          {category?.description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-light">{category.description}</p>}
        </div>
      </section>

      <section className="container-site py-12">
        {isError ? (
          <EmptyState icon={SearchX} title="Couldn't load this topic">
            Something went wrong — please refresh the page in a moment.
          </EmptyState>
        ) : !data && isFetching ? (
          <div className="card-base h-40 animate-pulse" />
        ) : (
          <CategorySection
            category={category ?? { name: '', slug }}
            subcategories={subcategories}
            posts={posts}
            items={items}
            basePath={homePath}
          />
        )}
      </section>
    </>
  );
}