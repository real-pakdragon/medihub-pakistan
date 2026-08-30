import { prisma } from '../lib/prisma.js';
import { createHttpError } from '../lib/httpError.js';

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const practiceService = {
  async listPapers() {
    const rows = await prisma.practiceQuestion.findMany({
      select: { university: true, yearTag: true, subject: true },
    });

    const grouped = new Map();
    for (const row of rows) {
      const key = `${row.university}::${row.yearTag}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          university: row.university,
          yearTag: row.yearTag,
          subjects: new Set(),
          questionCount: 0,
        });
      }
      const paper = grouped.get(key);
      paper.subjects.add(row.subject);
      paper.questionCount += 1;
    }

    return {
      data: [...grouped.values()]
        .map((p) => ({ university: p.university, yearTag: p.yearTag, subjects: [...p.subjects].sort(), questionCount: p.questionCount }))
        .sort((a, b) => b.yearTag.localeCompare(a.yearTag) || a.university.localeCompare(b.university)),
    };
  },

  async listQuestions({ university, yearTag, subject, limit }) {
    const where = {
      ...(university ? { university } : {}),
      ...(yearTag ? { yearTag } : {}),
      ...(subject ? { subject } : {}),
    };

    const all = await prisma.practiceQuestion.findMany({ where });
    const picked = shuffle(all).slice(0, Math.min(limit, all.length));

    return {
      data: picked.map((q) => ({
        id: q.id,
        subject: q.subject,
        statement: q.statement,
        options: Array.isArray(q.options) ? q.options : [],
        university: q.university,
        yearTag: q.yearTag,
      })),
      meta: { available: all.length, returned: picked.length },
    };
  },

  async submit(answers) {
    const ids = answers.map((a) => a.id);
    const questions = await prisma.practiceQuestion.findMany({ where: { id: { in: ids } } });
    const byId = new Map(questions.map((q) => [q.id, q]));

    let score = 0;
    const results = answers.map(({ id, choice }) => {
      const q = byId.get(id);
      if (!q) throw createHttpError(404, `Question ${id} not found`);
      const options = Array.isArray(q.options) ? q.options : [];
      const correct = choice === q.correctIndex;
      if (correct) score += 1;
      return {
        id,
        subject: q.subject,
        statement: q.statement,
        chosenIndex: choice,
        correctIndex: q.correctIndex,
        correctAnswer: options[q.correctIndex] ?? '',
        correct,
        explanation: q.explanation ?? null,
      };
    });

    const total = results.length;
    return {
      data: {
        score,
        total,
        percentage: total === 0 ? 0 : Math.round((score / total) * 100),
        results,
      },
    };
  },
};
