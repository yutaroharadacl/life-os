# 詳細設計書：在庫一覧・検索機能（検索・絞り込み・並び替え）

| 項目       | 内容                                                |
| ---------- | ---------------------------------------------------- |
| 対象要件   | 要件定義書「5-4. 在庫一覧・検索機能」「8. 画面要件 No.1」 |
| タスクID   | なし（`docs/tasks.md` 未作成）                      |
| 作成日     | 2026-08-07                                          |
| ステータス | 未着手                                              |

---

## 1. 概要

在庫一覧画面（`/inventory/lists`）に、検索・絞り込み・並び替えの UI を追加する。

要件定義書「5-4. 在庫一覧・検索機能」より:

- 登録済みの食品を一覧表示できる（**実装済み**。[inventory-list-table.md](inventory-list-table.md) 参照）
- カテゴリ・保管場所・キーワードで検索・絞り込みができる（**本設計の対象**）
- 消費期限が近い順に並び替えできる（現状は固定の挙動として実装済み。本設計でユーザーが
  「期限が近い順」「食品名順」を選べる並び替え UI を追加する）

一覧の表示（表形式・保管場所グルーピング・残り日数の算出）自体は変更しない。
本設計は既存の `InventoryTable` に渡す**在庫配列を絞り込み・並び替えるレイヤー**を追加する。

Go バックエンドは未着手のため、絞り込み・並び替えは**クライアント側で完結**させる
（サーバーへの再取得は発生しない）。

## 2. スコープ

### やること

- キーワード検索（食品名の部分一致、入力するたびに即時反映）
- カテゴリでの絞り込み（プルダウン、単一選択）
- 保管場所での絞り込み（プルダウン、単一選択）
- 上記3条件は **AND** で組み合わさる
- 「絞り込みをクリア」操作（キーワード・カテゴリ・保管場所を初期状態に戻す）
- 並び替え順を選べる UI（プルダウン。選択肢は「10. 未決事項」で確定する）
- 絞り込んだ結果が0件のときの専用メッセージ（在庫が1件も登録されていない0件と区別する）
- 絞り込み・並び替え条件を **Zustand** で保持する
  （CLAUDE.md の使い分け方針「Zustand … クライアント状態（UI の一時状態、フィルタ条件など）」
  に該当する、本プロジェクト最初の Zustand 導入箇所）

### やらないこと

- 絞り込み条件のURLクエリパラメータ化・共有リンク
- 絞り込み・並び替え条件の永続化（`localStorage` 等）。詳細は「10. 未決事項」
- カテゴリ・保管場所マスタ自体の追加・編集・削除（要件 5-2 / 5-3、別タスク）
- サーバーサイドでの絞り込み・ページネーション（Go バックエンド未着手のため）
- 在庫の編集・削除（要件 5-5、別タスク）
- 通知（要件 5-6、別タスク）
- キーワードのあいまい検索（ひらがな/カタカナ正規化、読み仮名検索）。単純な部分一致のみ

---

## 3. 画面・UI 仕様

対象画面: 要件定義書「8. 画面要件」No.1 在庫一覧画面（ホーム）

### 画面構成

- 画面名 / ルート: 在庫一覧画面 / `/inventory/lists`（**ルートの追加なし**）

| 要素                 | 役割                                                             |
| -------------------- | ------------------------------------------------------------------ |
| 「在庫を登録」ボタン | 既存。変更なし                                                   |
| 絞り込みバー         | キーワード入力・カテゴリ選択・保管場所選択・並び替え選択・クリア操作 |
| 在庫テーブル         | 既存 `InventoryTable`。絞り込み・並び替え後の配列を受け取って描画 |

### 絞り込みバーの構成

