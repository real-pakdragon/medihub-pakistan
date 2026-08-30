import bcrypt from 'bcryptjs';

import { prisma } from '../src/lib/prisma.js';
import { env } from '../src/config/env.js';

const SAMPLE_RESOURCES = [
  {
    title: '1st Year Pre-Clinical Collection',
    category: 'pre_clinical',
    yearTag: '1st Year',
    iconName: 'book-open',
    description:
      'Everything a fresh medic needs — Anatomy (Gross, Histology, Embryology), Physiology notes & diagrams, and Biochemistry summaries aligned with the PMDC curriculum.',
    links: [
      { label: 'Anatomy Notes (Drive folder)', url: 'https://drive.google.com/drive/folders/medihub-anatomy', type: 'drive' },
      { label: 'Physiology Diagrams Pack', url: 'https://drive.google.com/drive/folders/medihub-physio', type: 'pdf' },
      { label: 'Biochemistry Quick Reviews', url: 'https://t.me/medihubpk/124', type: 'telegram' },
    ],
  },
  {
    title: '2nd Year Pre-Clinical Collection',
    category: 'pre_clinical',
    yearTag: '2nd Year',
    iconName: 'book-open',
    description:
      'Pathology, Pharmacology and Forensic Medicine condensed into exam-focused notes, with high-yield tables and previous-prof favourite questions.',
    links: [
      { label: 'Pathology High-Yield Notes', url: 'https://drive.google.com/drive/folders/medihub-patho', type: 'drive' },
      { label: 'Pharmacology Drug Tables', url: 'https://t.me/medihubpk/201', type: 'telegram' },
    ],
  },
  {
    title: 'Clinical Rotations Guide',
    category: 'clinical',
    yearTag: '3rd–5th Year',
    iconName: 'stethoscope',
    description:
      'Ward-tested guides for Medicine, Surgery, Obs & Gynae and Paeds rotations — presentation templates, case discussions and round-prep summaries.',
    links: [
      { label: 'Medicine Rotation Guide', url: 'https://drive.google.com/drive/folders/medihub-medicine', type: 'drive' },
      { label: 'Surgery Case Log Template', url: 'https://t.me/medihubpk/330', type: 'telegram' },
    ],
  },
  {
    title: 'OSCE & Ward Skills Checklist',
    category: 'clinical',
    yearTag: 'Final Year',
    iconName: 'clipboard-check',
    description:
      'Step-by-step OSCE station walkthroughs, common viva questions and procedural skills checklists used in Pakistani medical colleges.',
    links: [{ label: 'OSCE Stations Handbook', url: 'https://drive.google.com/file/d/medihub-osce', type: 'pdf' }],
  },
  {
    title: 'UHS Past Papers Archive',
    category: 'past_papers',
    yearTag: '2015–2025',
    iconName: 'file-text',
    description:
      'Ten years of University of Health Sciences annual & supply papers for all professional exams, organised by subject and year.',
    links: [
      { label: '1st Prof Papers', url: 'https://t.me/medihubpk/uhs-1stprof', type: 'telegram' },
      { label: '2nd Prof Papers', url: 'https://t.me/medihubpk/uhs-2ndprof', type: 'telegram' },
      { label: '3rd & Final Prof Papers', url: 'https://t.me/medihubpk/uhs-final', type: 'telegram' },
    ],
  },
  {
    title: 'MDCAT Past Papers (All Provinces)',
    category: 'past_papers',
    yearTag: 'MDCAT',
    iconName: 'file-text',
    description:
      'Solved MDCAT papers from UHS, KMU, DUHS and SZABMU with answer keys and topic-wise breakdowns from the last decade.',
    links: [
      { label: 'UHS MDCAT Solved Papers', url: 'https://drive.google.com/drive/folders/medihub-mdcat-uhs', type: 'drive' },
      { label: 'KMU MDCAT Papers', url: 'https://drive.google.com/drive/folders/medihub-mdcat-kmu', type: 'drive' },
    ],
  },
  {
    title: 'Anatomy Video Lecture Library',
    category: 'video',
    yearTag: '1st–2nd Year',
    iconName: 'play-circle',
    description:
      'Curated playlist of the best Anatomy lectures on YouTube, sequenced to match the local first-year syllabus.',
    links: [{ label: 'Watch the playlist', url: 'https://www.youtube.com/playlist?list=PLmedihub-anatomy', type: 'youtube' }],
  },
  {
    title: 'Clinical Skills Video Library',
    category: 'video',
    yearTag: '3rd–5th Year',
    iconName: 'play-circle',
    description:
      'Demonstrations of catheterisation, suturing, IV cannulation, CPR and other logbook procedures filmed on real wards.',
    links: [{ label: 'Procedures playlist', url: 'https://www.youtube.com/playlist?list=PLmedihub-skills', type: 'youtube' }],
  },
  {
    title: 'SIBA Sukkur MDCAT 2025 Paper',
    category: 'past_papers',
    yearTag: '2025',
    iconName: 'clipboardCheck',
    description:
      'Sindh MDCAT 2025 past paper conducted by Sukkur IBA University — complete paper with the official answer key included.',
    links: [{ label: 'View / download paper + answer key (PDF)', url: '/files/mdcat/SIBA-Sindh-MDCAT-2025-Paper-with-Answer-Key.pdf', type: 'pdf' }],
  },
  {
    title: 'SIBA Sukkur MDCAT 2024 Paper',
    category: 'past_papers',
    yearTag: '2024',
    iconName: 'clipboardCheck',
    description:
      'Full-length Sindh MDCAT 2024 past paper conducted by Sukkur IBA University — all 21 pages combined into one PDF for practice under exam conditions.',
    links: [{ label: 'View / download paper (PDF)', url: '/files/mdcat/SIBA-Sindh-MDCAT-2024-Paper.pdf', type: 'pdf' }],
  },
  {
    title: 'MediHub WhatsApp Study Groups',
    category: 'community',
    yearTag: 'All Years',
    iconName: 'users',
    description:
      'City-wise and university-wise study groups with daily quizzes, doubt-solving by senior students, and alerts for newly added resources.',
    links: [
      { label: 'Main Announcements Channel', url: 'https://wa.me/923001234567', type: 'whatsapp' },
      { label: 'Lahore Group', url: 'https://wa.me/923001234567', type: 'whatsapp' },
      { label: 'Karachi Group', url: 'https://wa.me/923001234567', type: 'whatsapp' },
      { label: 'Islamabad/Rawalpindi Group', url: 'https://wa.me/923001234567', type: 'whatsapp' },
    ],
  },
  {
    title: 'Standard Textbook PDF Library',
    category: 'textbook',
    yearTag: 'All Years',
    iconName: 'library',
    description:
      'Kumar & Clark, Guyton, Lippincott, Snell, Langman, Robbins and every standard reference recommended across Pakistani medical colleges.',
    links: [
      { label: 'Browse the full library', url: 'https://drive.google.com/drive/folders/medihub-textbooks', type: 'drive' },
    ],
  },
];

