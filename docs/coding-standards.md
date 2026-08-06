# コーディング規約

本プロジェクトのコード規約。既存実装（`src/features/inventory/`）の実態をベースに明文化したもの。
新規コードは必ずこの規約に従うこと。既存コードに規約違反がある場合は**規約側を正**とする。

---

## 1. ディレクトリ構成

```
src/
├── app/
│   └── <route>/page.tsx            … ルーティングのみ。feature のコンポーネントを呼ぶだけの薄い層
├── features/
│   └── <feature>/
│       ├── components/<Xxx>/       … コンポーネント（1つ1ディレクトリ）
│       ├── types/index.ts          … その機能の型定義
│       ├── utils/                  … その機能固有のロジック
│       ├── api/                    … データ取得（現状はモック）
│       └── stores/                 … Zustand ストア
└── shared/                         … 機能横断の共通物（components / utils / types）
```

- **`src/api/` と `src/components/` は使わない**。ESLint の境界定義（`eslint.config.mjs`）に
  存在しないディレクトリのため、共通物は `src/shared/` に置く。
- feature 名はケバブケースではなく単数形の英小文字（例: `inventory`）。

### アーキテクチャ境界（lint で強制）

| from      | 許可される import 先 |
| --------- | -------------------- |
| `app`     | `feature`, `shared`  |
| `feature` | `shared` のみ        |
| `shared`  | `shared` のみ        |

feature 間の相互 import は禁止。共有が必要になったら `shared` へ切り出す。

---

## 2. コンポーネント

### ファイル構成（3点セット）

```
components/InventoryCard/
├── InventoryCard.tsx
├── InventoryCard.module.scss
└── index.ts                 … export { InventoryCard } from './InventoryCard';
```

**他のコンポーネントから参照するときは必ずバレル（`index.ts`）経由**にする。

```ts
// ✅ Good
import { InventoryCard } from '../InventoryCard';

// ❌ Bad（実体ファイルを直接指す）
import { InventoryCard } from '../InventoryCard/InventoryCard';
```

### 記述スタイル

```tsx
type Props = {
  inventories?: Inventory[];
};

export const InventoryList = ({ inventories = [] }: Props) => {
  return <div>{/* ... */}</div>;
};
```

- **名前付き arrow function export**。`interface` と `React.FC` は使わない。
- Props の型名は常に `Props`（ローカル型）。外部に公開する必要がある場合のみ `XxxProps` として export。
- 配列 Props にはデフォルト値（`= []`）を与え、undefined 分岐を減らす。
- `src/app/**/page.tsx` `layout.tsx` のみ Next.js の規約に従い `export default function`。

### Server / Client Components

- **デフォルトは Server Component**（`'use client'` を書かない）。
- `'use client'` を付けるのは、state・イベントハンドラ・ブラウザ API が必要な**最小の葉コンポーネント**だけ。
  ページ全体やリスト全体に付けない。

---

## 3. import

- **境界を跨ぐとき**は `@/` エイリアス: `import { InventoryList } from '@/features/inventory/components/InventoryList';`
- **フィーチャー内**は相対パス: `import { Inventory } from '../types';`
- `import-x/order` によりグループ順が強制される。**グループ間には空行が必要**。

```ts
import { fileURLToPath } from 'node:url'; // builtin

import { describe, expect, it } from 'vitest'; // external

import { InventoryCard } from '@/features/...'; // internal

import { Inventory } from '../types'; // parent

import styles from './InventoryList.module.scss'; // sibling
```

- 未使用 import はエラー（`unused-imports/no-unused-imports`）。
- 意図的に使わない変数・引数は `_` プレフィックスを付ける。

---

## 4. 命名・言語

| 対象                             | 言語・記法                     |
| -------------------------------- | ------------------------------ |
| ファイル名（コンポーネント）     | 英語 PascalCase                |
| ファイル名（その他）             | 英語 camelCase                 |
| コンポーネント・型               | 英語 PascalCase                |
| 関数・変数・オブジェクトキー     | 英語 camelCase                 |
| UI に表示する文字列              | **日本語**                     |
| コメント・JSDoc                  | **日本語**                     |
| テストの `describe` / `it` の説明 | **日本語**                     |