| 要素             | 種類                     | ラベル（日本語）   | 選択肢                                       |
| ---------------- | ------------------------ | -------------------- | --------------------------------------------- |
| キーワード検索欄 | `<input type="search">`  | 「食品名で検索」     | 自由入力                                      |
| カテゴリ         | `<select>`               | 「カテゴリで絞り込み」 | 先頭「すべて」＋ `categories` の各名称        |
| 保管場所         | `<select>`               | 「保管場所で絞り込み」 | 先頭「すべて」＋ `storageLocations` の各名称 |
| 並び替え         | `<select>`               | 「並び替え」          | 「期限が近い順」（既定）／「食品名順」        |
| クリアボタン     | `<button type="button">` | 「絞り込みをクリア」  | —（キーワード・カテゴリ・保管場所を初期値に戻す。並び替えは変更しない） |

- 絞り込みバーは見出みを持たない。スクリーンリーダーでランドマークとして識別できるよう
  `<div role="search">` でラップする（`<h1>`/`<h2>` の階層には影響しない）。
- すべての入力欄は `<label htmlFor>` と `id` で結び付ける（`getByLabelText` で引けること）。

### 見出し階層

変更なし。既存のまま。

| 見出しテキスト | レベル | 備考               |
| -------------- | ------ | ------------------ |
| 在庫一覧       | `<h1>` | この画面の主見出し（既存） |
| 保管場所名     | `<h2>` | 保管場所ごとのセクション（既存） |

### 状態

| 状態                     | 表示内容                                                                 |
| ------------------------ | ---------------------------------------------------------------------- |
| 初期表示                 | 絞り込みなし。全件を既定の並び順で表示                                 |
| 絞り込み・並び替え適用中 | 条件に一致した在庫のみ、指定した順序で表示。「全 N 件」は**絞り込み後の件数**を表示 |
| 絞り込み結果0件          | セクション・表を描画せず「該当する在庫が見つかりません。」を表示。件数は「全 0 件」 |
| 全体0件（未登録）        | 既存のまま「登録されている在庫はありません。」を表示                     |
| エラー                   | 発生しない（クライアント側の純粋な配列操作のため）                       |

### 操作と遷移

| ユーザー操作                       | 起きること                                       | 遷移先 |
| ----------------------------------- | -------------------------------------------------- | ------ |
| キーワード欄に入力                 | 入力のたびに即時（`onChange`）で一覧が絞り込まれる | なし   |
| カテゴリ / 保管場所を選択          | 即時で一覧が絞り込まれる                           | なし   |
| 並び替えを選択                     | 即時で表示順が変わる                               | なし   |
| 「絞り込みをクリア」を押す         | キーワード・カテゴリ・保管場所が初期値に戻る（並び替えは維持） | なし   |
| 絞り込み中に在庫を登録する         | 登録は成立するが、絞り込み条件（キーワード・カテゴリ・保管場所）は自動的にクリアされる（並び替えは維持） | なし   |

登録時に絞り込みをクリアするのは、条件を残したままだと登録した在庫が絞り込み条件に
一致せず一覧に表示されないことがあるため（コードレビューで発見。登録直後は
「今追加したものを含めた全体」を見せるほうが自然という判断）。

**画面遷移は発生しない**（ルーターを触らない）。デバウンスは入れない
（想定件数が数十〜数百件のため、即時のクライアント側フィルタで十分な性能が出る）。

### レスポンシブ

モバイルファースト。

- **モバイル（〜599px）**: 絞り込みバーの各要素は縦積み（幅100%）。タップ領域は最小44px高。
- **600px 以上**: キーワード欄・カテゴリ・保管場所・並び替えを横並びにし、
  折り返しが必要な場合は `flex-wrap` で2行目へ送る。クリアボタンは右端。

---

## 4. データ・型定義

配置先ファイル: `src/features/inventory/types/index.ts`（追加分のみ。既存の `Inventory` 等は変更しない）

