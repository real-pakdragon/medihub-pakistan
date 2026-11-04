import { useMemo, useRef, useState } from 'react';
import { FileUp, Paperclip, Pencil, Plus, Search, Trash2 } from 'lucide-react';

import { useAdminItems, useCreateItem, useDeleteItem, useUpdateItem, useUploadFile } from '../../hooks/queries.js';
import { CONTENT_TYPE_LABELS, CONTENT_TYPES } from '../../lib/constants.js';
import { useToast } from '../Toaster.jsx';
import { formatBytes } from '../ContentItem.jsx';

const EMPTY_ITEM = {
  title: '',
  type: 'book',
  categoryId: '',
  description: '',
  author: '',
  edition: '',
  url: '',
  fileName: '',
  filePath: '',
  fileSize: null,
  isPublished: true,
  displayOrder: 0,
};

export function LibraryItemsSection({ categories, section = 'mbbs' }) {
  const categoriesFlat = useMemo(() => {
    const rows = [];
    const walk = (node, depth) => {
      rows.push({ ...node, depth });
      (node.children ?? []).forEach((c) => walk(c, depth + 1));
    };
    for (const c of (categories ?? []).map((x) => ({ ...x, children: [] }))) walk(c, 0);
    return rows;
  }, [categories]);

  const toast = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const params = useMemo(
    () => ({ search, category: catFilter || undefined, type: typeFilter || undefined, limit: 100 }),
    [search, catFilter, typeFilter]
  );
  const { data = {}, isFetching } = useAdminItems(params, true, section);
  const items = data.items ?? [];

  const deleteItem = useDeleteItem(section);

  const catName = (id) => categoriesFlat.find((c) => c.id === id)?.name ?? '';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Files &amp; Content</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Add books, PDFs, presentations, videos, images or links into any topic.
          </p>
        </div>
        <button type="button" className="btn-primary !px-5 !py-2.5 text-sm" onClick={() => setEditing(EMPTY_ITEM)}>
          <Plus size={16} aria-hidden="true" /> New item
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
          }}
          role="search"
          className="flex-1"
        >
          <label htmlFor="item-search" className="sr-only">Search content</label>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="item-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search title or author…"
              className="input-field !py-2 pl-9 text-sm"
            />
          </div>
        </form>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="input-field !w-auto !py-2 text-sm" aria-label="Filter by topic">
          <option value="">All topics</option>
          {categoriesFlat.map((c) => (
            <option key={c.id} value={c.id}>
              {'\u00A0'.repeat(c.depth * 2)}{c.name}
            </option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field !w-auto !py-2 text-sm" aria-label="Filter by type">
          <option value="">All types</option>
          {CONTENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {CONTENT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        {isFetching && items.length === 0 ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card-base h-16 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No content items match{catFilter || typeFilter || search ? ' your filters' : ''} — add one with the New item button.
          </p>
        ) : (
          <ul className="divide-y divide-brand-light overflow-hidden rounded-2xl border border-brand-light bg-white shadow-card">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-brand">{item.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-brand-mid">{CONTENT_TYPE_LABELS[item.type] ?? item.type}</span>
                    <span>· {catName(item.categoryId) || 'No topic'}</span>
                    {item.author && <span>· {item.author}</span>}
                    {formatBytes(item.fileSize) && <span>· {formatBytes(item.fileSize)}</span>}
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold ${
                        item.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {item.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        ...EMPTY_ITEM,
                        ...item,
                        fileSize: item.fileSize != null ? Number(item.fileSize) : null,
                      })
                    }
                    className="btn-secondary !px-3.5 !py-2 text-xs"
                  >
                    <Pencil size={14} aria-hidden="true" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(item)}
                    className="btn-pill !px-3.5 !py-2 text-xs border-2 border-red-200 bg-white text-red-600 hover:bg-red-50"
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
        <ItemFormModal
          initial={editing}
          categories={categoriesFlat}
          onClose={() => setEditing(null)}
          section={section}
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
            <p className="mt-2 text-sm text-slate-500">
              This removes it from the library{confirmDelete.filePath ? ' and deletes the uploaded file' : ''}.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" className="btn-secondary !py-2 text-sm" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteItem.isPending}
                onClick={async () => {
                  try {
                    await deleteItem.mutateAsync(confirmDelete.id);
                    toast.success('Item deleted');
                    setConfirmDelete(null);
                  } catch (err) {
                    toast.error(err?.message ?? 'Delete failed');
                  }
                }}
                className="btn-primary !bg-red-600 hover:!bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemFormModal({ initial, categories, onClose, section = 'mbbs' }) {
  const toast = useToast();
  const isEdit = Boolean(initial.id);
  const fileRef = useRef(null);
  const uploadFile = useUploadFile(section);
  const createItem = useCreateItem(section);
  const updateItem = useUpdateItem(section);

  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(() => ({ ...EMPTY_ITEM, ...initial }));

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const saving = createItem.isPending || updateItem.isPending || uploadFile.isPending;

  const handleFile = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      setErrors((e) => ({ ...e, filePath: '' }));
      const res = await uploadFile.mutateAsync(fd);
      setForm((f) => ({
        ...f,
        fileName: res.data.fileName,
        filePath: res.data.filePath,
        fileSize: res.data.fileSize,
        url: '',
        title: f.title || file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
      }));
      toast.success('File uploaded');
    } catch (err) {
      toast.error(err?.message ?? 'Upload failed');
      setErrors((e) => ({ ...e, filePath: err?.message ?? 'Upload failed' }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.categoryId) errs.categoryId = 'Choose a topic';
    const isLinkLike = form.type === 'link' || form.type === 'video';
    if (!isLinkLike && !form.filePath && !form.url) errs.filePath = 'Upload a file or provide a URL';
    if (form.url && !/^https?:\/\//.test(form.url)) errs.url = 'URL must start with http(s)://';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    const payload = {
      title: form.title.trim(),
      type: form.type,
      categoryId: form.categoryId,
      description: form.description?.trim() || undefined,
      author: form.author?.trim() || undefined,
      edition: form.edition?.trim() || undefined,
      url: form.type === 'link' || form.type === 'video' ? form.url.trim() || undefined : form.url?.trim() || undefined,
      fileName: form.fileName || undefined,
      filePath: form.filePath || undefined,
      fileSize: form.fileSize != null ? Number(form.fileSize) : undefined,
      isPublished: form.isPublished,
      displayOrder: form.displayOrder ?? 0,
    };
    try {
      if (isEdit) await updateItem.mutateAsync({ id: initial.id, ...payload });
      else await createItem.mutateAsync(payload);
      toast.success(isEdit ? 'Item updated' : 'Item created');
      onClose();
    } catch (err) {
      toast.error(err?.message ?? 'Save failed');
    }
  };

  const currentFile = form.filePath?.replace(/^\/files\/library\//, '');

  return (
    <div
      className="fixed inset-0 z-[80] overflow-y-auto bg-black/40 p-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit item' : 'New item'}
    >
      <form onSubmit={submit} noValidate className="card-base mx-auto max-w-2xl p-7 sm:p-8">
        <h2 className="text-lg">{isEdit ? 'Edit item' : 'New item'}</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="item-title" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Title *
            </label>
            <input
              id="item-title"
              className="input-field"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="e.g. Guyton & Hall Medical Physiology"
            />
            {errors.title && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="item-type" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Type *
            </label>
            <select id="item-type" className="input-field" value={form.type} onChange={(e) => setField('type', e.target.value)}>
              {CONTENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {CONTENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="item-category" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Topic *
            </label>
            <select
              id="item-category"
              className="input-field"
              value={form.categoryId}
              onChange={(e) => setField('categoryId', e.target.value)}
            >
              <option value="">Choose a topic…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {'\u00A0'.repeat(c.depth * 2)}{c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.categoryId}</p>}
          </div>

          <div>
            <label htmlFor="item-author" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Author
            </label>
            <input id="item-author" className="input-field" value={form.author ?? ''} onChange={(e) => setField('author', e.target.value)} />
          </div>

          <div>
            <label htmlFor="item-edition" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Edition / Meta
            </label>
            <input id="item-edition" className="input-field" value={form.edition ?? ''} onChange={(e) => setField('edition', e.target.value)} placeholder="e.g. 10th Edition" />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="item-desc" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea
              id="item-desc"
              rows={2}
              className="input-field resize-y"
              value={form.description ?? ''}
              onChange={(e) => setField('description', e.target.value)}
            />
          </div>

          <div className="sm:col-span-2 rounded-xl border border-brand-light bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-brand-light p-2.5 text-brand">
                <Paperclip size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                {currentFile ? (
                  <p className="truncate text-sm font-medium text-brand">{currentFile}</p>
                ) : (
                  <p className="text-sm text-slate-500">Upload a file (PDF, PPT, image, video, zip…)</p>
                )}
                {errors.filePath && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.filePath}</p>}
              </div>
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
              <button type="button" className="btn-secondary !px-4 !py-2 text-xs" onClick={() => fileRef.current?.click()} disabled={uploadFile.isPending}>
                <FileUp size={14} aria-hidden="true" /> {uploadFile.isPending ? 'Uploading…' : 'Upload file'}
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="item-url" className="mb-1.5 block text-sm font-semibold text-slate-700">
              OR external URL
            </label>
            <input
              id="item-url"
              className="input-field"
              value={form.url ?? ''}
              onChange={(e) => setField('url', e.target.value)}
              placeholder="https://drive.google.com/… or https://youtube.com/…"
            />
            {errors.url && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.url}</p>}
            <p className="mt-1 text-xs text-slate-400">
              For “External Link” and “Video” types you can just paste a URL instead of uploading a file.
            </p>
          </div>

          <div>
            <label htmlFor="item-order" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Display order
            </label>
            <input
              id="item-order"
              type="number"
              min="0"
              className="input-field"
              value={form.displayOrder}
              onChange={(e) => setField('displayOrder', Number(e.target.value) || 0)}
            />
          </div>

          <label className="flex items-end gap-2.5 pb-1 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setField('isPublished', e.target.checked)}
              className="h-4 w-4 rounded accent-[#0b3b5c]"
            />
            Published
          </label>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary !py-2.5 text-sm" disabled={saving}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary !py-2.5 text-sm">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create item'}
          </button>
        </div>
      </form>
    </div>
  );
}