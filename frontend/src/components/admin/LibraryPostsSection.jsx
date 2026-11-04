import { useMemo, useRef, useState } from 'react';
import {
  Bold,
  Code2,
  Eye,
  Heading,
  Image,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pencil,
  PenLine,
  Play,
  Plus,
  Quote,
  Search,
  Trash2,
} from 'lucide-react';

import { useAdminPosts, useCreatePost, useDeletePost, useUpdatePost } from '../../hooks/queries.js';
import { useToast } from '../Toaster.jsx';
import { BlogBody } from '../../lib/blog.jsx';

const EMPTY_POST = {
  title: '',
  categoryId: '',
  body: '',
  isPublished: true,
  displayOrder: 0,
};

function flatCategories(categories) {
  const rows = [];
  const walk = (list, depth) => {
    for (const c of list) {
      rows.push({ ...c, depth });
      if (c.children?.length) walk(c.children, depth + 1);
    }
  };
  walk(categories ?? [], 0);
  return rows;
}

export function LibraryPostsSection({ categories, section = 'mbbs' }) {
  const toast = useToast();
  const flat = useMemo(() => flatCategories(categories), [categories]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const params = useMemo(
    () => ({ search: search || undefined, category: catFilter || undefined, limit: 100 }),
    [search, catFilter]
  );
  const { data = {}, isFetching } = useAdminPosts(params, true, section);
  const posts = data.items ?? [];
  const deletePost = useDeletePost(section);

  const catName = (id) => flat.find((c) => c.id === id)?.name ?? '';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Blog Posts</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Write explained notes inside any topic — links stay clickable and YouTube videos play right on the site.
          </p>
        </div>
        <button type="button" className="btn-primary !px-5 !py-2.5 text-sm" onClick={() => setEditing(EMPTY_POST)}>
          <Plus size={16} aria-hidden="true" /> New post
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          role="search"
          className="flex-1"
        >
          <label htmlFor="post-search" className="sr-only">Search posts</label>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="post-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search post title or body…"
              className="input-field !py-2 pl-9 text-sm"
            />
          </div>
        </form>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="input-field !w-auto !py-2 text-sm"
          aria-label="Filter posts by topic"
        >
          <option value="">All topics</option>
          {flat.map((c) => (
            <option key={c.id} value={c.id}>
              {'\u00A0'.repeat(c.depth * 2)}{c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        {isFetching && posts.length === 0 ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card-base h-16 animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No blog posts{catFilter || search ? ' match your filters' : ' yet'} — write your first post with the New post button.
          </p>
        ) : (
          <ul className="divide-y divide-brand-light overflow-hidden rounded-2xl border border-brand-light bg-white shadow-card">
            {posts.map((post) => (
              <li key={post.id} className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-brand">{post.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-brand-mid">{catName(post.categoryId) || 'No topic'}</span>
                    <span>· {new Date(post.updatedAt).toLocaleString('en-PK')}</span>
                    {!post.isPublished && <span className="rounded-full bg-slate-200 px-2 py-0.5 font-semibold text-slate-600">Draft</span>}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing({ ...post })}
                    className="btn-secondary !px-3.5 !py-2 text-xs"
                    title="Edit"
                  >
                    <Pencil size={14} aria-hidden="true" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(post)}
                    className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                    title="Delete post"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <PostFormModal
          initial={editing}
          categories={flat}
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
            <p className="mt-2 text-sm text-slate-500">This blog post will be permanently removed from the topic.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" className="btn-secondary !py-2 text-sm" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={deletePost.isPending}
                onClick={async () => {
                  try {
                    await deletePost.mutateAsync(confirmDelete.id);
                    toast.success('Post deleted');
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

function PostFormModal({ initial, categories, onClose, onCreate, section = 'mbbs' }) {
  const isEdit = Boolean(initial.id);
  const toast = useToast();
  const createPost = useCreatePost(section);
  const updatePost = useUpdatePost(section);
  const bodyRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(() => ({ ...EMPTY_POST, ...initial, categoryId: initial.categoryId ?? '' }));
  const [tab, setTab] = useState('edit');
  const saving = createPost.isPending || updatePost.isPending;

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const insert = (prefix, suffix = '') => {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart ?? form.body.length;
    const end = el.selectionEnd ?? start;
    const next = form.body.slice(0, start) + prefix + form.body.slice(start, end) + suffix + form.body.slice(end);
    setField('body', next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (end - start) + suffix.length);
    });
  };

  const wrap = (pre, suf) => insert(pre, suf);
  const prependLine = (token) => insert(`${token} `, '');
  const insertLine = (token) => insert(`${token}\n`, '');

  const insertLink = () => {
    const el = bodyRef.current;
    const start = el?.selectionStart ?? form.body.length;
    const end = el?.selectionEnd ?? start;
    const selText = form.body.slice(start, end) || 'link text';
    insert(`[${selText}](https://`, ')');
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.categoryId) errs.categoryId = 'Choose a topic';
    if (!form.body.trim()) errs.body = 'Write some content for this post';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const payload = {
      title: form.title.trim(),
      categoryId: form.categoryId,
      body: form.body,
      isPublished: form.isPublished,
      displayOrder: form.displayOrder ?? 0,
    };
    try {
      if (isEdit) await updatePost.mutateAsync({ id: initial.id, ...payload });
      else await createPost.mutateAsync(payload);
      toast.success(isEdit ? 'Post updated' : 'Post created');
      onClose();
    } catch (err) {
      toast.error(err?.message ?? 'Save failed');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] overflow-y-auto bg-black/40 p-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit post' : 'New post'}
    >
      <form onSubmit={submit} noValidate className="card-base mx-auto max-w-3xl p-7 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg">{isEdit ? 'Edit post' : 'New post'}</h2>
          <div className="flex gap-1 rounded-lg bg-slate-200/70 p-1" role="tablist" aria-label="Editor mode">
            {[
              { key: 'edit', label: 'Write', icon: Pencil },
              { key: 'preview', label: 'Preview', icon: Eye },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${tab === key ? 'bg-white text-brand shadow-card' : 'text-slate-600'}`}
              >
                <Icon size={13} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="post-title" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Title *
            </label>
            <input
              id="post-title"
              className="input-field"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="e.g. How blood flow works in the systemic circulation"
            />
            {errors.title && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="post-category" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Topic *
            </label>
            <select
              id="post-category"
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
            <label htmlFor="post-order" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Display order
            </label>
            <input
              id="post-order"
              type="number"
              min="0"
              className="input-field"
              value={form.displayOrder}
              onChange={(e) => setField('displayOrder', Number(e.target.value) || 0)}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="post-body" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Blog content *
            </label>
            <div className="rounded-xl border border-brand-light bg-white">
              {tab === 'edit' ? (
                <>
                  <div className="flex flex-wrap items-center gap-1 border-b border-brand-light px-2 py-1.5" role="toolbar" aria-label="Formatting tools">
                    <ToolBtn title="Bold" onClick={() => wrap('**', '**')}><Bold size={14} /></ToolBtn>
                    <ToolBtn title="Italic" onClick={() => wrap('*', '*')}><Italic size={14} /></ToolBtn>
                    <ToolBtn title="Heading" onClick={() => prependLine('##')}><Heading size={14} /></ToolBtn>
                    <span className="mx-1 h-5 w-px bg-slate-200" />
                    <ToolBtn title="Bullet list" onClick={() => prependLine('-')}><List size={14} /></ToolBtn>
                    <ToolBtn title="Numbered list" onClick={() => prependLine('1.')}><ListOrdered size={14} /></ToolBtn>
                    <ToolBtn title="Quote" onClick={() => prependLine('>')}><Quote size={14} /></ToolBtn>
                    <span className="mx-1 h-5 w-px bg-slate-200" />
                    <ToolBtn title="Insert link" onClick={insertLink}><Link2 size={14} /></ToolBtn>
                    <ToolBtn title="Embed YouTube video" onClick={() => insertLine('https://www.youtube.com/watch?v=')}><Play size={14} /></ToolBtn>
                    <ToolBtn title="Insert image" onClick={() => insert('![alt text](https://)', '')}><Image size={14} /></ToolBtn>
                    <ToolBtn title="Code block" onClick={() => insertLine('```')}><Code2 size={14} /></ToolBtn>
                  </div>
                  <textarea
                    ref={bodyRef}
                    id="post-body"
                    rows={16}
                    className="w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-400"
                    value={form.body}
                    onChange={(e) => setField('body', e.target.value)}
                    placeholder={
                      'Write your explanation here…\n\n## Example heading\n\nNormal paragraph text.\n\n- bullet point\n- another point\n\nA clickable link: [OpenDrive](https://example.com)\n\nPaste a YouTube link on its own line to play it inside the page:\nhttps://www.youtube.com/watch?v=VIDEO_ID'
                    }
                  />
                </>
              ) : (
                <div className="min-h-[420px] p-4">
                  {form.body.trim() ? (
                    <BlogBody body={form.body} />
                  ) : (
                    <p className="text-sm text-slate-400">Nothing to preview yet — switch to Write and add some content.</p>
                  )}
                </div>
              )}
            </div>
            {errors.body && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.body}</p>}
            <p className="mt-2 text-xs text-slate-400">
              Tip: paste a YouTube link on its own line to embed the player. Use <code className="rounded bg-slate-100 px-1">[text](https://…)</code> for a clickable link.
            </p>
          </div>

          <label className="flex items-end gap-2.5 pb-1 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setField('isPublished', e.target.checked)}
              className="h-4 w-4 rounded accent-[#0b3b5c]"
            />
            Published (visible on the MBBS page)
          </label>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary !py-2.5 text-sm" disabled={saving}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary !py-2.5 text-sm">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create post'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ToolBtn({ title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="rounded-md p-1.5 text-slate-600 transition-colors hover:bg-brand-light hover:text-brand"
    >
      {children}
    </button>
  );
}