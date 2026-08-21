# CLAUDE.md

家庭用食料品在庫管理システム（個人開発）。食材の在庫・期限を登録／確認し、
期限が近づいたら通知することで、廃棄と重複購入を防ぐ。

**要件の唯一の情報源**: [docs/要件定義書\_食料品在庫管理システム.md](docs/要件定義書_食料品在庫管理システム.md)
仕様の判断に迷ったら必ず該当章を読む。推測で仕様を決めない。

## 技術スタック

Next.js 16.2（App Router / React Compiler）/ React 19 / TypeScript `strict` /
SCSS Modules / Vitest + Testing Library（jsdom）/ **pnpm 固定**（`npm`・`yarn` は使わない）。

- TanStack Query = **サーバー状態**、Zustand = **クライアント状態**。導入済みだが未使用。この使い分けを崩さない
- **Go バックエンドと PostgreSQL は別リポジトリ**（`../backend`）。当リポジトリの API は当面すべてモック。
  存在しないエンドポイントを前提にしたコードを書かない

## アーキテクチャ

Bulletproof React 準拠のフィーチャースライス。
`src/app`（ルーティングのみ・薄く保つ）/ `src/features/<feature>/{components,types,utils,api,stores}` /
`src/shared`（機能横断の共通物）。

依存の向きは **`app` → `feature` → `shared` の一方通行**で、
`eslint.config.mjs` の `boundaries/dependencies` が実際に強制している（違反すると lint エラー）。

- **feature 同士の相互 import は禁止**。共有したくなったら `shared` に切り出す
- `src/api/` と `src/components/` は境界定義に存在しない空ディレクトリ。ここにファイルを置かない

## コマンド

```bash
pnpm dev / build / lint / typecheck / test / test:watch / test:coverage
pnpm check:design    # 設計書ヘッダのステータス更新漏れを検査
```

実装を終えたら **`pnpm lint` → `pnpm typecheck` → `pnpm test`** を必ず通す。

`src/app/**` を追加・変更した場合、または日時・リクエストに依存する値を扱う場合は
**`pnpm build`** も実行し、Route 一覧でそのルートが `○ (Static)` になっていないか確認する。
静的化されると `new Date()` がビルド時刻のまま HTML に焼き込まれる。
必要なら `export const dynamic = 'force-dynamic'` で明示的に制御する
（lint / typecheck / test では検出できない）。

## コーディング規約

**[docs/coding-standards.md](docs/coding-standards.md) が正。コードを書く前に必ず読む。**

特に忘れやすい点だけ再掲:

- 1コンポーネント1ディレクトリ（`Xxx.tsx` + `Xxx.module.scss` + `index.ts`）、参照はバレル経由
- 名前付き arrow function export + `type Props = {...}`（`interface` / `React.FC` は使わない）
- デフォルトは Server Component。`'use client'` は必要な最小の葉コンポーネントだけ
- **シンボル名・ファイル名は英語、UI 文字列・コメント・JSDoc は日本語**

## AI駆動開発ワークフロー

| 工程         | 実行                    | 担当     | 成果物                    |
| ------------ | ----------------------- | -------- | ------------------------- |
| タスク分割   | `/task-breakdown`       | メイン   | `docs/tasks.md`           |
| 詳細設計     | `/detail-design`        | メイン   | `docs/design/<機能名>.md` |
| 実装（TDD）  | `/implement-from-design`| メイン   | 実装＋テスト              |
| PR 作成      | `/create-pr`            | メイン   | PR                        |

サブエージェント: `unit-test-writer`（RED フェーズのテスト生成）/
`design-impl-reviewer`（設計 vs 実装の突合）/ `code-reviewer`（バグ・セキュリティ・簡潔性）。

### 3つの停止ゲート（省略しない）

1. **設計書の承認** — `detail-design` の後。未決事項が無くても必ずユーザーのレビューを挟む
2. **自動レビュー** — `implement-from-design` の検証通過後、2つのレビューエージェントを
   指示待ちせず並列起動する。重要度「高」の指摘が1件でもあれば停止して方針を確認する
3. **PR 作成前** — 重要度「高」の指摘が未対応のまま `/create-pr` に進まない

### モデル配分の原則

- **メイン（Opus）**: 要件の解釈、設計、レビュー結果の取りまとめと反映判断
- **サブ（Sonnet / Haiku）**: 機械的で作業量の多い工程。新規サブエージェントも `sonnet` か `haiku` を指定する

### 改善フィードバックループ

`design-impl-reviewer` が出す「ワークフロー改善提案」は、指摘の有無に関わらず
[docs/ai-feedback.md](docs/ai-feedback.md) へ日付付きで追記する。
提案の反映（CLAUDE.md・規約・スキル・エージェントの改訂）は**ユーザーの承認を得てから**行う。

## やってはいけないこと

- **テストを書かずに実装を始める**（ユーザーが明示的にスキップを指示した場合のみ例外）
- **詳細設計書の承認を得ずに実装に入る**（そもそも設計書が必要な変更かの基準は `detail-design`「0.」）
- `any` を使う / `console.log` を使う（`console.warn`・`console.error` のみ可）— いずれも ESLint エラー
- 指示なしに `git commit` / `git push` する
- `docs/要件定義書_*.md` を勝手に書き換える（変更が必要ならユーザーに確認する）
- 設計書に書かれていないファイルを勝手に増やす（必要なら設計書を先に更新する）
