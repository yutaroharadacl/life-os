#!/usr/bin/env node
/**
 * 詳細設計書ヘッダの「ステータス」欄の更新漏れを検査する。
 *
 * 実装が終わっているのにステータスが「未着手」「実装中」のまま残る逸脱が
 * 繰り返し発生している（docs/ai-feedback.md 2026-08-07 #3 / 2026-08-18 #1）ため、
 * 注意喚起ではなくコマンドで機械的に検出する。
 *
 * 使い方:
 *   node scripts/check-design-status.mjs                  … 現在のブランチで触った設計書を検査
 *   node scripts/check-design-status.mjs docs/design/x.md … ファイルを明示して検査
 *
 * 終了コード: 0 = 問題なし / 1 = 更新漏れあり
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

/** 失敗しても落とさずに空文字を返す git 実行 */
const git = (command) => {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
};

/** 実装完了として認めるステータス */
const DONE = /実装済み|レビュー済み/;

/** 検査対象の設計書を集める */
const collectTargets = () => {
  const explicit = process.argv.slice(2).filter((arg) => arg.endsWith('.md'));
  if (explicit.length > 0) return explicit;

  const files = new Set();
  const base = git('git merge-base main HEAD').trim();
  if (base) {
    for (const line of git(`git diff --name-only ${base} HEAD -- docs/design`).split('\n')) {
      if (line.trim()) files.add(line.trim());
    }
  }
  for (const line of git('git status --porcelain -- docs/design').split('\n')) {
    const path = line.slice(3).trim();
    if (path) files.add(path);
  }
  return [...files].filter((file) => file.endsWith('.md') && !file.endsWith('_template.md'));
};

/** 設計書ヘッダ表からステータスの値を取り出す */
const readStatus = (file) => {
  const row = readFileSync(file, 'utf8')
    .split('\n')
    .find((line) => /^\|\s*ステータス\s*\|/.test(line));
  if (!row) return null;
  return row.split('|')[2]?.trim() ?? null;
};

const targets = collectTargets().filter(existsSync);

if (targets.length === 0) {
  console.warn('検査対象の設計書はありません。');
  process.exit(0);
}

const problems = [];
for (const file of targets) {
  const status = readStatus(file);
  if (status === null) {
    problems.push(`${file}: ヘッダ表に「ステータス」行がありません`);
  } else if (!DONE.test(status)) {
    problems.push(`${file}: ステータスが「${status}」のままです`);
  }
}

if (problems.length > 0) {
  console.error('❌ 設計書のステータス欄が更新されていません。\n');
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error('\n実装が完了しているなら「実装済み（YYYY-MM-DD）」に更新してください。');
  console.error('設計のみのブランチ（実装未着手）であれば、この検査はスキップして構いません。');
  process.exit(1);
}

console.warn(`✅ 設計書のステータスは更新済みです（${targets.length}件）。`);