```ts
/** 並び替えの選択肢。expirationAsc: 期限が近い順（既定） / nameAsc: 食品名順 */
export type SortOrder = 'expirationAsc' | 'nameAsc';

/** 絞り込み・並び替え条件 */
export type InventoryFilterState = {
  /** キーワード検索の入力値。空文字は「絞り込みなし」 */
  keyword: string;
  /** カテゴリ名。空文字は「すべて」 */
  category: string;
  /** 保管場所名。空文字は「すべて」 */
  storage: string;
  /** 並び替え順 */
  sortOrder: SortOrder;
};
```

### 要件定義書「6. データ要件」との対応

本設計は既存の `Inventory` 型を変更しない。`InventoryFilterState` は要件定義書のデータ要件に
対応する新規データではなく、UI の一時状態（検索条件）であるため対応表は該当なし。

---

## 5. コンポーネント設計

### 既存コードの再利用

| 再利用するもの                       | 用途                                             |
| -------------------------------------- | -------------------------------------------------- |
| `InventoryTable`                       | 一覧表示。`sortOrder` / `emptyMessage` を追加で受け取れるよう拡張 |
| `groupByStorage`                       | 変更なし（絞り込み後の配列に対してそのまま使う） |
| `sortByExpiration`（`utils/sortInventories.ts`） | 汎用化した `sortInventories` の内部実装として再利用 |
| `getExpirationInfo` / `formatDate`     | 変更なし                                           |
| `categories` / `storageLocations`      | 既存で `page.tsx` → `InventoryListsView` に渡っている値をそのまま絞り込みバーへ転送 |

### 新規／変更するファイル

| ファイルパス                                                                                | 新規/変更 | 責務                                                                   |
| ---------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------ |
| `src/features/inventory/types/index.ts`                                                        | 変更      | `SortOrder` / `InventoryFilterState` を追加                              |
| `src/features/inventory/stores/useInventoryFilterStore.ts`                                     | 新規      | Zustand ストア。絞り込み・並び替え条件と setter を持つ                   |
| `src/features/inventory/stores/useInventoryFilterStore.test.ts`                                | 新規      | 上記のテスト                                                              |
| `src/features/inventory/utils/filterInventories.ts`                                            | 新規      | `filterInventories`（純粋関数。キーワード・カテゴリ・保管場所で絞り込む） |
| `src/features/inventory/utils/filterInventories.test.ts`                                       | 新規      | 上記のテスト                                                              |
| `src/features/inventory/utils/sortInventories.ts`                                              | 変更      | `sortInventories(inventories, sortOrder)` を追加し `sortOrder` で分岐。既存 `sortByExpiration` は内部実装として残す |
| `src/features/inventory/utils/sortInventories.test.ts`                                         | 変更      | `sortInventories` のテストを追加                                         |
| `src/features/inventory/components/InventoryFilterBar/InventoryFilterBar.tsx`                  | 新規      | 検索欄・カテゴリ／保管場所／並び替えの各選択・クリア操作（`'use client'`） |
| `src/features/inventory/components/InventoryFilterBar/InventoryFilterBar.module.scss`          | 新規      | 絞り込みバーのスタイル                                                    |
| `src/features/inventory/components/InventoryFilterBar/index.ts`                                | 新規      | バレル                                                                    |
| `src/features/inventory/components/InventoryFilterBar/InventoryFilterBar.test.tsx`             | 新規      | 入力・選択・クリアのテスト                                               |
| `src/features/inventory/components/InventoryTable/InventoryTable.tsx`                          | 変更      | `sortOrder` プロップ追加（内部で `sortInventories` を使うよう置換）、`emptyMessage` プロップ追加 |
| `src/features/inventory/components/InventoryTable/InventoryTable.test.tsx`                     | 変更      | `sortOrder` / `emptyMessage` のテストを追加                              |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.tsx`                  | 変更      | `useInventoryFilterStore` を読み取り、`filterInventories` で絞り込んだ配列を `InventoryTable` に渡す。`InventoryFilterBar` を描画 |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.module.scss`          | 変更      | 絞り込みバーの配置分の余白調整                                           |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.test.tsx`             | 変更      | 検索・絞り込み・並び替え・クリアの結合的な振る舞いのテストを追加         |

`src/app/inventory/lists/page.tsx` は変更しない（`categories` / `storageLocations` は既に
`InventoryListsView` まで渡っており、そこから `InventoryFilterBar` へ転送するだけで足りるため）。

> ここに列挙されていないファイルを実装時に勝手に増やさない。必要になったら本設計書を先に更新する。

### 階層図

```
InventoryLists (src/app/inventory/lists/page.tsx)   … Server Component（変更なし）
└── InventoryListsView                              … 'use client'
    ├── InventoryFilterBar                          … useInventoryFilterStore を直接参照
    └── InventoryTable                              … 絞り込み・並び替え後の配列を props で受け取る
