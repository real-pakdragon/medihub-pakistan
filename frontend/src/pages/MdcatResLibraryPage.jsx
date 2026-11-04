import { BookOpen, FolderOpen } from 'lucide-react';

import { Seo } from '../components/Seo.jsx';
import { CategorySection } from '../components/CategorySection.jsx';
import { EmptyState } from '../components/ui/Skeleton.jsx';
import { useLibraryBrowse } from '../hooks/queries.js';

const SECTION = 'mdcat';

export function MdcatResLibraryPage() {
  const { data, isError, isFetching } = useLibraryBrowse(SECTION);
  const topics = data ?? [];

  return (
    <>
      <Seo
        title="MDCAT RES"
        description="Notes, files, presentations, videos and links for MDCAT preparation — grouped into subjects and sub-topics, each with written explanations."
        path="/mdcat-res"
      />

      <section className="bg-gradient-to-br from-brand to-brand-mid py-14 text-white">
        <div className="container-site">
          <h1 className="text-3xl !text-white sm:text-4xl">MDCAT RES</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-light sm:text-base">
            MDCAT resources and past-paper patterns — files, PDFs, presentations, videos and links, plus written notes
            and explanations that play videos right on the page.
          </p>
        </div>
      </section>

      <section className="container-site py-12">
        {isError ? (
          <EmptyState icon={BookOpen} title="Couldn't load the library">
            Something went wrong — please refresh the page in a moment.
          </EmptyState>
        ) : !data && isFetching ? (
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card-base h-28 animate-pulse" />
            ))}
          </div>
        ) : topics.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No MDCAT RES topics yet">
            The admin has not added any MDCAT topics yet — check back soon.
          </EmptyState>
        ) : (
          <div className="space-y-16">
            {topics.map((topic) => (
              <CategorySection
                key={topic.id}
                category={topic}
                subcategories={topic.children ?? []}
                posts={topic.posts ?? []}
                items={topic.items ?? []}
                subtopicsHeading={false}
                basePath="/mdcat-res"
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}