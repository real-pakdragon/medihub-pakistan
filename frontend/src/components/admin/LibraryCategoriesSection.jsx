import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FileText, FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';

import { useCreateCategory, useDeleteCategory, useUpdateCategory } from '../../hooks/queries.js';
import { CONTENT_TYPE_LABELS } from '../../lib/constants.js';
import { useToast } from '../Toaster.jsx';

function buildTree(categories) {
  const map = new Map(categories.map((c) => [c.id, { ...c, children: [] }]));
  const roots = [];
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sort = (arr) => {
    arr.sort((a, b) => a.displayOrder - b.displayOrder);
    arr.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

function flattenForSelect(categories) {
  const rows = [];
  const walk = (node, depth) => {
    rows.push({ node, depth });
    node.children.forEach((c) => walk(c, depth + 1));
  };
  buildTree(categories).forEach((n) => walk(n, 0));
  return rows;
}

export function CategoriesManager({ categories, itemsByCategory = {}, section = 'mbbs' }) {
  const toast = useToast();
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [collapsed, setCollapsed] = useState(new Set());

  const createCategory = useCreateCategory(section);
  const updateCategory = useUpdateCategory(section);
  const deleteCategory = useDeleteCategory(section);

  const tree = useMemo(() => buildTree(categories ?? []), [categories]);

  const itemCount = (node) => (node._count?.items ?? 0) + node.children.reduce((s, c) => s + itemCount(c), 0);

  const toggle = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const renderNode = (node, depth) => {
    const isCollapsed = collapsed.has(node.id);
    const count = itemCount(node);
    const nodeItems = itemsByCategory[node.id] ?? [];
    return (
      <li key={node.id}>
        <div className="group flex items-center gap-2 py-2" style={{ paddingLeft: `${depth * 22}px` }}>
          <button
            type="button"
            onClick={() => toggle(node.id)}
            className="text-slate-400 hover:text-brand"
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {(node.children.length > 0 || nodeItems.length > 0) ? (
              isCollapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronDown size={16} />
              )
            ) : (
              <span className="inline-block w-4" />
            )}
          </button>
          <FolderTree size={16} className={node.parentId ? 'text-brand-mid' : 'text-brand'} aria-hidden="true" />
          <span className={`min-w-0 truncate text-sm font-medium ${node.parentId ? 'text-slate-600' : 'text-brand'}`}>
            {node.name}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{count}</span>
          {!node.isPublished && (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Draft</span>
          )}
          <div className="ml-auto flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setModal({ isSub: true, parentId: node.id })}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand"
              title="Add sub-topic"
            >
              <Plus size={15} />
            </button>
            <button
              type="button"
              onClick={() => setModal({ ...node })}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand"
              title="Edit"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(node)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
              title="Delete topic"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
        {nodeItems.length > 0 && !isCollapsed && (
          <ul className="mb-1 ml-[26px] mt-1 space-y-1 border-l-2 border-brand-light pl-4">
            {nodeItems.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-xs text-slate-600">
                <FileText size={13} className="shrink-0 text-brand-mid" aria-hidden="true" />
                <span className="min-w-0 truncate">{item.title}</span>
                <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-400">
                  {CONTENT_TYPE_LABELS[item.type] ?? item.type}
                </span>
              </li>
            ))}
          </ul>
        )}
        {node.children.length > 0 && !isCollapsed && (
          <ul className="space-y-0.5">{node.children.map((c) => renderNode(c, depth + 1))}</ul>
        )}
      </li>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Topics</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Organise the library into topics and sub-topics. Content items are added inside each topic.
          </p>
        </div>
        <button type="button" className="btn-primary !px-5 !py-2.5 text-sm" onClick={() => setModal({ isSub: false })}>
          <Plus size={16} aria-hidden="true" /> New topic
        </button>
      </div>

      {tree.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No topics yet — create your first topic above.
        </p>
      ) : (
        <ul className="mt-6 space-y-0.5 rounded-2xl border border-brand-light bg-white p-4 shadow-card">
          {tree.map((n) => renderNode(n, 0))}
        </ul>
      )}

      {modal && (
        <CategoryModal
          initial={modal}
          categories={categories}
          onClose={() => setModal(null)}
          saving={createCategory.isPending || updateCategory.isPending}
          onSave={async (values) => {
            try {
              const isCreate = !values.id;
              const payload = {
                name: values.name,
                description: values.description || undefined,
                iconName: values.iconName || undefined,
                parentId: values.parentId || undefined,
                displayOrder: values.displayOrder,
                isPublished: values.isPublished,
                slug: isCreate ? undefined : categories.find((c) => c.id === values.id)?.slug,
              };
              if (isCreate) await createCategory.mutateAsync(payload);
              else await updateCategory.mutateAsync({ id: values.id, ...payload });
              toast.success(isCreate ? 'Topic created' : 'Topic updated');
              setModal(null);
            } catch (err) {
              toast.error(err?.message ?? 'Save failed');
            }
          }}
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
            <h2 className="mt-3 text-lg">Delete “{confirmDelete.name}”?</h2>
            <p className="mt-2 text-sm text-slate-500">
              This removes the topic and all its sub-topics plus any content it contains. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" className="btn-secondary !py-2 text-sm" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteCategory.isPending}
                onClick={async () => {
                  try {
                    await deleteCategory.mutateAsync(confirmDelete.id);
                    toast.success('Topic deleted');
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

function CategoryModal({ initial, categories, onClose, onSave, saving }) {
  const isEdit = Boolean(initial.id);
  const flat = useMemo(() => flattenForSelect(categories ?? []), [categories]);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(() => ({
    id: initial.id ?? null,
    name: initial.name ?? '',
    description: initial.description ?? '',
    parentId: initial.isSub ? initial.parentId ?? '' : initial.parentId ?? '',
    displayOrder: initial.displayOrder ?? 0,
    isPublished: initial.isPublished ?? true,
  }));

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Topic name is required';
    if (form.parentId === form.id) errs.parentId = 'A topic cannot be its own parent';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    onSave(form);
  };

  return (
    <div
      className="fixed inset-0 z-[80] overflow-y-auto bg-black/40 p-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit topic' : 'New topic'}
    >
      <form onSubmit={submit} noValidate className="card-base mx-auto max-w-lg p-7">
        <h2 className="text-lg">{isEdit ? 'Edit topic' : initial.isSub ? 'New sub-topic' : 'New topic'}</h2>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="cat-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Name *
            </label>
            <input
              id="cat-name"
              className="input-field"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Gross Anatomy"
            />
            {errors.name && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="cat-parent" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Parent topic
            </label>
            <select
              id="cat-parent"
              className="input-field"
              value={form.parentId ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value || null }))}
            >
              <option value="">(None — top-level topic)</option>
              {flat.map(({ node, depth }) => (
                <option key={node.id} value={node.id} disabled={node.id === form.id}>
                  {'\u00A0'.repeat(depth * 2)} {node.name}
                </option>
              ))}
            </select>
            {errors.parentId && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.parentId}</p>}
          </div>

          <div>
            <label htmlFor="cat-desc" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea
              id="cat-desc"
              rows={3}
              className="input-field resize-y"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Shown on the topic card"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cat-order" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Display order
              </label>
              <input
                id="cat-order"
                type="number"
                min="0"
                className="input-field"
                value={form.displayOrder}
                onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              className="h-4 w-4 rounded accent-[#0b3b5c]"
            />
            Published (visible on the public site)
          </label>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary !py-2.5 text-sm">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary !py-2.5 text-sm">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create topic'}
          </button>
        </div>
      </form>
    </div>
  );
}