```

`InventoryFilterBar` は `InventoryListsView` から条件を props で受け取らず、
**Zustand ストアを直接 `useInventoryFilterStore()` で参照**する。
`InventoryListsView` も同じストアを参照して `filterInventories` を呼ぶため、
条件値をコンポーネント間で prop 経由で受け渡す必要がない。

### Props

```ts
// InventoryTable（変更）
type Props = {
  inventories?: Inventory[];
  today?: Date;
  action?: ReactNode;
  /** グループ内の並び替え順。省略時は 'expirationAsc'（既存の挙動） */
  sortOrder?: SortOrder;
  /** 0件のときのメッセージ。省略時は「登録されている在庫はありません。」 */
  emptyMessage?: string;
};
```

```ts
// InventoryFilterBar（新規）
type Props = {
  categories?: Category[];
  storageLocations?: StorageLocation[];
};
```

```ts
// useInventoryFilterStore（Zustand）
type InventoryFilterStore = InventoryFilterState & {
  setKeyword: (keyword: string) => void;
  setCategory: (category: string) => void;
  setStorage: (storage: string) => void;
  setSortOrder: (sortOrder: SortOrder) => void;
  /** キーワード・カテゴリ・保管場所を初期値に戻す（並び替えは変更しない） */
  resetFilters: () => void;
};

const initialFilterState: InventoryFilterState = {
  keyword: '',
  category: '',
  storage: '',
  sortOrder: 'expirationAsc',
};
```

`resetFilters` が `sortOrder` を変えないのは、並び替えは「表示の見せ方」であり
絞り込み条件（何を表示するか）とは性質が異なるため。

---

## 6. 状態管理・データフロー

### Server Component / Client Component の分担

変更なし。`InventoryFilterBar` は `InventoryListsView` の子として、既にクライアント境界に
入っている `InventoryTable` と同様にクライアントコンポーネントとなる（新たな境界追加はない）。

### サーバー状態

変更なし。`page.tsx` が `getInventories()` 等を同期的に呼び、props で渡す。

### クライアント状態

- **絞り込み・並び替え条件**: `useInventoryFilterStore`（**Zustand**）。
  CLAUDE.md の「Zustand … クライアント状態（UI の一時状態、フィルタ条件など）を扱う」に
  合致する、本プロジェクトで最初に Zustand を使う箇所。
- **在庫本体（登録済みリスト）**: 引き続き `InventoryListsView` の `useState`（既存のまま）。
  絞り込み条件と在庫データを同じ state に混ぜず、責務を分離する。

### レンダリング戦略

変更なし。`src/app/inventory/lists/page.tsx` の `export const dynamic = 'force-dynamic'` は維持する。
絞り込み・並び替えは完全にクライアント側の配列操作であり、SSR/ハイドレーションの
新たな不一致要因にはならない（`today` の扱いは既存設計のまま）。

### データの流れ

```
useInventoryFilterStore（keyword, category, storage, sortOrder）
  ↑ InventoryFilterBar     … 入力・選択のたびにストアの setter を呼ぶ
  ↓ InventoryListsView     … ストアを読み取り
      filterInventories(inventories, { keyword, category, storage })
        → InventoryTable に sortOrder とあわせて渡す
      InventoryTable        … 既存どおり groupByStorage → 各グループを
                               sortInventories(group.inventories, sortOrder) で並び替え
                               → 行ごとに整形して描画
