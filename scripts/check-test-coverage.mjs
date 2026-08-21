#!/usr/bin/env node
/**
 * コンポーネントに対応するテストファイルの欠落を検査する。
 *
 * 設計書のファイル一覧が「新規ファイルには全種類のテストを書く」という暗黙の前提で
 * 作られており、テスト計画から漏れたコンポーネントがそのまま実装まで通った
 * （docs/ai-feedback.md 2026-08-20 #1: QueryProvider.tsx）。
 * 設計レビューの記憶に頼らず、機械的に検出する。
 *
 * 検査対象: src/ 配下の .tsx のうち、次を除いたもの
 *   - src/app/**          … ページ・レイアウト（ルーティングのみの薄い層）
 *   - *.test.tsx          … テストファイル自身
 *   - index.ts(x)         … バレル
 *
 * 使い方:
 *   node scripts/check-test-coverage.mjs        … 全コンポーネントを検査
 *   node scripts/check-test-coverage.mjs --diff … 現在のブランチで触ったものだけ検査
 *
 * 終了コード: 0 = 問題なし / 1 = テスト欠落あり
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = 'src';

/** ルーティング層。薄く保つ規約のためテストを必須にしない */
const isPage = (file) => file.startsWith(`${SRC}/app/`);

/** バレルとテストファイル自身は対象外 */
const isExcluded = (file) =>
  file.endsWith('.test.tsx') || file.endsWith('/index.tsx') || isPage(file);

/** src 配下の .tsx を再帰的に集める */
const collectAll = (dir, found = []) => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      collectAll(path, found);
    } else if (entry.endsWith('.tsx')) {
      found.push(path);
    }
  }
  return found;
};

/** 現在のブランチで追加・変更された .tsx を集める */
const collectChanged = () => {
  const git = (command) => {
    try {
      return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    } catch {
      return '';
    }
  };
  const files = new Set();
  const base = git('git merge-base main HEAD').trim();
  if (base) {
    for (const line of git(`git diff --name-only ${base} HEAD -- ${SRC}`).split('\n')) {
      if (line.trim().endsWith('.tsx')) files.add(line.trim());
    }
  }
  for (const line of git(`git status --porcelain -- ${SRC}`).split('\n')) {
    const path = line.slice(3).trim();
    if (path.endsWith('.tsx')) files.add(path);
  }
  return [...files].filter(existsSync);
};

const diffOnly = process.argv.includes('--diff');
const targets = (diffOnly ? collectChanged() : collectAll(SRC))
  .map((file) => relative('.', file))
  .filter((file) => !isExcluded(file))
  .sort();

if (targets.length === 0) {
  console.warn('検査対象のコンポーネントはありません。');
  process.exit(0);
}

const missing = targets.filter((file) => !existsSync(file.replace(/\.tsx$/, '.test.tsx')));

if (missing.length > 0) {
  console.error('❌ 対応するテストファイルがないコンポーネントがあります。\n');
  for (const file of missing) {
    console.error(`  - ${file}`);
    console.error(`    → ${file.replace(/\.tsx$/, '.test.tsx')} が必要です`);
  }
  console.error('\n設計書「9. テスト観点」と「5. コンポーネント設計」を確認し、');
  console.error('テストを追加してください（設計時点で漏れている場合は設計書も是正すること）。');
  process.exit(1);
}

console.warn(`✅ 全コンポーネントにテストがあります（${targets.length}件）。`);
