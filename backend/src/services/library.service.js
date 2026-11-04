import path from 'node:path';
import { unlink } from 'node:fs/promises';

import { prisma } from '../lib/prisma.js';
import { createHttpError } from '../lib/httpError.js';
import { env } from '../config/env.js';

const toSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const withTreeTotals = (nodes) => {
  const walk = (n) => {
    const direct = (n.items?.length ?? 0) + (n.posts?.length ?? 0);
    const sub = (n.children ?? []).reduce((s, c) => s + walk(c), 0);
    n.totalItems = direct + sub;
    return n.totalItems;
  };
  nodes.forEach(walk);
  return nodes;
};

export const libraryService = {
  /* ----------------------------- Public ----------------------------- */

  async browse(section = 'mbbs') {
    const categories = await prisma.category.findMany({
      where: { isPublished: true, section },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { items: { where: { isPublished: true } }, posts: { where: { isPublished: true } } } },
        items: { where: { isPublished: true }, orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
        posts: { where: { isPublished: true }, orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }] },
      },
    });

    const byId = new Map(categories.map((c) => [c.id, { ...c, children: [] }]));
    const roots = [];
    for (const node of byId.values()) {
      if (node.parentId && byId.has(node.parentId)) {
        byId.get(node.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    }
    return withTreeTotals(roots);
  },

  async getCategory(slug, section = 'mbbs') {
    const categories = await prisma.category.findMany({
      where: { isPublished: true, section },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    const category = categories.find((c) => c.slug === slug);
    if (!category) throw createHttpError(404, 'Topic not found');

    const byId = new Map(categories.map((c) => [c.id, { ...c, children: [] }]));
    const roots = [];
    for (const node of byId.values()) {
      if (node.parentId && byId.has(node.parentId)) byId.get(node.parentId).children.push(node);
      else roots.push(node);
    }

    const [itemGroups, postGroups, items, posts] = await Promise.all([
      prisma.contentItem.groupBy({
        by: ['categoryId'],
        where: { isPublished: true, category: { is: { section } } },
        _count: { _all: true },
      }),
      prisma.post.groupBy({
        by: ['categoryId'],
        where: { isPublished: true, category: { is: { section } } },
        _count: { _all: true },
      }),
      prisma.contentItem.findMany({
        where: { categoryId: category.id, isPublished: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.post.findMany({
        where: { categoryId: category.id, isPublished: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);

    const itemCounts = new Map(itemGroups.map((g) => [g.categoryId, g._count._all]));
    const postCounts = new Map(postGroups.map((g) => [g.categoryId, g._count._all]));

    const totalOf = (n) => {
      const direct = (itemCounts.get(n.id) ?? 0) + (postCounts.get(n.id) ?? 0);
      const sub = n.children.reduce((s, c) => s + totalOf(c), 0);
      n.totalItems = direct + sub;
      return n.totalItems;
    };
    roots.forEach(totalOf);

    const node = byId.get(category.id);
    return { category: node, subcategories: node.children, items, posts };
  },

  async recentItems(section = 'mbbs') {
    return prisma.contentItem.findMany({
      where: { isPublished: true, category: { is: { section } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { category: true },
    });
  },

  async getPost(id, section = 'mbbs') {
    const post = await prisma.post.findFirst({
      where: { id, isPublished: true, category: { is: { section } } },
      include: { category: true },
    });
    if (!post) throw createHttpError(404, 'Post not found');

    const breadcrumb = [];
    let current = post.category;
    let guard = 0;
    while (current && guard < 8) {
      breadcrumb.unshift({ id: current.id, name: current.name, slug: current.slug });
      if (!current.parentId) break;
      current = await prisma.category.findFirst({
        where: { id: current.parentId, isPublished: true },
        select: { id: true, name: true, slug: true, parentId: true },
      });
      guard += 1;
    }

    return { post, breadcrumb };
  },

  /* ----------------------------- Admin ------------------------------ */

  async listCategories(section = 'mbbs') {
    return prisma.category.findMany({
      where: { section },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { items: true, children: true } },
      },
    });
  },

  async createCategory(data, section = 'mbbs') {
    const slug = data.slug || toSlug(data.name);
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) throw createHttpError(409, `A topic with the slug “${slug}” already exists`);

    if (data.parentId) {
      const parent = await prisma.category.findFirst({ where: { id: data.parentId, section } });
      if (!parent) throw createHttpError(404, 'Parent topic not found in this section');
    }

    return prisma.category.create({
      data: {
        section,
        name: data.name,
        slug,
        description: data.description ?? null,
        iconName: data.iconName ?? null,
        parentId: data.parentId ?? null,
        displayOrder: data.displayOrder ?? 0,
        isPublished: data.isPublished ?? true,
      },
    });
  },

  async updateCategory(id, data, section = 'mbbs') {
    const existing = await prisma.category.findFirst({ where: { id, section } });
    if (!existing) throw createHttpError(404, 'Topic not found');

    if (data.parentId) {
      if (data.parentId === id) throw createHttpError(422, 'A topic cannot be its own parent');
      const parent = await prisma.category.findFirst({ where: { id: data.parentId, section } });
      if (!parent) throw createHttpError(404, 'Parent topic not found in this section');
    }

    const slug = data.slug && data.slug !== existing.slug ? data.slug : existing.slug;
    if (slug !== existing.slug) {
      const clash = await prisma.category.findUnique({ where: { slug } });
      if (clash) throw createHttpError(409, `A topic with the slug “${slug}” already exists`);
    }

    return prisma.category.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        slug,
        description: data.description ?? existing.description,
        iconName: data.iconName ?? existing.iconName,
        parentId: data.parentId ?? existing.parentId,
        displayOrder: data.displayOrder ?? existing.displayOrder,
        isPublished: data.isPublished ?? existing.isPublished,
      },
    });
  },

  async deleteCategory(id, section = 'mbbs') {
    const existing = await prisma.category.findFirst({ where: { id, section } });
    if (!existing) throw createHttpError(404, 'Topic not found');

    const items = await prisma.contentItem.findMany({ where: { categoryId: id } });
    await this.removeItemFiles(items);

    await prisma.category.delete({ where: { id } });
    return true;
  },

  async listItems(query = {}, section = 'mbbs') {
    const { category, type, search, page = 1, limit = 20 } = query;
    const where = { category: { is: { section } } };
    if (category) where.categoryId = category;
    if (type) where.type = type;
    if (search) {
      where.OR = [{ title: { contains: search, mode: 'insensitive' } }, { author: { contains: search, mode: 'insensitive' } }];
    }

    const [total, items] = await Promise.all([
      prisma.contentItem.count({ where }),
      prisma.contentItem.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true },
      }),
    ]);

    return { items, total, page, limit };
  },

  async createItem(data, section = 'mbbs') {
    const category = await prisma.category.findFirst({ where: { id: data.categoryId, section } });
    if (!category) throw createHttpError(404, 'Choose a valid topic in this section');

    return prisma.contentItem.create({
      data: {
        section,
        title: data.title,
        type: data.type,
        categoryId: data.categoryId,
        description: data.description ?? null,
        author: data.author ?? null,
        edition: data.edition ?? null,
        fileName: data.fileName ?? null,
        filePath: data.filePath ?? null,
        url: data.url ?? null,
        fileSize: data.fileSize != null ? data.fileSize : null,
        isPublished: data.isPublished ?? true,
        displayOrder: data.displayOrder ?? 0,
      },
      include: { category: true },
    });
  },

  async updateItem(id, data, section = 'mbbs') {
    const existing = await prisma.contentItem.findFirst({ where: { id, section } });
    if (!existing) throw createHttpError(404, 'Item not found');

    if (data.categoryId && data.categoryId !== existing.categoryId) {
      const category = await prisma.category.findFirst({ where: { id: data.categoryId, section } });
      if (!category) throw createHttpError(404, 'Choose a valid topic in this section');
    }

    return prisma.contentItem.update({
      where: { id },
      data: {
        title: data.title ?? existing.title,
        type: data.type ?? existing.type,
        categoryId: data.categoryId ?? existing.categoryId,
        description: data.description ?? existing.description,
        author: data.author ?? existing.author,
        edition: data.edition ?? existing.edition,
        fileName: data.fileName ?? existing.fileName,
        filePath: data.filePath ?? existing.filePath,
        url: data.url ?? existing.url,
        fileSize: data.fileSize != null ? data.fileSize : existing.fileSize,
        isPublished: data.isPublished ?? existing.isPublished,
        displayOrder: data.displayOrder ?? existing.displayOrder,
      },
      include: { category: true },
    });
  },

  async deleteItem(id, section = 'mbbs') {
    const existing = await prisma.contentItem.findFirst({ where: { id, section } });
    if (!existing) throw createHttpError(404, 'Item not found');

    if (existing.filePath && existing.filePath.startsWith('/files/library/')) {
      const file = path.join(env.filesDir, existing.filePath.replace('/files/', ''));
      try {
        await unlink(file);
      } catch {
        /* file already gone — ignore */
      }
    }

    await prisma.contentItem.delete({ where: { id } });
    return true;
  },

  async removeItemFiles(items) {
    for (const item of items) {
      if (item.filePath && item.filePath.startsWith('/files/library/')) {
        const file = path.join(env.filesDir, item.filePath.replace('/files/', ''));
        try {
          await unlink(file);
        } catch {
          /* ignore */
        }
      }
    }
  },

  /* ----------------------------- Posts (blog) ------------------------ */

  async listPosts(query = {}, section = 'mbbs') {
    const { category, search, page = 1, limit = 20 } = query;
    const where = { category: { is: { section } } };
    if (category) where.categoryId = category;
    if (search) where.OR = [{ title: { contains: search, mode: 'insensitive' } }, { body: { contains: search, mode: 'insensitive' } }];

    const [total, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true },
      }),
    ]);

    return { items: posts, total, page, limit };
  },

  async createPost(data, section = 'mbbs') {
    const category = await prisma.category.findFirst({ where: { id: data.categoryId, section } });
    if (!category) throw createHttpError(404, 'Choose a valid topic in this section');

    return prisma.post.create({
      data: {
        section,
        title: data.title,
        categoryId: data.categoryId,
        body: data.body,
        isPublished: data.isPublished ?? true,
        displayOrder: data.displayOrder ?? 0,
      },
      include: { category: true },
    });
  },

  async updatePost(id, data, section = 'mbbs') {
    const existing = await prisma.post.findFirst({ where: { id, section } });
    if (!existing) throw createHttpError(404, 'Post not found');

    if (data.categoryId && data.categoryId !== existing.categoryId) {
      const category = await prisma.category.findFirst({ where: { id: data.categoryId, section } });
      if (!category) throw createHttpError(404, 'Choose a valid topic in this section');
    }

    return prisma.post.update({
      where: { id },
      data: {
        title: data.title ?? existing.title,
        categoryId: data.categoryId ?? existing.categoryId,
        body: data.body ?? existing.body,
        isPublished: data.isPublished ?? existing.isPublished,
        displayOrder: data.displayOrder ?? existing.displayOrder,
      },
      include: { category: true },
    });
  },

  async deletePost(id, section = 'mbbs') {
    const existing = await prisma.post.findFirst({ where: { id, section } });
    if (!existing) throw createHttpError(404, 'Post not found');
    await prisma.post.delete({ where: { id } });
    return true;
  },
};