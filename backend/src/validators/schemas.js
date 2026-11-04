import { z } from 'zod';

import { sanitizeEmail, sanitizeText } from '../lib/sanitize.js';

const CATEGORIES = ['pre_clinical', 'clinical', 'past_papers', 'video', 'community', 'textbook'];
const MESSAGE_STATUSES = ['new', 'read', 'replied'];
const LINK_TYPES = ['drive', 'whatsapp', 'youtube', 'pdf', 'website'];
const PRACTICE_SUBJECTS = ['Biology', 'Chemistry', 'Physics', 'English', 'Logical Reasoning'];
const CONTENT_TYPES = ['book', 'pdf', 'ppt', 'link', 'video', 'file', 'image'];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const cleanString = (max) =>
  z.string({ required_error: 'This field is required' }).transform(sanitizeText).pipe(
    z.string().min(1, 'This field is required').max(max, `Must be ${max} characters or fewer`)
  );

export const resourceQuerySchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  exclude: z.string().trim().max(120).optional(),
  year: z.string().trim().max(30).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

export const practicePapersSchema = z.object({}).passthrough();

export const practiceQuestionsQuerySchema = z.object({
  university: cleanString(80).optional(),
  yearTag: z.string().trim().max(20).optional(),
  subject: z.enum(PRACTICE_SUBJECTS).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const practiceSubmitSchema = z.object({
  answers: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        choice: z.number().int().min(-1).max(3),
      })
    )
    .min(1, 'No answers submitted')
    .max(50),
});

export const idParamSchema = z.object({ id: z.string().trim().min(1, 'Invalid id') });

export const bookQuerySchema = z.object({
  subject: z.string().trim().min(1).max(80).optional(),
});

export const contactSchema = z.object({
  name: cleanString(80),
  email: z
    .string({ required_error: 'Email is required' })
    .transform(sanitizeEmail)
    .pipe(z.string().email('Please enter a valid email address').max(120)),
  subject: cleanString(120),
  message: cleanString(4000),
});

export const subscribeSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .transform(sanitizeEmail)
    .pipe(z.string().email('Please enter a valid email address').max(120)),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .transform(sanitizeEmail)
    .pipe(z.string().email('Enter a valid email')),
  password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
});

const linkSchema = z.object({
  label: z.string().trim().min(1, 'Link label is required').max(80),
  url: z
    .string()
    .trim()
    .max(500)
    .refine((v) => /^https?:\/\/\S+$/.test(v) || v.startsWith('/'), 'Must be a valid URL or /files path'),
  type: z.enum(LINK_TYPES).default('website'),
});

export const resourceBodySchema = z.object({
  title: cleanString(140),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Choose a valid category' }) }),
  yearTag: z.string().trim().max(40).optional().nullable(),
  iconName: z.string().trim().max(50).optional().nullable(),
  description: z.string().transform(sanitizeText).pipe(z.string().max(600)).optional().nullable(),
  links: z.array(linkSchema).max(20).default([]),
  isPublished: z.boolean().default(true),
});

export const messageStatusSchema = z.object({
  status: z.enum(MESSAGE_STATUSES, { errorMap: () => ({ message: 'Status must be new, read or replied' }) }),
});

export const adminMessageQuerySchema = z.object({
  status: z.enum(MESSAGE_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const mdcatConfigSchema = z.object({
  launchDate: z.coerce.date(),
  currentPhase: cleanString(60),
  phaseDescription: z.string().transform(sanitizeText).pipe(z.string().max(300)),
});

export const slugParamSchema = z.object({ slug: z.string().trim().min(1, 'Invalid slug').max(100) });

export const categoryBodySchema = z.object({
  name: cleanString(100),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(SLUG_PATTERN, 'Lowercase letters, numbers and dashes only (e.g. gross-anatomy)')
    .optional(),
  description: z.string().transform(sanitizeText).pipe(z.string().max(600)).optional().nullable(),
  iconName: z.string().trim().max(50).optional().nullable(),
  parentId: z.string().trim().min(1).max(40).optional().nullable(),
  displayOrder: z.number().int().min(0).max(9999).default(0),
  isPublished: z.boolean().default(true),
});

export const itemQuerySchema = z.object({
  category: z.string().trim().min(1).max(40).optional(),
  type: z.enum(CONTENT_TYPES).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const itemBodySchema = z
  .object({
    title: cleanString(200),
    type: z.enum(CONTENT_TYPES, { errorMap: () => ({ message: 'Choose a valid content type' }) }),
    categoryId: z.string().trim().min(1, 'Choose a topic'),
    description: z.string().transform(sanitizeText).pipe(z.string().max(1500)).optional().nullable(),
    author: z.string().trim().max(120).optional().nullable(),
    edition: z.string().trim().max(60).optional().nullable(),
    fileName: z.string().trim().max(255).optional().nullable(),
    filePath: z.string().trim().max(500).optional().nullable(),
    url: z.string().trim().max(2000).optional().nullable(),
    fileSize: z.coerce.number().int().min(0).optional().nullable(),
    isPublished: z.boolean().default(true),
    displayOrder: z.number().int().min(0).max(9999).default(0),
  })
  .refine((v) => Boolean(v.filePath) || Boolean(v.url), {
    message: 'Add an uploaded file, a file path, or an external URL for this content',
    path: ['filePath'],
  });

export const postQuerySchema = z.object({
  category: z.string().trim().min(1).max(40).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const postBodySchema = z.object({
  title: cleanString(200),
  categoryId: z.string().trim().min(1, 'Choose a topic'),
  body: z.string().min(1, 'Write some content for this post').max(100000),
  isPublished: z.boolean().default(true),
  displayOrder: z.number().int().min(0).max(9999).default(0),
});