const PRACTICE_QUESTIONS = [
  // ---------------- Biology ----------------
  {
    university: 'MediHub Practice Mock', yearTag: '2026', subject: 'Biology',
    statement: 'Which organelle is primarily responsible for ATP synthesis in eukaryotic cells?',
    options: ['Ribosome', 'Mitochondrion', 'Golgi apparatus', 'Lysosome'],
    correctIndex: 1,
    explanation: 'Mitochondria carry out oxidative phosphorylation on their inner membrane (cristae), producing the bulk of cellular ATP.',
  },
  {
    university: 'MediHub Practice Mock', yearTag: '2026', subject: 'Biology',
    statement: 'In humans, which blood vessels carry oxygenated blood from the lungs to the heart?',
    options: ['Pulmonary arteries', 'Pulmonary veins', 'Coronary arteries', 'Superior vena cava'],
    correctIndex: 1,
    explanation: 'Pulmonary veins are the exception to the rule that veins carry deoxygenated blood — they return oxygenated blood from lungs to the left atrium.',
  },
  {
    university: 'MediHub Practice Mock', yearTag: '2026', subject: 'Biology',
    statement: 'The enzyme that unwinds the DNA double helix during replication is:',
    options: ['Ligase', 'Primase', 'Helicase', 'Topoisomerase'],
    correctIndex: 2,
    explanation: 'Helicase breaks hydrogen bonds between complementary bases, separating the two strands at the replication fork.',
  },
  {
    university: 'MediHub Practice Mock', yearTag: '2026', subject: 'Biology',
    statement: 'Which hormone directly triggers ovulation in the menstrual cycle?',
    options: ['FSH', 'LH', 'Progesterone', 'Oxytocin'],
    correctIndex: 1,
    explanation: 'A sharp mid-cycle surge of luteinising hormone (LH) from the anterior pituitary triggers release of the mature oocyte.',
  },
  {
    university: 'MediHub Practice Mock', yearTag: '2026', subject: 'Biology',
    statement: 'Photosynthesis in C4 plants initially fixes CO₂ into:',
    options: ['RuBP', 'Oxaloacetate', '3-phosphoglycerate', 'Malic acid only'],
    correctIndex: 1,
    explanation: 'PEP carboxylase in mesophyll cells fixes CO₂ into oxaloacetate, which is then converted to malate and shuttled to bundle-sheath cells.',
  },
  // ---------------- Chemistry ----------------
  {
    university: 'MediHub Practice Mock', yearTag: '2026', subject: 'Chemistry',
    statement: 'The hybridisation of carbon atoms in ethyne (C₂H₂) is:',
    options: ['sp³', 'sp²', 'sp', 'sp³d'],
    correctIndex: 2,
    explanation: 'Each carbon forms two sigma bonds (C–H and C≡C) and two pi bonds, requiring sp hybridisation with 180° geometry.',
  },
  {
    university: 'MediHub Practice Mock', yearTag: '2026', subject: 'Chemistry',
    statement: 'According to Le Chatelier’s principle, increasing pressure on N₂(g) + 3H₂(g) ⇌ 2NH₃(g) will:',
    options: ['Shift equilibrium to the left', 'Shift equilibrium to the right', 'Have no effect', 'Increase the rate of reverse reaction only'],
    correctIndex: 1,
    explanation: 'There are 4 moles of gas on the left and 2 on the right; increased pressure shifts equilibrium toward fewer moles — toward ammonia.',
  },
  {
    university: 'MediHub Practice Mock', yearTag: '2026', subject: 'Chemistry',
    statement: 'The pH of a 0.001 M HCl solution is:',
    options: ['1', '3', '11', '14'],
    correctIndex: 1,
    explanation: 'HCl is a strong acid that fully dissociates: [H⁺] = 10⁻³ M, so pH = −log(10⁻³) = 3.',
  },
  {
    university: 'MediHub Practice Mock', yearTag: '2026', subject: 'Chemistry',
    statement: 'Which of the following is the functional group of aldehydes?',
    options: ['–OH', '>C=O within a chain', '–CHO', '–COOH'],
    correctIndex: 2,
    explanation: 'Aldehydes carry the –CHO (formyl) group, with the carbonyl carbon bonded to at least one hydrogen.',
  },
  {
    university: 'MediHub Practice Mock', yearTag: '2026', subject: 'Chemistry',
    statement: 'Isotopes of an element differ in their number of:',
    options: ['Protons', 'Electrons', 'Neutrons', 'Valence shells'],
    correctIndex: 2,
    explanation: 'Isotopes share proton count (hence identity and chemistry) but differ in neutrons, giving different mass numbers.',
  },
  // ---------------- Physics ----------------
  {
    university: 'MediHub Practice Mock', yearTag: '2026', subject: 'Physics',
    statement: 'A projectile reaches maximum range when launched at an angle of:',
    options: ['30°', '45°', '60°', '90°'],
    correctIndex: 1,
    explanation: 'Range R = v²sin(2θ)/g is maximised when sin(2θ) = 1, i.e. 2θ = 90° → θ = 45° (neglecting air resistance).',
  },
  {
    university: 'MediHub Practice Mock', yearTag: '2026', subject: 'Physics',
    statement: 'The SI unit of electrical resistance is equivalent to:',
    options: ['A/V', 'V/A', 'J/C', 'W/A² × A'],
    correctIndex: 1,
    explanation: 'By Ohm’s law R = V/I, so one ohm equals one volt per ampere.',
  },
  {
    university: 'MediHub Practice Mock', yearTag: '2026', subject: 'Physics',
    statement: 'If the distance between two point charges is doubled, the electrostatic force becomes:',
    options: ['Half', 'One quarter', 'Double', 'Four times'],
    correctIndex: 1,
    explanation: 'Coulomb’s law is F ∝ 1/r²; doubling r reduces the force by a factor of 4.',
  },
  {
    university: 'MediHub Practice Mock', yearTag: '2026', subject: 'Physics',
    statement: 'Photoelectric effect demonstrates that light behaves as:',
    options: ['Waves only', 'Particles only', 'Both particles and waves', 'Neither particles nor waves'],
    correctIndex: 1,
    explanation: 'The photoelectric effect is explained by photons transferring quantised energy hf to electrons — evidence for the particle nature of light.',
  },
  {
    university: 'MediHub Practice Mock', yearTag: '2026', subject: 'Physics',
    statement: 'A body moving with uniform velocity has:',
    options: ['Zero acceleration', 'Constant acceleration', 'Increasing momentum', 'Resultant force acting on it'],
    correctIndex: 0,
    explanation: 'Uniform velocity means no change in speed or direction, so acceleration — the rate of change of velocity — is zero (Newton’s first law).',
  },
  // ---------------- English ----------------
  {
    university: 'MediHub Practice Mock', yearTag: '2026', subject: 'English',
    statement: 'Choose the correct sentence.',
    options: ['He is senior than me.', 'He is more senior than I.', 'He is senior to me.', 'He is seniors to me.'],
    correctIndex: 2,
    explanation: 'Adjectives of Latin origin such as senior/junior/superior/inferior take “to”, not “than”.',
  },
  {
    university: 'MediHub Practice Mock', yearTag: '2026', subject: 'English',
    statement: 'Select the word most nearly opposite in meaning to “ephemeral”.',
    options: ['Transient', 'Enduring', 'Fragile', 'Vivid'],
    correctIndex: 1,
    explanation: 'Ephemeral means short-lived; its antonym is enduring (long-lasting).',
  },
  {
    university: 'MediHub Practice Mock', yearTag: '2026', subject: 'English',
    statement: '“The committee ___ divided in its opinion.” Choose the correct verb.',
    options: ['are', 'is', 'were being', 'have been'],
    correctIndex: 1,
    explanation: 'When a collective noun acts as a single unit (“its opinion”), it takes a singular verb: “is divided”.',
  },
  // ---------------- Logical Reasoning ----------------
  {
    university: 'MediHub Practice Mock', yearTag: '2026', subject: 'Logical Reasoning',
    statement: 'Find the next number in the series: 2, 6, 12, 20, 30, ?',
    options: ['36', '40', '42', '46'],
    correctIndex: 2,
    explanation: 'Differences are 4, 6, 8, 10 — next difference is 12, so 30 + 12 = 42. Equivalently n(n+1): 6×7 = 42.',
  },
  {
    university: 'MediHub Practice Mock', yearTag: '2026', subject: 'Logical Reasoning',
    statement: 'All doctors are graduates. Some graduates are researchers. Which conclusion definitely follows?',
    options: ['All doctors are researchers', 'Some doctors are researchers', 'No doctor is a researcher', 'All doctors are graduates (given) — nothing else follows certainly'],
    correctIndex: 3,
    explanation: 'Syllogisms only yield conclusions guaranteed in every case; the second premise gives no certainty about doctors specifically.',
  },
];

