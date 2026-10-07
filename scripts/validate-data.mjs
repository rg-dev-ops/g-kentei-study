// 問題・ノートの JSON を検査する: npm run validate
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const categoriesSrc = readFileSync(join(root, 'categories.ts'), 'utf8');
const tagIds = new Set([...categoriesSrc.matchAll(/id: '(c\d+-[a-z0-9-]+)'/g)].map((m) => m[1]));

const errors = [];
const warn = (msg) => errors.push(msg);

function readDir(dir) {
  return readdirSync(join(root, dir))
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ file: `${dir}/${f}`, data: JSON.parse(readFileSync(join(root, dir, f), 'utf8')) }));
}

// 選択肢はシャッフルされるため、位置に依存する表現は使えない
const POSITIONAL = /選択肢[A-DＡ-Ｄア-エ]|上記(の)?(すべて|いずれ)|以上(すべて|のいずれ)/;

const ids = new Set();
const perCategory = {};
const perTag = {};
for (const { file, data } of readDir('questions')) {
  // 1 分野を複数ファイルに分けてよい（c03.json, c03-b.json など）
  const fileCat = Number(file.match(/c(\d+)(?:-[a-z0-9]+)?\.json$/)?.[1]);
  for (const q of data) {
    const where = `${file} ${q.id}`;
    if (ids.has(q.id)) warn(`${where}: ID が重複しています`);
    ids.add(q.id);
    if (q.category !== fileCat) warn(`${where}: category(${q.category}) がファイル名と一致しません`);
    if (!['single', 'combination', 'calculation'].includes(q.kind)) warn(`${where}: kind が不正です`);
    if (!q.stem?.trim()) warn(`${where}: 問題文が空です`);
    if (!Array.isArray(q.tags) || q.tags.length === 0) warn(`${where}: tags がありません`);
    for (const t of q.tags ?? []) {
      if (!tagIds.has(t)) warn(`${where}: 未定義のタグ ${t}`);
      if (!t.startsWith(`c${fileCat}-`)) warn(`${where}: 他分野のタグ ${t}`);
      perTag[t] = (perTag[t] ?? 0) + 1;
    }
    if (q.choices?.length !== 4) warn(`${where}: 選択肢が4つではありません`);
    if (!(q.answer >= 0 && q.answer < (q.choices?.length ?? 0))) warn(`${where}: answer が範囲外です`);
    // 解説の書き出しで正誤が分かるようにしているので、answer と食い違っていないか確認する
    (q.choices ?? []).forEach((c, i) => {
      const head = c.explanation?.slice(0, 20) ?? '';
      if (i === q.answer && !head.includes('正しい')) warn(`${where}: 正解の解説が「正しい」で始まっていません`);
      if (i !== q.answer && !head.includes('誤り')) warn(`${where}: 不正解の解説が「誤り」で始まっていません`);
    });
    const texts = new Set();
    for (const c of q.choices ?? []) {
      if (!c.text?.trim() || !c.explanation?.trim()) warn(`${where}: 選択肢の本文か解説が空です`);
      if (texts.has(c.text)) warn(`${where}: 同じ選択肢があります`);
      texts.add(c.text);
      if (POSITIONAL.test(c.text) || POSITIONAL.test(c.explanation)) warn(`${where}: 選択肢の位置に依存する表現があります`);
    }
    perCategory[q.category] = (perCategory[q.category] ?? 0) + 1;
  }
}

const noteIds = new Set();
for (const { file, data } of readDir('notes')) {
  for (const n of data) {
    const where = `${file} ${n.id}`;
    if (!tagIds.has(n.id)) warn(`${where}: 対応するタグがありません`);
    if (noteIds.has(n.id)) warn(`${where}: ID が重複しています`);
    noteIds.add(n.id);
    if (!n.body?.trim()) warn(`${where}: 本文が空です`);
  }
}

console.log(`問題: ${ids.size} 問 / ノート: ${noteIds.size} / ${tagIds.size} 項目`);
console.log(
  '分野別: ' +
    Object.entries(perCategory)
      .map(([c, n]) => `${c}:${n}`)
      .join(' '),
);
// 苦手判定には 1 小項目あたり 3 問以上あると望ましい
const thinTags = [...tagIds].filter((t) => (perTag[t] ?? 0) < 3);
if (thinTags.length) console.log(`問題が3問未満の小項目: ${thinTags.length} 件 (${thinTags.join(', ')})`);
const noNote = [...tagIds].filter((t) => !noteIds.has(t));
if (noNote.length) console.log(`ノートのない小項目: ${noNote.length} 件`);

if (errors.length) {
  console.error(`\n${errors.length} 件のエラー:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('OK');
