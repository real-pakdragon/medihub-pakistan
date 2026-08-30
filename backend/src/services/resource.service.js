import { prisma } from '../lib/prisma.js';
import { createHttpError } from '../lib/httpError.js';
import { asArrayOfLinks } from '../lib/sanitize.js';

export const resourceService = {
  async listPublished({ category, exclude, year, search, page, limit }) {
    const where = {
      isPublished: true,
      ...(category ? { category } : {}),
      ...(exclude
        ? { category: { notIn: exclude.split(',').map((c) => c.trim()).filter(Boolean) } }
        : {}),
      ...(year ? { yearTag: year } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.resource.findMany({
        where,
        orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.resource.count({ where }),
    ]);

    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  },

  async getPublished(id) {
    const resource = await prisma.resource.findFirst({ where: { id, isPublished: true } });
    if (!resource) throw createHttpError(404, 'Resource not found');
    return resource;
  },

  async listAll({ page = 1, limit = 50 }) {
    const [items, total] = await prisma.$transaction([
      prisma.resource.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.resource.count(),
    ]);
    return { data: items, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  },

  async getById(id) {
    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource) throw createHttpError(404, 'Resource not found');
    return resource;
  },

  async create(payload) {
    return prisma.resource.create({
      data: { ...payload, links: asArrayOfLinks(payload.links ?? []) },
    });
  },

  async update(id, payload) {
    await this.getById(id);
    const data = { ...payload };
    if (payload.links) data.links = asArrayOfLinks(payload.links);
    return prisma.resource.update({ where: { id }, data });
  },

  async remove(id) {
    await this.getById(id);
    await prisma.resource.delete({ where: { id } });
  },

  async publicStats() {
    const [totalResources, communityGroups] = await prisma.$transaction([
      prisma.resource.count({ where: { isPublished: true } }),
      prisma.resource.count({ where: { isPublished: true, category: 'community' } }),
    ]);
    return { totalResources, whatsappGroups: Math.max(communityGroups, 0) };
  },
};
