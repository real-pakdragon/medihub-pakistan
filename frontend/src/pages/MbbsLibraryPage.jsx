import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookX, Search } from 'lucide-react';

import { Seo } from '../components/Seo.jsx';
import { ResourceCard } from '../components/ResourceCard.jsx';
import { EmptyState, ResourceCardSkeleton } from '../components/ui/Skeleton.jsx';
import { CATEGORIES } from '../lib/constants.js';
import { useResources } from '../hooks/queries.js';

export function MbbsLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const category = searchParams.get('category') ?? '';
  const year = searchParams.get('year') ?? '';
  const page = Number(searchParams.get('page') ?? 1);

  const params = useMemo(
    () => ({ category, exclude: 'past_papers', year, search: searchParams.get('search') ?? '', page, limit: 12 }),
    [category, year, page, searchParams]
  );

  const { data, isFetching, isError, error } = useResources(params);
  const resources = data?.data ?? [];
  const meta = data?.meta;

  const updateParam = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.delete('page');
      return next;
    });
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    updateParam('search', searchInput.trim());
  };

  return (
    <>
      <Seo
        title="MBBS Library"
        description="MBBS notes, clinical rotation guides, past papers and textbook references for every professional year — curated by Pakistani medical students."
        path="/mbbs"
      />

      <section className="bg-gradient-to-br from-brand to-brand-mid py-14 text-white">
        <div className="container-site">
          <h1 className="text-3xl !text-white sm:text-4xl">MBBS Resource Library</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-light sm:text-base">
            Everything from first-year Anatomy to Final-year OSCEs. Filter by category or search for the material you
            need.
          </p>

          <form onSubmit={onSearchSubmit} className="mt-8 flex max-w-xl gap-2" role="search">
            <label htmlFor="resource-search" className="sr-only">
              Search resources
            </label>
            <input
              id="resource-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search e.g. “physiology”, “UHS”, “OSCE”…"
              className="w-full rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-brand-light/70 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <button type="submit" className="btn-onDark !px-5" aria-label="Search resources">
              <Search size={17} aria-hidden="true" />
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            <FilterPill active={!category} onClick={() => updateParam('category', '')}>
              All
            </FilterPill>
            {CATEGORIES.map(({ value, label }) => (
              <FilterPill key={value} active={category === value} onClick={() => updateParam('category', value)}>
                {label}
              </FilterPill>
            ))}
          </div>
        </div>
      </section>

      <section className="container-site py-12">
        {isError ? (
          <EmptyState icon={BookX} title="Couldn't load the library">
            {error?.message ?? 'Something went wrong'} — please refresh the page in a moment.
          </EmptyState>
        ) : !data && isFetching ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <ResourceCardSkeleton key={i} />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <EmptyState icon={BookX} title="No resources match your filters">
            Try a different keyword or clear the category filter — new material is added every week.
          </EmptyState>
        ) : (
          <>
            <p aria-live="polite" className="mb-6 text-sm text-slate-500">
              Showing <strong>{resources.length}</strong> of <strong>{meta.total.toLocaleString()}</strong> resources
              {params.search && (
                <>
                  {' '}
                  for “<span className="font-semibold">{params.search}</span>”
                </>
              )}
            </p>
            <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${isFetching ? 'opacity-60' : ''}`}>
              {resources.map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
            {meta.totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
                <button
                  type="button"
                  className="btn-secondary !px-4 !py-2 disabled:opacity-40"
                  onClick={() => updateParam('page', String(Math.max(1, page - 1)))}
                  disabled={page <= 1}
                >
                  Previous
                </button>
                <span className="px-3 text-sm font-medium text-slate-600">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <button
                  type="button"
                  className="btn-secondary !px-4 !py-2 disabled:opacity-40"
                  onClick={() => updateParam('page', String(Math.min(meta.totalPages, page + 1)))}
                  disabled={page >= meta.totalPages}
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </>
  );
}

function FilterPill({ active, children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      aria-pressed={active}
      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
        active
          ? 'bg-white text-brand shadow-card'
          : 'border border-white/30 bg-transparent text-brand-light hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
