import type { Note, Question } from '../types';

// 問題とノートは分野ごとの JSON（questions/c01.json など）に分けて置く。
// ファイルを追加するだけで読み込まれる。
const questionFiles = import.meta.glob<Question[]>('./questions/*.json', {
  eager: true,
  import: 'default',
});
const noteFiles = import.meta.glob<Note[]>('./notes/*.json', { eager: true, import: 'default' });

export const QUESTIONS: Question[] = Object.values(questionFiles).flat();
export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q]),
);

export const NOTES: Note[] = Object.values(noteFiles).flat();
export const NOTE_BY_ID: Record<string, Note> = Object.fromEntries(NOTES.map((n) => [n.id, n]));