ドメイン語彙（在庫・保管場所・カテゴリ・期限）は要件定義書「10. 用語定義」に合わせる。

---

## 5. 型

- 型は `src/features/<feature>/types/index.ts` に集約する。
- **`any` は禁止**（ESLint エラー）。型が不明な場合は `unknown` + 絞り込みを使う。
- `strict: true` 前提。非 null アサーション（`!`）は避け、早期 return かデフォルト値で処理する。
- API レスポンス型とドメイン型は分けて定義する（Go バックエンド接続時の変更を局所化するため）。

---

## 6. スタイル

- **CSS Modules + SCSS**（`*.module.scss`）。コンポーネントと同階層に co-locate。
- グローバルスタイルは `src/app/globals.css` のみ。
- 色は `globals.css` のカスタムプロパティ（`--background` / `--foreground` など）を優先して使う。
  新しい色を追加する場合もハードコードせずカスタムプロパティとして定義する。
- レスポンシブは**モバイルファースト**（要件定義書「7. 非機能要件」でスマートフォンが主要デバイス）。

---

## 7. テスト

### 原則: テストファースト（TDD）

**RED → GREEN → REFACTOR** のサイクルを守る。

1. **RED**: 実装コードを書く前にテストを書き、失敗することを確認する
2. **GREEN**: テストを通す最小限の実装をする
3. **REFACTOR**: テストが緑のまま、本規約に沿って整理する

### 配置と書き方

- テスト対象と**同階層に co-locate**: `groupeInventories.ts` → `groupeInventories.test.ts`
- **AAA 構成**（Arrange / Act / Assert）。長いテストではコメントで区切る。
- `describe` / `it` の説明文は日本語。「〜する」「〜の場合は〜を返す」の形で振る舞いを書く。
- テストデータはファクトリ関数（`createInventory(overrides)`）で用意し、
  そのテストで意味のある値だけを `overrides` で明示する。

### 何をテストするか

- **純粋関数（`utils/`）**: 入出力。正常系・異常系・境界値（空配列、null、0件、未指定）。
- **コンポーネント**: ユーザーから見た振る舞い。Testing Library でレンダリング結果と操作を検証。
- クエリの優先順位: `getByRole` > `getByLabelText` > `getByText` > `getByTestId`
- 実装詳細（内部 state、クラス名、呼び出し回数）に依存しない。スナップショットテストは使わない。

### 禁止事項

- テストを通すためにアサーションを弱める・削除する
- `it.skip` / `describe.skip` で失敗から逃げる
- テストのために実装側へテスト専用のコードを埋め込む

仕様どおりに実装してもテストが通らない場合は、**仕様かテストのどちらが誤っているかを報告**し、
勝手にどちらかを書き換えない。

---

## 8. Git

### ブランチ

`feature/*` … 機能追加 / `fix/*` … バグ修正 / `add/*` … ドキュメント等の追加 / `refactor/*` … リファクタ

### コミットメッセージ

`<prefix>: <日本語の要約>` の形式。

| prefix      | 用途                       |
| ----------- | -------------------------- |
| `feat:`     | 機能追加                   |
| `fix:`      | バグ修正                   |
| `add:`      | ファイル・ドキュメント追加 |
| `docs:`     | ドキュメント更新           |
| `refactor:` | 挙動を変えない整理         |
| `test:`     | テストの追加・修正         |
| `chore:`    | ビルド・設定まわり         |

例: `feat: 在庫一覧表示機能のmock作成`

### コミット前

`.husky/pre-commit` の lint-staged が `eslint --fix` / `prettier --write` / `tsc --noEmit` を実行する。
これに加えて、コミット前に `pnpm test` が緑であることを確認する。

---

## 9. バックエンド（Go / PostgreSQL）

**現時点では未着手**。実装が始まった段階で、本ファイルにディレクトリ構成・パッケージ命名・
エラーハンドリング・テスト規約を追記すること。実体のない規約を先に書かない。
