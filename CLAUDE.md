# CLAUDE.md

このファイルは Claude Code がこのリポジトリで作業する際の指針です。

## プロジェクト概要

家庭用食料品在庫管理システム。食材の在庫・期限を登録／確認し、期限が近づいたら通知することで、
食材の廃棄と重複購入を防ぐことを目的とした個人開発プロジェクトです。

**要件の唯一の情報源**: [docs/要件定義書\_食料品在庫管理システム.md](docs/要件定義書_食料品在庫管理システム.md)
機能の判断に迷ったら必ずこのファイルの該当章を読むこと。推測で仕様を決めない。

## 技術スタック

### 稼働中

- **Next.js 16.2**（App Router / React Compiler 有効）
- **React 19** / **TypeScript**（`strict: true`）
- **SCSS Modules**（`*.module.scss`）
- **pnpm**（パッケージマネージャは pnpm 固定。`npm` / `yarn` は使わない）
- **Vitest + Testing Library**（jsdom）

### 導入済みだが未使用

- **TanStack Query** … サーバー状態（API から取得するデータ）を扱う
- **Zustand** … クライアント状態（UI の一時状態、フィルタ条件など）を扱う

この使い分けを守ること。サーバー状態を Zustand に持たせない。

### 未着手（重要）

- **Go バックエンド**と **PostgreSQL** は**まだ1行も存在しない**（`go.mod` も `*.go` もない）。
  要件定義書「9. 制約条件」に書かれた将来の予定にすぎない。
- したがってフロントエンドは当面**モック／ダミーデータ**で進める。
  存在しない API エンドポイントを前提にしたコードを書かないこと。

## アーキテクチャ

Bulletproof React 準拠のフィーチャースライス構成。
**規約ではなく `eslint.config.mjs` の `boundaries/element-types` が実際に強制している**ため、違反すると lint がエラーになる。

```
src/
├── app/       … ルーティングのみ。薄く保つ（画面の中身は feature に置く）
├── features/  … 機能単位のスライス <feature>/{components,types,utils,api,stores}
└── shared/    … 機能横断で使う共通物（未作成。必要になったら作る）
```

**依存の向き**

| from      | 許可される import 先  |
| --------- | --------------------- |
| `app`     | `feature`, `shared`   |
| `feature` | `shared` のみ         |
| `shared`  | `shared` のみ         |

- **feature 同士の相互 import は禁止**。共有したくなったら `shared` に切り出す。
- `src/api/` と `src/components/` は空ディレクトリで、上記の境界定義に存在しない。
  新規ファイルをここに置かないこと。共通物は `src/shared/` に集約する。

## コマンド

```bash
pnpm dev             # 開発サーバー
pnpm build           # 本番ビルド
pnpm lint            # ESLint
pnpm typecheck       # tsc --noEmit
pnpm test            # Vitest（1回実行）
pnpm test:watch      # Vitest（ウォッチ）
pnpm test:coverage   # カバレッジ付き
```

実装を終えたら **`pnpm lint` → `pnpm typecheck` → `pnpm test` の3つを必ず通す**こと。

## コーディング規約

詳細は [docs/coding-standards.md](docs/coding-standards.md) を参照。コードを書く前に必ず読むこと。

要点だけ再掲:

- 1コンポーネント1ディレクトリ（`Xxx.tsx` + `Xxx.module.scss` + `index.ts`）、参照はバレル経由
- 名前付き arrow function export + `type Props = {...}`（`interface` / `React.FC` は使わない）
- デフォルトは Server Component。`'use client'` は必要な最小の葉コンポーネントだけ
- 境界を跨ぐ import は `@/` エイリアス、フィーチャー内は相対パス
- **シンボル名・ファイル名は英語、UI 文字列・コメント・JSDoc は日本語**

## AI駆動開発ワークフロー

```
要件定義書 ──/task-breakdown──▶ docs/tasks.md              [メイン / Opus]
                                    │
                                    ▼
プロンプト ──/detail-design──▶ docs/design/<機能名>.md      [メイン / Opus]
                                    │
                                    ▼
              /implement-from-design（TDDサイクル）
                 ├─ ① RED      : unit-test-writer で先に失敗するテストを書く  [サブ / Sonnet]
                 ├─ ② GREEN    : テストを通す実装                            [メイン]
                 ├─ ③ REFACTOR : 規約に沿って整理（テストは緑のまま）          [メイン]
                 └─ ④ 検証     : lint / typecheck / test
                                    │
                                    ▼
                        design-impl-reviewer                 [サブ / Sonnet]
                        （設計 vs 実装の突合・読み取り専用）
                                    │
                                    ▼
                          docs/ai-feedback.md
                     （CLAUDE.md・規約・スキルへ反映するループ）
                                    │
                                    ▼
                        ──/create-pr──▶ PR                   [メイン]
```

| 種別       | 名前                    | 用途                            |
| ---------- | ----------------------- | ------------------------------- |
| スキル     | `task-breakdown`        | 要件定義書 → 実装タスクへ分割    |
| スキル     | `detail-design`         | プロンプト → 詳細設計書          |
| スキル     | `implement-from-design` | 詳細設計書 → 実装（TDD）         |
| スキル     | `create-pr`             | コミットメッセージと PR の作成   |
| エージェント | `unit-test-writer`      | 単体テストの作成                 |
| エージェント | `design-impl-reviewer`  | 設計と実装の突合レビュー         |

### モデル配分の原則

トークンを無駄にしないため、工程によって担当を分ける。

- **メインセッション（Opus）**: 要件の解釈、設計、レビュー結果の取りまとめと反映判断
- **サブエージェント（Sonnet / Haiku）**: 機械的で作業量の多い工程（テスト生成、差分と設計書の突合）

サブエージェントを新規に作る場合も `model` は `sonnet` か `haiku` を指定する。

### 改善フィードバックループ

`design-impl-reviewer` は必ず「ワークフロー改善提案」を出力する。
メインセッションはそれを [docs/ai-feedback.md](docs/ai-feedback.md) に日付付きで追記すること。
提案が溜まったら、ユーザーの承認を得たうえで CLAUDE.md・`docs/coding-standards.md`・各スキルへ反映する。

## やってはいけないこと

- **テストを書かずに実装を始める**（テストファースト必須。ユーザーが明示的にスキップを指示した場合のみ例外）
- `any` を使う（ESLint エラー）
- `console.log` を使う（`console.warn` / `console.error` のみ可）
- 指示なしに `git commit` / `git push` する
- `docs/要件定義書_*.md` を勝手に書き換える（変更が必要ならユーザーに確認する）
- 設計書に書かれていないファイルを勝手に増やす（必要なら設計書を先に更新する）
