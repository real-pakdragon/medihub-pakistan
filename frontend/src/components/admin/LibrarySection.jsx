import { useMemo, useState } from 'react';
import { FileStack, FolderTree, Loader2, PenLine } from 'lucide-react';

import { LIBRARY_SECTIONS, useAdminCategories, useAdminItems } from '../../hooks/queries.js';
import { CategoriesManager } from './LibraryCategoriesSection.jsx';
import { LibraryItemsSection } from './LibraryItemsSection.jsx';
import { LibraryPostsSection } from './LibraryPostsSection.jsx';

const TABS = [
  { key: 'categories', label: 'Topics', icon: FolderTree },
  { key: 'items', label: 'Files & Content', icon: FileStack },
  { key: 'posts', label: 'Blog Posts', icon: PenLine },
];

export function LibrarySection({ section = 'mbbs' }) {
  const [tab, setTab] = useState('categories');
  const { data, isFetching } = useAdminCategories(true, section);
  const { data: itemsData } = useAdminItems({}, true, section);
  const categories = data ?? [];

  const itemsByCategory = useMemo(() => {
    const grouped = {};
    for (const item of itemsData?.items ?? []) {
      (grouped[item.categoryId] ??= []).push(item);
    }
    return grouped;
  }, [itemsData]);

  return (
    <section aria-labelledby="admin-library-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 id="admin-library-title" className="text-xl sm:text-2xl">
          {LIBRARY_SECTIONS[section].label} Manager
        </h1>
      </div>

      <div className="mt-5 flex gap-1 rounded-xl bg-slate-200/70 p-1 sm:w-fit" role="tablist" aria-label="Library manager sections">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${
              tab === key ? 'bg-white text-brand shadow-card' : 'text-slate-600 hover:text-brand'
            }`}
          >
            <Icon size={15} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {isFetching && categories.length === 0 ? (
          <div className="card-base flex items-center gap-3 p-6 text-sm text-slate-500">
            <Loader2 className="animate-spin text-brand" size={18} aria-hidden="true" /> Loading library…
          </div>
        ) : tab === 'categories' ? (
          <CategoriesManager categories={categories} itemsByCategory={itemsByCategory} section={section} />
        ) : tab === 'items' ? (
          <LibraryItemsSection categories={categories} section={section} />
        ) : (
          <LibraryPostsSection categories={categories} section={section} />
        )}
      </div>
    </section>
  );
}