```

絞り込みは `InventoryListsView` 側（グループ化の前）で行い、並び替えは `InventoryTable`
内部（グループ化の後、グループごと）で行う。既存の「保管場所ごとにセクション分けする」
表示構造は変えない。

---

## 7. API 仕様

> Go バックエンドは未着手。絞り込み・並び替えは本スコープではクライアント側で完結し、
> 新規エンドポイントは追加しない。将来の拡張を見据えたクエリパラメータ案のみ記載する。

| メソッド | パス                | 用途           |
| -------- | -------------------- | -------------- |
| GET      | `/api/inventories`  | 在庫の一覧取得（既存。将来的にクエリパラメータで絞り込みに対応する想定） |

### 将来の拡張案（本スコープでは未実装）

```ts
// 将来案: GET /api/inventories?keyword=&category=&storage=&sort=
```

在庫件数が要件「7. 非機能要件」の想定（数十〜数百件）を超えて増える場合や、
Go バックエンド接続時にサーバーサイド絞り込みへ移行する契機とする。

### 現段階のモック実装

- 新規のモック実装は不要（既存の `getInventories` / `getCategories` / `getStorageLocations`
  をそのまま利用する）。

---

## 8. バリデーション・エラーハンドリング

自由入力はキーワード検索欄のみで、プルダウンは選択肢からしか値が来ないため、
検証はごく限定的になる。

| 対象                | ルール                                                   | 表示                                       |
| -------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| キーワード           | 制限なし（空文字を許可）。前後の空白は比較前に除去する    | 空文字（または空白のみ）のときは絞り込みなし扱い |
| キーワードの大文字小文字 | 区別しない（英数字のみ。日本語には大文字小文字の概念がないため対象外） | —                                           |
| カテゴリ / 保管場所   | `<select>` の選択肢のみが値になるため不正値は発生しない    | —                                           |
| 絞り込み結果0件       | —                                                          | 「該当する在庫が見つかりません。」を表示     |

- 通信エラーは発生しない（クライアント側の配列操作のみのため）。

---

## 9. テスト観点

> このセクションが `unit-test-writer` の入力になる。

### `filterInventories(inventories, filters)`

#### 正常系

- [ ] キーワードが食品名に部分一致する在庫だけが残る
- [ ] カテゴリを指定すると、そのカテゴリの在庫だけが残る
- [ ] 保管場所を指定すると、その保管場所の在庫だけが残る
- [ ] キーワード・カテゴリ・保管場所を同時に指定すると、すべてを満たす在庫だけが残る（AND）
- [ ] キーワードが `''`、カテゴリが `''`、保管場所が `''` のとき、全件がそのまま返る

#### 異常系

- [ ] `inventories` を省略すると空配列を返す
- [ ] キーワードの前後に空白があっても除去して比較する（`'  牛乳  '` で `牛乳` を含む在庫がヒットする）
- [ ] 大文字小文字を区別しない（半角英字を含む食品名で確認）

#### 境界値

- [ ] 空配列 → 空配列
- [ ] 一致する在庫が0件 → 空配列
- [ ] 元の配列を破壊しない

### `sortInventories(inventories, sortOrder)`

#### 正常系

- [ ] `sortOrder` 省略時（既定 `'expirationAsc'`）は既存の `sortByExpiration` と同じ順序になる
- [ ] `sortOrder` を `'nameAsc'` にすると、食品名の昇順（あいうえお順）に並ぶ

#### 異常系

- [ ] 引数を省略すると空配列を返す

#### 境界値

- [ ] 空配列 → 空配列
- [ ] 1件 → そのまま1件
- [ ] 元の配列を破壊しない

### `useInventoryFilterStore`

#### 正常系

- [ ] 初期状態は `{ keyword: '', category: '', storage: '', sortOrder: 'expirationAsc' }`
- [ ] `setKeyword` / `setCategory` / `setStorage` / `setSortOrder` がそれぞれ該当フィールドのみ更新する
- [ ] `resetFilters` を呼ぶと `keyword` / `category` / `storage` が初期値に戻る
- [ ] `resetFilters` を呼んでも `sortOrder` は変わらない

### `InventoryFilterBar`

#### 正常系

- [ ] キーワード欄・カテゴリ選択・保管場所選択・並び替え選択が `getByLabelText` で取得できる
- [ ] `categories` の各名称が `<option>` として表示される（先頭に「すべて」）
- [ ] `storageLocations` の各名称が `<option>` として表示される（先頭に「すべて」）
- [ ] キーワード欄に入力すると `useInventoryFilterStore` の `keyword` が更新される
- [ ] カテゴリを選択すると `useInventoryFilterStore` の `category` が更新される
- [ ] 「絞り込みをクリア」を押すとキーワード・カテゴリ・保管場所が初期値に戻る

#### 境界値

- [ ] `categories` / `storageLocations` を省略したとき（既定値 `[]`）、選択肢は「すべて」のみでクラッシュしない

### `InventoryTable`（既存テストへの追加）

- [ ] `sortOrder` を渡すと、その順序でグループ内の行が並ぶ
- [ ] `emptyMessage` を渡すと、0件時にその文言が表示される
- [ ] `sortOrder` / `emptyMessage` を省略しても既存の表示が壊れない（後方互換）

### `InventoryListsView`（既存テストへの追加）

#### 正常系

- [ ] 絞り込みバーが表示されている
- [ ] キーワードを入力すると、一致しない在庫が一覧から消える
- [ ] カテゴリを選択すると、該当カテゴリの在庫だけが表示される
- [ ] 「全 N 件」が絞り込み後の件数を表示する
- [ ] 並び替えを変更すると表示順が変わる
- [ ] 「絞り込みをクリア」を押すと全件表示に戻る

#### 境界値

- [ ] 絞り込み結果が0件のとき「該当する在庫が見つかりません。」が表示される
- [ ] 在庫が1件も登録されていないとき（既存）は「登録されている在庫はありません。」のまま

---

## 10. 未決事項・確認事項

> 設計時に判断できなかったことを勝手に決めず、ここに挙げてユーザーに確認する。
> **すべて解決してから実装フェーズに進む。**

未決事項はすべて解決済み（2026-08-07 ユーザー確認）。

- [x] **キーワード検索の対象フィールド** → **食品名（`name`）のみ**を対象にする。
      メモ（`memo`）は対象に含めない。
- [x] **カテゴリ・保管場所フィルタの選択方式** → **単一選択（プルダウン、`<select>`）**。
- [x] **並び替えの選択肢と範囲** → 並び替え UI は**今回のスコープに含める**。
      選択肢は「期限が近い順（`expirationAsc`）」「食品名順（`nameAsc`）」の**2つ**。
      並び替えは現行どおり**保管場所グループ内**に適用し、グルーピング自体は解除しない
      （「4. データ・型定義」「5. コンポーネント設計」に記載の暫定設計を正式な設計として確定する）。
- [x] **絞り込み・並び替え条件の保持** → **保持しない**。画面をリロードすると条件はリセットされる。
      `localStorage` 等の永続化は実装しない。

### 今後のタスクへ持ち越す事項（本スコープ外）

- サーバーサイドでの絞り込み・ページネーション（Go バックエンド接続時、件数が増えた場合）
- 絞り込み条件のURLクエリパラメータ化（共有・ブックマーク用途が出てきた場合）
- 並び替えの選択肢の拡張（登録が新しい順、数量順など）や、グルーピングを解除した
  全体1リスト表示への切り替え（要望が出た時点で別タスク化する）
