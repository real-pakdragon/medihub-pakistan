import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(80, 'Name is too long'),
  email: z.string().trim().email('Please enter a valid email address'),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(120, 'Subject is too long'),
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(4000, 'Message must be under 4,000 characters'),
});

export const subscribeSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const linkSchema = z.object({
  label: z.string().trim().min(1, 'Label required').max(80),
  url: z.string().trim().url('Must be a valid URL'),
  type: z.enum(['drive', 'whatsapp', 'youtube', 'pdf', 'website']),
});

export const resourceSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(140),
  category: z.enum(['pre_clinical', 'clinical', 'past_papers', 'video', 'community', 'textbook'], {
    errorMap: () => ({ message: 'Pick a category' }),
  }),
  yearTag: z.string().trim().max(40).optional().or(z.literal('')),
  iconName: z.string().trim().max(50).optional().or(z.literal('')),
  description: z.string().trim().max(600).optional().or(z.literal('')),
  links: z.array(linkSchema).max(20),
  isPublished: z.boolean(),
});
