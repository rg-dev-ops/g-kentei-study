import { Link } from 'react-router-dom';
import { CATEGORY_BY_ID, TAG_BY_ID } from '../data/categories';
import { NOTE_BY_ID } from '../data';
import type { Question } from '../types';
import { RichText } from './RichText';
import { ReportButton } from './ReportButton';

export const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const KIND_LABEL: Record<Question['kind'], string> = {
  single: '',
  combination: '組み合わせ',
  calculation: '計算',
};

type Props = {
  question: Question;
  /** 表示順に並べた元インデックス */
  order: number[];
  picked: number | null;
  /** true なら正誤を表示する */
  revealed: boolean;
  onPick?: (choiceIndex: number) => void;
};

export function QuestionView({ question, order, picked, revealed, onPick }: Props) {
  return (
    <div className="question">
      <div className="question-meta">
        <span className="chip">{CATEGORY_BY_ID[question.category].name}</span>
        {KIND_LABEL[question.kind] && <span className="chip chip-accent">{KIND_LABEL[question.kind]}</span>}
      </div>
      <RichText text={question.stem} className="stem" />
      <ol className="choices">
        {order.map((ci, pos) => {
          const isPicked = picked === ci;
          const isAnswer = ci === question.answer;
          let state = '';
          if (revealed) state = isAnswer ? 'correct' : isPicked ? 'wrong' : 'dim';
          else if (isPicked) state = 'picked';
          return (
            <li key={ci}>
              <button
                type="button"
                className={`choice ${state}`}
                disabled={revealed || !onPick}
                onClick={() => onPick?.(ci)}
              >
                <span className="choice-label">{LABELS[pos]}</span>
                <span className="choice-text">
                  <RichText text={question.choices[ci].text} />
                </span>
                {revealed && isAnswer && <span className="choice-mark">正解</span>}
                {revealed && isPicked && !isAnswer && <span className="choice-mark">あなたの解答</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** 全選択肢の解説と、関連する要点ノートへのリンク */
export function Explanation({ question, order, picked }: Omit<Props, 'revealed' | 'onPick'>) {
  const correct = picked === question.answer;
  return (
    <div className="explanation">
      <div className={`verdict ${correct ? 'ok' : 'ng'}`}>
        {picked === null ? '未解答' : correct ? '正解！' : '不正解'}
        <span className="verdict-answer">
          正解は {LABELS[order.indexOf(question.answer)]}
        </span>
      </div>
      <h3>解説</h3>
      <ul className="explain-list">
        {order.map((ci, pos) => (
          <li key={ci} className={ci === question.answer ? 'is-answer' : ''}>
            <div className="explain-head">
              <span className="choice-label">{LABELS[pos]}</span>
              <span className={ci === question.answer ? 'mark-ok' : 'mark-ng'}>
                {ci === question.answer ? '○ 正解' : '× 不正解'}
              </span>
            </div>
            <RichText text={question.choices[ci].explanation} />
          </li>
        ))}
      </ul>
      <div className="explain-footer">
        <div className="related">
          {question.tags.map((t) =>
            NOTE_BY_ID[t] ? (
              <Link key={t} to={`/notes/${t}`} className="chip chip-link">
                📘 {TAG_BY_ID[t]?.name ?? t}
              </Link>
            ) : (
              <span key={t} className="chip">
                {TAG_BY_ID[t]?.name ?? t}
              </span>
            ),
          )}
        </div>
        <ReportButton question={question} />
      </div>
    </div>
  );
}