async function main() {
  console.log('Seeding MediHub Pakistan database...');

  const passwordHash = await bcrypt.hash(env.seedAdminPassword, 10);
  await prisma.admin.upsert({
    where: { email: env.seedAdminEmail },
    update: {},
    create: { email: env.seedAdminEmail, passwordHash, role: 'admin' },
  });
  console.log(`  admin ready → ${env.seedAdminEmail} (password set via SEED_ADMIN_PASSWORD)`);

  const launchDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
  const existingConfig = await prisma.mdcatConfig.findUnique({ where: { id: 1 } });
  if (!existingConfig) {
    await prisma.mdcatConfig.create({
      data: {
        id: 1,
        launchDate,
        currentPhase: 'Registration Open',
        phaseDescription:
          'The full-length MDCAT mock test goes live soon. Register below for early access and receive the paper and solutions before public release.',
      },
    });
    console.log('  mdcat_config created (launch date = seed date + 45 days)');
  }

  const resourceCount = await prisma.resource.count();
  if (resourceCount === 0) {
    await prisma.resource.createMany({ data: SAMPLE_RESOURCES.map((r) => ({ ...r, isPublished: true })) });
    console.log(`  ${SAMPLE_RESOURCES.length} sample resources created`);
  } else {
    console.log(`  resources table already has ${resourceCount} rows — skipping sample data`);
  }

  const practiceCount = await prisma.practiceQuestion.count();
  if (practiceCount === 0) {
    await prisma.practiceQuestion.createMany({ data: PRACTICE_QUESTIONS });
    console.log(`  ${PRACTICE_QUESTIONS.length} practice questions created`);
  } else {
    console.log(`  practice_questions table already has ${practiceCount} rows — skipping`);
  }

  console.log('Seed complete ✔');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
