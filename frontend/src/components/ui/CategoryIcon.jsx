import {
  Activity,
  BookOpen,
  Brain,
  ClipboardCheck,
  Dna,
  FileText,
  Folder,
  Library,
  Microscope,
  Pill,
  PlayCircle,
  ScanLine,
  Stethoscope,
  Users,
} from 'lucide-react';

const ICONS = {
  stethoscope: Stethoscope,
  activity: Activity,
  dna: Dna,
  microscope: Microscope,
  pill: Pill,
  brain: Brain,
  scanner: ScanLine,
  'clipboard-check': ClipboardCheck,
  'book-open': BookOpen,
  'file-text': FileText,
  'play-circle': PlayCircle,
  users: Users,
  library: Library,
  folder: Folder,
};

export function CategoryIcon({ name, size = 24, className }) {
  const Icon = ICONS[name] ?? Folder;
  return <Icon size={size} className={className} aria-hidden="true" />;
}