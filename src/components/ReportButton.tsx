import { GITHUB_REPO } from '../config';
import type { Question } from '../types';

export function ReportButton({ question }: { question: Question }) {
  if (!GITHUB_REPO) return null;
  const title = `[問題の誤り] ${question.id}`;
  const body = [
    `**問題ID**: ${question.id}`,
    '',
    '**問題文**:',
    question.stem,
    '',
    '**どこが誤っているか**:',
    '（ここに書いてください）',
  ].join('\n');
  const url = `https://github.com/${GITHUB_REPO}/issues/new?${new URLSearchParams({
    title,
    body,
    labels: 'question-error',
  })}`;
  return (
    <a className="btn btn-ghost btn-small" href={url} target="_blank" rel="noreferrer">
      ⚠ 誤りを報告
    </a>
  );
}
