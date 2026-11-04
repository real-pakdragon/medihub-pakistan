export const CATEGORIES = [
  { value: 'pre_clinical', label: 'Pre-Clinical' },
  { value: 'clinical', label: 'Clinical' },
  { value: 'past_papers', label: 'Past Papers' },
  { value: 'video', label: 'Video Library' },
  { value: 'community', label: 'Community' },
  { value: 'textbook', label: 'Textbooks' },
];

export const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

export const CONTENT_TYPES = ['book', 'pdf', 'ppt', 'link', 'video', 'file', 'image'];

export const CONTENT_TYPE_LABELS = {
  book: 'Book',
  pdf: 'PDF',
  ppt: 'Presentation (PPT)',
  link: 'External Link',
  video: 'Video',
  file: 'File',
  image: 'Image',
};

export const CATEGORY_ICON_OPTIONS = [
  'stethoscope',
  'activity',
  'dna',
  'microscope',
  'pill',
  'brain',
  'scanner',
  'clipboard-check',
  'book-open',
  'file-text',
  'folder',
  'play-circle',
  'users',
  'library',
];

export const LINK_TYPES = ['drive', 'whatsapp', 'youtube', 'pdf', 'website'];

export const MDCAT_SUBJECTS = ['Biology', 'Chemistry', 'Physics', 'English', 'Logical Reasoning'];

export const MDCAT_PAPER_GROUPS = [
  { university: 'Sukkur IBA University', shortName: 'SIBA Sukkur', province: 'Sindh', keyword: 'SIBA' },
];

export const SOCIALS = {
  whatsapp: {
    label: 'WhatsApp',
    href: 'https://wa.me/923001234567',
    tagline: 'City-wise study groups and daily announcements',
  },
  instagram: {
    label: 'Instagram',
    href: 'https://instagram.com/medihubpk',
    tagline: '@medihubpk',
  },
};

export const SITE = {
  name: 'MediHub Pakistan',
  tagline: 'The study platform for Pakistani medical students',
  description:
    'Curated MBBS notes, past papers, video lectures and study groups — plus early access to our upcoming MDCAT mock test series.',
  supportEmail: 'support@medihub.pk',
};
