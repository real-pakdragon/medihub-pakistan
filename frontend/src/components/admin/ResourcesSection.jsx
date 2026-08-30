import { useMemo, useState } from 'react';
import { Library, Pencil, Plus, Search, Trash2 } from 'lucide-react';

import { useAdminResources, useCreateResource, useDeleteResource, useUpdateResource } from '../../hooks/queries.js';
import { resourceSchema } from '../../lib/schemas.js';
import { CATEGORIES, CATEGORY_LABELS } from '../../lib/constants.js';
import { useToast } from '../Toaster.jsx';
import { EmptyState, ResourceCardSkeleton } from '../ui/Skeleton.jsx';
import { CategoryIcon } from '../ResourceCard.jsx';

const EMPTY_FORM = {
  title: '',
  category: 'pre_clinical',
  yearTag: '',
  iconName: 'book-open',
  description: '',
  links: [],
  isPublished: true,
};

export function ResourcesSection() {
  const toast = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const params = useMemo(() => ({ search, limit: 50 }), [search]);
  const { data, isLoading } = useAdminResources(params, true);
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
  const deleteResource = useDeleteResource();

  const resources = data?.data ?? [];

  const handleDelete = async (id) => {
    try {
      await deleteResource.mutateAsync(id);
      toast.success('Resource deleted');
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err?.message ?? 'Delete failed');
    }
  };

  return (
    <section aria-labelledby="admin-resources-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 id="admin-resources-title" className="text-xl sm:text-2xl">
          Resources
        </h1>
        <div className="flex gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput.trim());
            }}
            role="search"
          >
            <label htmlFor="admin-resource-search" className="sr-only">
              Search resources
            </label>
            <input
              id="admin-resource-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search…"
              className="input-field !w-44 !py-2 text-sm"
            />
          </form>
          <button type="button" className="btn-primary !px-5 !py-2.5 text-sm" onClick={() => setEditing(EMPTY_FORM)}>
            <Plus size={16} aria-hidden="true" /> New
          </button>
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <ResourceCardSkeleton key={i} />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <EmptyState icon={Library} title="No resources yet">
            Create your first resource to populate the public library.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-brand-light overflow-hidden rounded-2xl border border-brand-light bg-white shadow-card">
            {resources.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                  <CategoryIcon name={r.iconName} size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-brand">{r.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{CATEGORY_LABELS[r.category]}</span>
                    {r.yearTag && (
                      <>
                        ·<span>{r.yearTag}</span>
                      </>
                    )}
                    ·<span>{r.links?.length ?? 0} links</span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold ${
                        r.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {r.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(r)}
                    className="btn-secondary !px-3.5 !py-2 text-xs"
                    aria-label={`Edit ${r.title}`}
                  >
                    <Pencil size={14} aria-hidden="true" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(r)}
                    className="btn-pill !px-3.5 !py-2 text-xs border-2 border-red-200 bg-white text-red-600 hover:bg-red-50"
                    aria-label={`Delete ${r.title}`}
                  >
                    <Trash2 size={14} aria-hidden="true" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <ResourceFormModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={async (values) => {
            try {
              if (editing === EMPTY_FORM || !editing.id) {
                await createResource.mutateAsync(values);
                toast.success('Resource created');
              } else {
                await updateResource.mutateAsync({ id: editing.id, ...values });
                toast.success('Resource updated');
              }
              setEditing(null);
            } catch (err) {
              toast.error(err?.message ?? 'Save failed');
            }
          }}
          saving={createResource.isPending || updateResource.isPending}
        />
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm deletion"
        >
          <div className="card-base w-full max-w-sm p-7 text-center">
            <Trash2 size={32} className="mx-auto text-red-500" aria-hidden="true" />
            <h2 className="mt-3 text-lg">Delete “{confirmDelete.title}”?</h2>
            <p className="mt-2 text-sm text-slate-500">This removes it from the public library permanently.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" className="btn-secondary !py-2 text-sm" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteResource.isPending}
                onClick={() => handleDelete(confirmDelete.id)}
                className="btn-primary !bg-red-600 hover:!bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ResourceFormModal({ initial, onClose, onSave, saving }) {
  const isEdit = Boolean(initial?.id);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...initial,
    links: (initial.links ?? []).map((l) => ({ ...l })),
  }));

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const setLink = (index, key, value) =>
    setForm((f) => ({
      ...f,
      links: f.links.map((link, i) => (i === index ? { ...link, [key]: value } : link)),
    }));

  const submit = (e) => {
    e.preventDefault();
    const parsed = resourceSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path.join('.')] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSave(parsed.data);
  };

  return (
    <div
      className="fixed inset-0 z-[80] overflow-y-auto bg-black/40 p-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit resource' : 'New resource'}
    >
      <form onSubmit={submit} noValidate className="card-base mx-auto max-w-2xl p-7 sm:p-9">
        <h2 className="text-lg">{isEdit ? 'Edit resource' : 'New resource'}</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <TextField label="Title" value={form.title} onChange={(v) => setField('title', v)} error={errors.title} id="res-title" required />
          <div>
            <label htmlFor="res-category" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Category *
            </label>
            <select
              id="res-category"
              className="input-field"
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
            >
              {CATEGORIES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.category && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.category}</p>}
          </div>
          <TextField label="Year tag" placeholder="e.g. 2nd Year" value={form.yearTag} onChange={(v) => setField('yearTag', v)} error={errors.yearTag} id="res-year" />
          <TextField label="Icon name" placeholder="book-open" value={form.iconName} onChange={(v) => setField('iconName', v)} error={errors.iconName} id="res-icon" hint="Try book-open, stethoscope, file-text, play-circle, users or library" />
        </div>

        <div className="mt-4">
          <label htmlFor="res-description" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Description
          </label>
          <textarea
            id="res-description"
            rows={3}
            className="input-field resize-y"
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
          />
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-slate-700">Links</legend>
          <div className="mt-2 space-y-3">
            {form.links.map((link, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-brand-light bg-slate-50 p-3 sm:grid-cols-[1fr_2fr_auto_auto]">
                <label className="sr-only" htmlFor={`link-label-${i}`}>Link {i + 1} label</label>
                <input
                  id={`link-label-${i}`}
                  className="input-field !py-2 text-sm"
                  placeholder="Label"
                  value={link.label}
                  onChange={(e) => setLink(i, 'label', e.target.value)}
                />
                <label className="sr-only" htmlFor={`link-url-${i}`}>Link {i + 1} URL</label>
                <input
                  id={`link-url-${i}`}
                  className="input-field !py-2 text-sm"
                  placeholder="https://…"
                  value={link.url}
                  onChange={(e) => setLink(i, 'url', e.target.value)}
                />
                <label className="sr-only" htmlFor={`link-type-${i}`}>Link {i + 1} type</label>
                <select
                  id={`link-type-${i}`}
                  className="input-field !py-2 text-sm"
                  value={link.type}
                  onChange={(e) => setLink(i, 'type', e.target.value)}
                >
                  {['drive', 'whatsapp', 'youtube', 'pdf', 'website'].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setField('links', form.links.filter((_, j) => j !== i))}
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  aria-label={`Remove link ${i + 1}`}
                >
                  <Trash2 size={16} />
                </button>
                {(errors[`links.${i}.label`] || errors[`links.${i}.url`]) && (
                  <p role="alert" className="text-xs font-medium text-red-600 sm:col-span-4">
                    Link {i + 1}: {errors[`links.${i}.label`] ?? errors[`links.${i}.url`]}
                  </p>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setField('links', [...form.links, { label: '', url: '', type: 'drive' }])}
            className="btn-ghost mt-3 !px-4 !py-2 text-xs"
          >
            <Plus size={14} aria-hidden="true" /> Add link
          </button>
        </fieldset>

        <label className="mt-5 flex items-center gap-2.5 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setField('isPublished', e.target.checked)}
            className="h-4 w-4 rounded accent-[#0b3b5c]"
          />
          Published (visible on the public site)
        </label>

        <div className="mt-7 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary !py-2.5 text-sm">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary !py-2.5 text-sm">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create resource'}
          </button>
        </div>
      </form>
    </div>
  );
}

function TextField({ label, id, value, onChange, error, hint, required, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label} {required && <span aria-hidden="true" className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className="input-field"
      />
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}
