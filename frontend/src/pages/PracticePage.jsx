import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  RotateCcw,
  Target,
  Timer,
  XCircle,
} from 'lucide-react';

import { Seo } from '../components/Seo.jsx';
import { MDCAT_SUBJECTS } from '../lib/constants.js';
import { usePracticePapers, usePracticeQuestions, useSubmitPractice } from '../hooks/queries.js';

const LETTERS = ['A', 'B', 'C', 'D'];
const LENGTHS = [5, 10, 20];

function formatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function PracticePage() {
  const [phase, setPhase] = useState('setup'); // setup | loading | quiz | results
  const [paper, setPaper] = useState(null);
  const [subject, setSubject] = useState('');
  const [length, setLength] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  const papersQuery = usePracticePapers();
  const papers = papersQuery.data?.data ?? [];
  const submitPractice = useSubmitPractice();

  const queryParams = useMemo(
    () => ({ university: paper?.university ?? '', yearTag: paper?.yearTag ?? '', subject, limit: Math.max(length, 50) }),
    [paper, subject]
  );
  const questionsQuery = usePracticeQuestions(phase === 'loading' ? queryParams : undefined);

  useEffect(() => {
    if (phase !== 'loading') return;
    if (questionsQuery.isError || (!questionsQuery.isLoading && !questionsQuery.data)) {
      setPhase('setup');
      return;
    }
    if (!questionsQuery.data) return;
    const picked = (questionsQuery.data.data ?? []).slice(0, length);
    if (picked.length === 0) {
      setPhase('setup');
      return;
    }
    setQuestions(picked);
    setAnswers(Object.fromEntries(picked.map((q) => [q.id, -1])));
    setIndex(0);
    setSeconds(0);
    setPhase('quiz');
  }, [phase, questionsQuery.data, questionsQuery.isError, questionsQuery.isLoading, length]);

  useEffect(() => {
    if (phase === 'quiz') {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const startQuiz = (p) => {
    setPaper(p);
    setSubject('');
    setLength(Math.min(length, p.questionCount));
    setPhase('loading');
  };

  const choose = (qIndex) => {
    const q = questions[index];
    setAnswers((prev) => ({ ...prev, [q.id]: qIndex }));
  };

  const goNext = () => setIndex((i) => Math.min(i + 1, questions.length - 1));
  const goPrev = () => setIndex((i) => Math.max(i - 1, 0));

  const finish = () => {
    submitPractice.mutate(
      Object.entries(answers).map(([id, choice]) => ({ id, choice })),
      {
        onSuccess: (data) => {
          setResult(data);
          setPhase('results');
        },
      }
    );
  };

  const resetAll = () => {
    setPhase('setup');
    setPaper(null);
    setResult(null);
    setQuestions([]);
    setAnswers({});
    setIndex(0);
  };

  const retrySame = () => {
    setPhase('loading');
    questionsQuery.refetch();
  };

  /* --------------------------------- results --------------------------------- */
  if (phase === 'results' && result) {
    const bySubject = {};
    for (const r of result.results) {
      bySubject[r.subject] = bySubject[r.subject] ?? { correct: 0, total: 0 };
      bySubject[r.subject].total += 1;
      if (r.correct) bySubject[r.subject].correct += 1;
    }

    return (
      <div className="container-site py-14">
        <Seo title="Practice Results" description="Your MDCAT practice attempt results." path="/mdcat/practice" />
        <button onClick={resetAll} className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-brand-mid hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to all papers
        </button>

        <div className="card-base mx-auto max-w-3xl p-8 text-center sm:p-12">
          <p className="eyebrow justify-center">
            {paper?.university} · {paper?.yearTag}
          </p>
          <div className="mx-auto mt-6 flex h-36 w-36 items-center justify-center rounded-full border-[10px]" style={{ borderColor: result.percentage >= 60 ? '#0e7490' : '#b45309', color: result.percentage >= 60 ? '#0e7490' : '#b45309' }}>
            <span className="font-display text-4xl">{result.percentage}%</span>
          </div>
          <h1 className="section-title mt-6">You scored {result.score} out of {result.total}</h1>
          <p className="mt-3 text-smoke">
            Time taken <strong>{formatTime(seconds)}</strong> · Attempted{' '}
            <strong>{Object.values(answers).filter((a) => a >= 0).length}</strong> of {result.total}
          </p>

          <div className="mt-8 space-y-3 text-left">
            {Object.entries(bySubject).map(([subj, s]) => (
              <div key={subj}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{subj}</span>
                  <span className="text-smoke">{s.correct}/{s.total}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-mist">
                  <div
                    className="h-2 rounded-full bg-secondary"
                    style={{ width: `${Math.round((s.correct / s.total) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <button onClick={retrySame} disabled={submitPractice.isPending} className="btn btn-outline">
              <RotateCcw className="mr-2 h-4 w-4" /> Retry new questions
            </button>
            <button onClick={resetAll} className="btn btn-primary">
              Choose another paper
            </button>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-3xl space-y-4">
          <h2 className="section-title">Review your answers</h2>
          {result.results.map((r, i) => (
            <div key={r.id} className={`card-base border-l-4 p-6 ${r.correct ? 'border-l-teal-600' : 'border-l-red-500'}`}>
              <p className="flex items-start gap-3 font-medium">
                {r.correct ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />}
                <span><span className="text-smoke mr-2">{i + 1}.</span>{r.statement}</span>
              </p>
              {!r.correct && (
                <p className="mt-3 pl-8 text-sm text-red-600">
                  Your answer: {r.chosenIndex >= 0 ? `${LETTERS[r.chosenIndex]}. ${questions.find((q) => q.id === r.id)?.options[r.chosenIndex]}` : 'Skipped'}
                </p>
              )}
              <p className="mt-1 pl-8 text-sm text-teal-700">Correct: {LETTERS[r.correctIndex]}. {r.correctAnswer}</p>
              {r.explanation && <p className="mt-2 pl-8 text-sm leading-relaxed text-smoke">{r.explanation}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---------------------------------- quiz ---------------------------------- */
  if (phase === 'quiz' || phase === 'loading') {
    if (phase === 'loading' || questions.length === 0) {
      return (
        <div className="container-site flex min-h-[50vh] items-center justify-center py-14">
          <div className="animate-pulse text-smoke">Preparing your question set…</div>
        </div>
      );
    }

    const q = questions[index];
    const answeredCount = Object.values(answers).filter((a) => a >= 0).length;
    const isLast = index === questions.length - 1;

    return (
      <div className="bg-paper min-h-screen py-10">
        <div className="container-site max-w-3xl">
          <Seo title="Practice Session" description="MDCAT online practice session in progress." path="/mdcat/practice" />

          <div className="card-base flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-smoke">{paper?.university} · {paper?.yearTag}{subject ? ` · ${subject}` : ''}</p>
              <p className="font-medium">Question {index + 1} of {questions.length}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mist px-3 py-1 text-sm font-medium tabular-nums">
                <Timer className="h-4 w-4 text-secondary" /> {formatTime(seconds)}
              </span>
              <span className="hidden text-sm text-smoke sm:inline">{answeredCount}/{questions.length} answered</span>
            </div>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-mist">
            <div className="h-full bg-secondary transition-all duration-300" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
          </div>

          <div className="card-base mt-6 p-8">
            <span className="pill mb-4 inline-block">{q.subject}</span>
            <h1 className="font-display text-xl leading-snug text-primary sm:text-2xl">{q.statement}</h1>

            <div className="mt-6 space-y-3">
              {q.options.map((opt, i) => {
                const active = answers[q.id] === i;
                return (
                  <button
                    key={i}
                    onClick={() => choose(i)}
                    className={`flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all ${
                      active
                        ? 'border-secondary bg-teal-50 shadow-card'
                        : 'border-line bg-white hover:border-secondary hover:bg-teal-50/40'
                    }`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${active ? 'border-secondary bg-secondary text-white' : 'border-line text-smoke'}`}>
                      {LETTERS[i]}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button onClick={goPrev} disabled={index === 0} className="btn btn-ghost disabled:opacity-40">
                Previous
              </button>
              {isLast ? (
                <button onClick={finish} disabled={submitPractice.isPending} className="btn btn-primary">
                  {submitPractice.isPending ? 'Scoring…' : 'Finish & see score'}
                </button>
              ) : (
                <button onClick={goNext} className="btn btn-primary">
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {questions.map((qq, i) => (
              <button
                key={qq.id}
                onClick={() => setIndex(i)}
                aria-label={`Go to question ${i + 1}`}
                className={`h-8 w-8 rounded-lg border text-xs font-semibold transition-colors ${
                  i === index
                    ? 'border-primary bg-primary text-white'
                    : answers[qq.id] >= 0
                      ? 'border-secondary bg-teal-50 text-secondary'
                      : 'border-line bg-white text-smoke'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------- setup ---------------------------------- */
  return (
    <>
      <Seo
        title="MDCAT Online Practice"
        description="Attempt timed MDCAT MCQ practice sets online — Biology, Chemistry, Physics, English and Logical Reasoning — and get instant scoring with explanations."
        path="/mdcat/practice"
      />

      <section className="bg-gradient-to-br from-brand to-brand-mid py-14 text-white">
        <div className="container-site">
          <Link to="/mdcat" className="mb-6 inline-flex items-center gap-2 text-sm text-white/80 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to MDCAT hub
          </Link>
          <p className="eyebrow !text-white/70">Online Practice</p>
          <h1 className="max-w-2xl font-display text-4xl leading-tight sm:text-5xl">Practise MDCAT MCQs online</h1>
          <p className="mt-4 max-w-2xl text-white/80">
            Pick a paper, filter by subject, and attempt a timed set. Answers are scored instantly with worked explanations for every question.
          </p>
        </div>
      </section>

      <section className="container-site py-14">
        {papersQuery.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <div key={i} className="card-base h-48 animate-pulse bg-mist" />)}
          </div>
        ) : papers.length === 0 ? (
          <div className="card-base mx-auto max-w-lg p-10 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-smoke" />
            <h2 className="section-title mt-4">No practice sets yet</h2>
            <p className="mt-2 text-smoke">Question banks are being prepared. Check back shortly.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {papers.map((p) => (
              <article key={`${p.university}-${p.yearTag}`} className="card-base flex flex-col p-6">
                <div className="flex items-start justify-between">
                  <Target className="h-9 w-9 text-secondary" />
                  <span className="pill">{p.yearTag}</span>
                </div>
                <h2 className="mt-4 font-display text-xl text-primary">{p.university}</h2>
                <p className="mt-1 text-sm text-smoke">{p.questionCount} questions available</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.subjects.map((s) => (
                    <span key={s} className="rounded-full bg-mist px-2.5 py-0.5 text-xs text-primary/70">{s}</span>
                  ))}
                </div>

                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-smoke">Questions per attempt</p>
                  <div className="mt-2 flex gap-2">
                    {LENGTHS.filter((n) => n <= p.questionCount).map((n) => (
                      <button
                        key={n}
                        onClick={() => setLength(n)}
                        className={`rounded-lg border px-3 py-1 text-sm font-medium transition-colors ${
                          length === n ? 'border-secondary bg-teal-50 text-secondary' : 'border-line text-smoke hover:border-secondary'
                        }`}
                      >
                        {n === Math.min(length, p.questionCount) && length === n ? n : n}
                      </button>
                    ))}
                    <button
                      onClick={() => setLength(Math.min(50, p.questionCount))}
                      className={`rounded-lg border px-3 py-1 text-sm font-medium transition-colors ${
                        length === Math.min(50, p.questionCount) ? 'border-secondary bg-teal-50 text-secondary' : 'border-line text-smoke hover:border-secondary'
                      }`}
                    >
                      All
                    </button>
                  </div>
                </div>

                <button onClick={() => startQuiz(p)} className="btn btn-primary mt-5 w-full">
                  Start practice set
                </button>
              </article>
            ))}
          </div>
        )}

        <div className="mt-12 card-base mx-auto max-w-3xl p-6">
          <p className="text-sm text-smoke">
            Looking for the downloadable past papers instead? They remain available on the{' '}
            <Link to="/mdcat#past-papers" className="font-medium text-secondary underline underline-offset-2">MDCAT page</Link>.
            Subject coverage follows the official MDCAT syllabus: {MDCAT_SUBJECTS.join(', ')}.
          </p>
        </div>
      </section>
    </>
  );
}
