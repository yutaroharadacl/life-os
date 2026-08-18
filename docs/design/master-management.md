# 詳細設計書：マスタ管理機能

| 項目       | 内容                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| 対象要件   | 要件定義書「5-2. カテゴリマスター管理機能」「5-3. 保管場所マスター管理機能」、画面要件 No.4/4-1/4-2 |
| タスクID   | なし（`docs/tasks.md` 未作成）                                                                              |
| 作成日     | 2026-08-07                                                                                                  |
| ステータス | 実装済み（2026-08-07）                                                                                      |

---

## 1. 概要

要件定義書 5-2・5-3 は、カテゴリ・保管場所それぞれについて次を求めている。

- 初期状態でいくつかの項目が用意されている（カテゴリ: 野菜・肉・魚など／保管場所: 冷蔵庫・冷凍庫など）
- ユーザーが独自に追加・編集・削除できる

画面要件は「マスタ管理画面」（No.4）を、カテゴリ管理・保管場所管理などマスタデータへの入り口となる
上位画面として位置づけ、「カテゴリ・保管場所以外にも今後マスタ（単位マスタ、よく買う食品リストなど）が
増える可能性があるため、同じ枠組みで拡張できるようにする」という設計方針を示している。

カテゴリ（`Category`）と保管場所（`StorageLocation`）は現状どちらも `{ id, name }` という
同一の形（構造的に等価）であるため、本設計では両者を **`MasterItem` という共通の型・共通コンポーネント群**
で扱う「マスタ項目CRUD」の枠組みを1つ作り、カテゴリ管理画面・保管場所管理画面はそれぞれ
ラベル（「カテゴリ」/「保管場所」）と初期データだけを差し替えて同じ枠組みに載せる。

**アーキテクチャ方針（Bulletproof React の feature 境界原則に忠実に従う）**：
マスタ管理は独立した新規 `master` feature として切り出す。`inventory` feature とは
「食品在庫の登録・編集・削除・検索」と「カテゴリ・保管場所マスタの追加・編集・削除」という
別々の関心事であり、それぞれ独立した画面群（画面1〜3 と 画面4/4-1/4-2）を持つため、
1つの feature に同居させない。ただし `Category` / `StorageLocation` 型と読み取り専用API
（`getCategories` / `getStorageLocations`）は `inventory` feature（登録・絞り込みの選択肢として）と
`master` feature（管理対象データそのものとして）の**両方から参照される**ため、
新設する `src/shared/` に切り出し、feature 間の直接依存を作らない。

## 2. スコープ

### やること

- `src/shared/` ディレクトリを新設し、`Category` / `StorageLocation` 型と
  `getCategories` / `getStorageLocations`（読み取り専用モック）を `inventory` feature から移動する
- 新規 `master` feature を作成し、カテゴリ・保管場所のマスタ管理CRUD（一覧・追加・編集・削除）を実装する
- マスタ管理画面（画面4）から、カテゴリ管理・保管場所管理（画面4-1/4-2）への導線
- 既存の在庫一覧画面（`/inventory/lists`）から、マスタ管理画面への導線を追加
- `inventory` feature 側（`InventoryForm` / `InventoryFormModal` / `InventoryFilterBar` /
  `InventoryListsView` / `app/inventory/lists/page.tsx`）の `Category` / `StorageLocation` /
  `getCategories` / `getStorageLocations` の参照元を `@/shared/*` に更新する
- 名称の必須・文字数・重複チェック

### やらないこと

- `Inventory` 型・`getInventories` など在庫データ自体を `shared` に切り出すこと。
  在庫は `inventory` feature 固有のドメインであり、`master` feature から参照されないため
  feature 内に残す（`shared` へ切り出すのは複数 feature から参照される `Category` /
  `StorageLocation` のみ）
- カテゴリ・保管場所の追加・編集・削除と、在庫データ（`Inventory.category` / `Inventory.storage`）との
  整合性連動（例: 削除時に「使用中」を警告する、名称変更を既存在庫の表示に反映する）。
  `shared` に型と読み取りAPIを切り出しても、`inventory` の一覧画面と `master` の管理画面は
  依然として別ページ・別状態（`useState`）であり、実際にはデータが連動していないため、
  チェックのしようがない。Go バックエンドで実データ連携する際に改めて設計する
- カテゴリ・保管場所以外の新規マスタ種別（単位マスタ、よく買う食品リストなど）の実装。
  今回はその2種類が乗る枠組みだけを用意し、実際に別種のマスタを追加するのは別タスクとする
- Go バックエンドとの実通信（永続化）。今回もモックで完結し、ページを離れると内容は失われる
- マスタ管理画面で追加・編集した内容が、同一セッション内の在庫一覧画面（`/inventory/lists`）の
  カテゴリ・保管場所の選択肢にリアルタイムで反映されること（別ページ・別状態のため、
  リロードで元のモックに戻る制約は他機能と同様）

---

## 3. 画面・UI 仕様

対象画面：画面要件 No.4 マスタ管理画面、No.4-1 カテゴリ管理画面、No.4-2 保管場所管理画面

### 画面構成

| 画面 | ルート | 内容 |
| ---- | ------ | ---- |
| マスタ管理画面（画面4） | `/master` | 「カテゴリ管理」「保管場所管理」への導線（リンク2件）を並べるだけの入り口画面 |
| カテゴリ管理画面（画面4-1） | `/master/categories` | カテゴリの一覧・追加・編集・削除 |
| 保管場所管理画面（画面4-2） | `/master/storage-locations` | 保管場所の一覧・追加・編集・削除 |

カテゴリ管理画面・保管場所管理画面は、同じ `MasterItemListView`（`master` feature）を
`title` / `itemLabel` / 初期データだけ差し替えて使う（UI構成は同一）。

- 画面上部: 見出し（例:「カテゴリ管理」）＋「追加」ボタン
- 一覧: 名称と「編集」「削除」ボタンの2列の表。0件のときは
  「登録されている${itemLabel}はありません。」を表示
- 追加・編集: 既存の在庫登録/編集モーダル（`InventoryFormModal`）と同じ `<dialog>` パターンで、
  名称の入力欄1つだけを持つモーダルを開く
- 削除: 在庫編集・削除機能（`InventoryRowActions`）と同じ、行内インライン確認
  （「削除しますか？」＋「削除する」「キャンセル」）を採用する（一貫したUXパターンの踏襲。
  `master` feature 用に同じ見た目・挙動のコンポーネントを別途用意する。「5. コンポーネント設計」参照）

既存の在庫一覧画面（`/inventory/lists`）のヘッダ操作エリア（`InventoryListsView` の
「在庫を登録」ボタンの並び）に、マスタ管理画面へのリンクを1つ追加する。

### 見出し階層

| 画面 | 見出しテキスト | レベル | 備考 |
| ---- | -------------- | ------ | ---- |
| `/master` | マスタ管理 | `<h1>` | この画面の主見出し |
| `/master/categories` | カテゴリ管理 | `<h1>` | この画面の主見出し |
| `/master/storage-locations` | 保管場所管理 | `<h1>` | この画面の主見出し |
| 追加・編集モーダル | カテゴリを追加 / カテゴリを編集 / 保管場所を追加 / 保管場所を編集 | `<h2>` | モーダル自身の見出し（`InventoryFormModal` と同じ扱い） |

### 状態

| 状態                     | 表示内容                                                                     |
| ------------------------ | ------------------------------------------------------------------------------ |
| 初期表示                 | `getCategories()` / `getStorageLocations()` の初期値一覧を表示                 |
| 0件                      | 「登録されている${itemLabel}はありません。」                                   |
| 追加・編集モーダル表示中 | 名称の入力欄1つ＋キャンセル／追加する（編集時は更新する）ボタン                |
| 追加・編集送信中         | ボタンが「追加中…」（編集時「更新中…」）表示になり操作不可                     |
| バリデーションエラー     | 入力欄の下にエラーメッセージ（必須・文字数超過・重複）を表示し、送信は成立しない |
| 追加・編集成功           | モーダルを閉じ、画面上部に「〇〇を追加しました」/「〇〇を更新しました」を表示   |
| 削除・確認前             | 「削除」ボタンのみ                                                             |
| 削除・確認中             | 同じ行に「削除しますか？」＋「削除する」「キャンセル」                         |
| 削除成功                 | 対象行が消え、「〇〇を削除しました」を表示。0件になれば0件表示に戻る           |

### 操作と遷移

- `/inventory/lists` のリンク「マスタ管理」を押す → `/master` に遷移
- `/master` の「カテゴリ管理」/「保管場所管理」を押す → それぞれの管理画面に遷移
- 管理画面で「追加」を押す → 追加モードのモーダルが開く
- 一覧の行で「編集」を押す → 編集モードのモーダルが対象の名称を初期値として開く
- モーダルで送信 → バリデーションOKなら一覧に反映してモーダルを閉じる／NGならエラー表示のままとどまる
- 一覧の行で「削除」→「削除する」→ 一覧から即時に取り除く

---

## 4. データ・型定義

```ts
// src/shared/types/index.ts（新規）
// inventory feature・master feature の両方から参照されるため shared に置く

/** 名称のみを持つマスタ項目の共通の形。カテゴリ・保管場所はどちらもこの形に一致する */
export type MasterItem = {
  id: string;
  name: string;
};

/** マスタ項目の新規追加時の入力値。ID はサーバー（モックでは採番関数）が振るため持たない */
export type MasterItemDraft = Omit<MasterItem, 'id'>;

/** カテゴリマスタ */
export type Category = MasterItem;

/** 保管場所マスタ。DOM の組み込み型 `Storage` と衝突するため `StorageLocation` とする */
export type StorageLocation = MasterItem;
```

```ts
// src/features/master/types/index.ts（新規）
// master feature 内でのみ使うモードの識別子。inventory feature の InventoryFormMode とは
// 別の型として feature ごとに持つ（2 feature 間で共有する理由が無い単純な union 型のため）

/** マスタ項目フォームの動作モード */
export type MasterItemFormMode = 'create' | 'edit';
```

- 要件定義書「6. データ要件」との対応: 「カテゴリマスター（カテゴリID・カテゴリ名）」
  「保管場所マスター（保管場所ID・保管場所名）」がそのまま `MasterItem { id, name }` に対応する
- 既存の `src/features/inventory/types/index.ts` から `Category` / `StorageLocation` の定義は削除する。
  `Category` / `StorageLocation` という型名自体は維持し（`inventory` feature 側のドメイン語彙として
  読みやすいままにするため）、実体は `shared/types` の `MasterItem` のエイリアスとする
- `inventory` feature 側で `Category` / `StorageLocation` を使う箇所は、今後 `../../types` ではなく
  `@/shared/types` から import する（詳細は「5. コンポーネント設計」）

---

## 5. コンポーネント設計

### 配置方針

- `master` feature を新設し、マスタ管理CRUD（一覧・追加・編集・削除の画面・ロジック）はすべてここに置く
- `Category` / `StorageLocation` 型と、読み取り専用の `getCategories` / `getStorageLocations` は
  `inventory` feature・`master` feature の両方から参照されるため `src/shared/` に切り出す
- 追加・更新・削除のモック関数（`createMasterItem` 等）は `master` feature からしか呼ばれないため、
  `shared` には置かず `master` feature 内に閉じる（Bulletproof React の
  「2 feature 以上が使うものだけ shared へ、feature 固有のものは feature 内に留める」方針）
- `inventory` feature 側の変更は、`Category` / `StorageLocation` の import 元を `@/shared/types` に、
  `getCategories` / `getStorageLocations` の import 元を `@/shared/api` に置き換えるだけで、
  ロジック・見た目・テストの期待値は変えない（在庫一覧へのリンク追加を除く）

### 新規／変更するファイル

#### `shared`（新設）

| ファイルパス                              | 新規/変更                                    | 責務                                     |
| -------------------------------------------- | --------------------------------------------- | ------------------------------------------ |
| `src/shared/types/index.ts`                  | 新規                                          | `MasterItem` / `MasterItemDraft` / `Category` / `StorageLocation` を定義 |
| `src/shared/api/getCategories.ts`            | 新規（`inventory/api/getCategories.ts` から移動） | カテゴリ一覧取得（モック）                 |
| `src/shared/api/getStorageLocations.ts`      | 新規（`inventory/api/getStorageLocations.ts` から移動） | 保管場所一覧取得（モック）           |

#### `master`（新設 feature）

| ファイルパス                                                                             | 新規/変更 | 責務                                                                 |
| ------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------- |
| `src/features/master/types/index.ts`                                                        | 新規      | `MasterItemFormMode` を定義                                           |
| `src/features/master/utils/validateMasterItemForm.ts`                                       | 新規      | 名称の必須・文字数・重複チェック                                      |
| `src/features/master/utils/validateMasterItemForm.test.ts`                                  | 新規      | 上記のテスト                                                          |
| `src/features/master/api/createMasterItem.ts`                                               | 新規      | マスタ項目の追加（モック）。将来の `POST /api/categories` `/api/storages` の差し替え点 |
| `src/features/master/api/createMasterItem.test.ts`                                          | 新規      | 上記のテスト                                                          |
| `src/features/master/api/updateMasterItem.ts`                                               | 新規      | マスタ項目の更新（モック）。将来の `PATCH /api/categories/:id` 等の差し替え点 |
| `src/features/master/api/updateMasterItem.test.ts`                                          | 新規      | 上記のテスト                                                          |
| `src/features/master/api/deleteMasterItem.ts`                                               | 新規      | マスタ項目の削除（モック）。将来の `DELETE /api/categories/:id` 等の差し替え点 |
| `src/features/master/api/deleteMasterItem.test.ts`                                          | 新規      | 上記のテスト                                                          |
| `src/features/master/components/MasterItemRowActions/MasterItemRowActions.tsx`              | 新規      | 一覧の1行分の「編集」「削除」操作。削除は行内インライン確認（`InventoryRowActions` と同じUXパターン。feature が異なるため実装は複製する） |
| `src/features/master/components/MasterItemRowActions/MasterItemRowActions.module.scss`      | 新規      | 上記のスタイル                                                         |
| `src/features/master/components/MasterItemRowActions/index.ts`                              | 新規      | バレル export                                                         |
| `src/features/master/components/MasterItemRowActions/MasterItemRowActions.test.tsx`         | 新規      | 上記のテスト                                                          |
| `src/features/master/components/MasterItemForm/MasterItemForm.tsx`                          | 新規      | 名称1項目だけの追加・編集フォーム                                      |
| `src/features/master/components/MasterItemForm/MasterItemForm.module.scss`                  | 新規      | 上記のスタイル                                                         |
| `src/features/master/components/MasterItemForm/index.ts`                                    | 新規      | バレル export                                                         |
| `src/features/master/components/MasterItemForm/MasterItemForm.test.tsx`                     | 新規      | 上記のテスト                                                          |
| `src/features/master/components/MasterItemFormModal/MasterItemFormModal.tsx`                | 新規      | `MasterItemForm` を `<dialog>` に載せる（`InventoryFormModal` と同じ実装パターン） |
| `src/features/master/components/MasterItemFormModal/MasterItemFormModal.module.scss`        | 新規      | 上記のスタイル                                                         |
| `src/features/master/components/MasterItemFormModal/index.ts`                               | 新規      | バレル export                                                         |
| `src/features/master/components/MasterItemFormModal/MasterItemFormModal.test.tsx`           | 新規      | 上記のテスト                                                          |
| `src/features/master/components/MasterItemList/MasterItemList.tsx`                          | 新規      | 名称・操作の2列の表を描画する（グループ化なし。`InventoryTable` の簡易版） |
| `src/features/master/components/MasterItemList/MasterItemList.module.scss`                  | 新規      | 上記のスタイル                                                         |
| `src/features/master/components/MasterItemList/index.ts`                                    | 新規      | バレル export                                                         |
| `src/features/master/components/MasterItemList/MasterItemList.test.tsx`                     | 新規      | 上記のテスト                                                          |
| `src/features/master/components/MasterItemListView/MasterItemListView.tsx`                  | 新規      | カテゴリ管理・保管場所管理の共通クライアント側コンテナ（状態管理を持つ。`InventoryListsView` と同じ実装パターン） |
| `src/features/master/components/MasterItemListView/MasterItemListView.module.scss`          | 新規      | 上記のスタイル                                                         |
| `src/features/master/components/MasterItemListView/index.ts`                                | 新規      | バレル export                                                         |
| `src/features/master/components/MasterItemListView/MasterItemListView.test.tsx`             | 新規      | 上記のテスト                                                          |
| `src/features/master/components/MasterMenu/MasterMenu.tsx`                                  | 新規      | マスタ管理画面（画面4）。カテゴリ管理・保管場所管理へのリンク2件を並べる |
| `src/features/master/components/MasterMenu/MasterMenu.module.scss`                          | 新規      | 上記のスタイル                                                         |
| `src/features/master/components/MasterMenu/index.ts`                                        | 新規      | バレル export                                                         |
| `src/features/master/components/MasterMenu/MasterMenu.test.tsx`                             | 新規      | 上記のテスト                                                          |

#### `app`（新設ルート）

| ファイルパス                               | 新規/変更 | 責務                                                            |
| --------------------------------------------- | --------- | ------------------------------------------------------------------ |
| `src/app/master/page.tsx`                     | 新規      | 画面4。`MasterMenu` を呼ぶだけの薄いページ                        |
| `src/app/master/categories/page.tsx`          | 新規      | 画面4-1。`getCategories()`（`@/shared/api`）を取得し `MasterItemListView` に渡す |
| `src/app/master/storage-locations/page.tsx`   | 新規      | 画面4-2。`getStorageLocations()`（`@/shared/api`）を取得し `MasterItemListView` に渡す |

#### `inventory`（既存・変更）

| ファイルパス                                                                          | 新規/変更 | 内容                                                                 |
| ----------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------- |
| `src/features/inventory/api/getCategories.ts`                                             | 削除      | `src/shared/api/getCategories.ts` へ移動                                |
| `src/features/inventory/api/getStorageLocations.ts`                                       | 削除      | `src/shared/api/getStorageLocations.ts` へ移動                          |
| `src/features/inventory/types/index.ts`                                                   | 変更      | `Category` / `StorageLocation` の定義を削除                             |
| `src/features/inventory/components/InventoryForm/InventoryForm.tsx`                       | 変更      | `Category` / `StorageLocation` の import 元を `@/shared/types` に変更（ロジック変更なし） |
| `src/features/inventory/components/InventoryForm/InventoryForm.test.tsx`                  | 変更      | 同上（テストケース自体は変更しない）                                    |
| `src/features/inventory/components/InventoryFormModal/InventoryFormModal.tsx`             | 変更      | 同上                                                                     |
| `src/features/inventory/components/InventoryFormModal/InventoryFormModal.test.tsx`        | 変更      | 同上                                                                     |
| `src/features/inventory/components/InventoryFilterBar/InventoryFilterBar.tsx`             | 変更      | 同上                                                                     |
| `src/features/inventory/components/InventoryFilterBar/InventoryFilterBar.test.tsx`        | 変更      | 同上                                                                     |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.tsx`             | 変更      | 同上 ＋ マスタ管理画面（`/master`）へのリンクをヘッダ操作エリアに追加     |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.module.scss`     | 変更      | 追加したリンクのスタイル                                                 |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.test.tsx`        | 変更      | import 元の更新 ＋ リンク表示のテストを追加                              |
| `src/app/inventory/lists/page.tsx`                                                         | 変更      | `getCategories` / `getStorageLocations` の import 元を `@/shared/api` に変更 |

> ここに列挙されていないファイルを実装時に勝手に増やさない。必要になったら本設計書を先に更新する。

### 階層図

```
src/shared/
├── types/index.ts        (MasterItem, MasterItemDraft, Category, StorageLocation)
└── api/
    ├── getCategories.ts
    └── getStorageLocations.ts

/master (app/master/page.tsx)
└── MasterMenu (features/master)
    ├── (リンク) /master/categories
    └── (リンク) /master/storage-locations

/master/categories, /master/storage-locations (page.tsx)
└── MasterItemListView (features/master, 'use client')
    ├── MasterItemList (features/master)
    │   └── MasterItemRowActions ('use client', 行ごと)
    └── MasterItemFormModal ('use client')
        └── MasterItemForm ('use client')

InventoryListsView（features/inventory, 既存・変更）
├── (import元変更) Category / StorageLocation ← @/shared/types
└── (追加) マスタ管理へのリンク
```

### Props

```ts
// MasterItemListView（app/master/categories/page.tsx・app/master/storage-locations/page.tsx から呼ばれる）
type Props = {
  /** 画面見出し（例: 'カテゴリ管理'） */
  title: string;
  /** 項目種別のラベル（例: 'カテゴリ' / '保管場所'）。ボタン文言・バリデーションメッセージに使う */
  itemLabel: string;
  /** 初期表示する項目（Server Component から受け取るモック） */
  initialItems?: MasterItem[];
};

// MasterItemList
type Props = {
  items?: MasterItem[];
  itemLabel: string;
  emptyMessage?: string; // 省略時は `登録されている${itemLabel}はありません。` を組み立てる
  onEdit: (item: MasterItem) => void;
  onDelete: (item: MasterItem) => void;
};

// MasterItemRowActions
type Props = {
  item: MasterItem;
  onEdit: (item: MasterItem) => void;
  onDelete: (item: MasterItem) => void;
};

// MasterItemFormModal
type Props = {
  open: boolean;
  onClose: () => void;
  itemLabel: string;
  mode?: MasterItemFormMode; // 省略時 'create'
  initialValue?: string; // 編集対象の現在の名称
  existingNames: string[]; // 重複チェック対象（編集時は対象自身の名称を除いたもの）
  onSubmit: (draft: MasterItemDraft) => void;
};

// MasterItemForm
type Props = {
  itemLabel: string;
  mode?: MasterItemFormMode;
  initialValue?: string;
  existingNames: string[];
  onSubmit: (draft: MasterItemDraft) => void | Promise<void>;
  onCancel: () => void;
};

// MasterMenu
// Props なし（リンク2件は固定。将来マスタ種別が増えたら配列化を検討する）
```

`MasterItem` / `MasterItemDraft` は `@/shared/types` から、`MasterItemFormMode` は
`../../types`（`master` feature 内の相対パス）から import する。

`mode` によるラベルの出し分け（`InventoryForm` の `SUBMIT_LABELS` と同じパターン）：

| mode     | モーダルタイトル             | 送信ボタン | 送信中ラベル |
| -------- | ------------------------------ | ---------- | ------------ |
| `create` | ${itemLabel}を追加             | 追加する   | 追加中…      |
| `edit`   | ${itemLabel}を編集             | 更新する   | 更新中…      |

---

## 6. 状態管理・データフロー

- **Server / Client 分担**: `app/master/categories/page.tsx` ・ `app/master/storage-locations/page.tsx`
  は Server Component（`getCategories()` / `getStorageLocations()` を `@/shared/api` から呼ぶだけ）。
  `MasterItemListView` を起点に `'use client'` ツリーになる。`MasterItemRowActions` のみ
  削除確認のローカル state を持つ（`inventory` feature の `InventoryTable` / `InventoryRowActions`
  と同じ方針）
- **サーバー状態**: TanStack Query は未導入のまま（Go バックエンドがないため）。
  `MasterItemListView` の `useState<MasterItem[]>` がその場の唯一の状態源
- **クライアント状態**: Zustand は使わない。在庫一覧と異なり検索・絞り込み・並び替えが無く、
  ページを跨いで保持すべき状態がないため
- **レンダリング戦略**: カテゴリ・保管場所の一覧・追加・編集・削除はいずれも日時やリクエスト情報に
  依存しないため、`/master` ・ `/master/categories` ・ `/master/storage-locations` は
  既定の静的プリレンダリングのままでよい（`dynamic = 'force-dynamic'` は不要）
- **データの流れ**:
  1. `MasterItemList` の行で「編集」→ `MasterItemRowActions` が `onEdit(item)` を呼ぶ
  2. `MasterItemListView` が `editingTarget` に対象を保持し、モーダルを `mode: 'edit'`・
     `initialValue: editingTarget.name` で開く
  3. フォーム送信で得た `MasterItemDraft` と `editingTarget.id` を合成し
     （`updateMasterItem(id, draft)`）、`items` 配列内の該当要素を差し替える
  4. 「削除」→ `MasterItemRowActions` が確認後に `onDelete(item)` を呼び、
     `MasterItemListView` が `deleteMasterItem(id)` を呼んだうえで `items` から該当要素を除去する
  5. どちらも成功後、既存の `InventoryListsView` と同じ仕組みでフラッシュメッセージを表示する

---

## 7. API 仕様

> Go バックエンドは未着手。現段階はモック実装だが、将来の API 契約を見据えて入出力を定義する。
> カテゴリ・保管場所は将来的にも別リソースとして扱う想定のため、エンドポイントは種別ごとに分ける
> （モック実装のロジックだけを `MasterItem` として共通化する）。

| メソッド | パス                    | 用途           |
| -------- | ----------------------- | -------------- |
| GET      | `/api/categories`       | カテゴリ一覧取得（既存の `getCategories` が対応） |
| POST     | `/api/categories`       | カテゴリ追加   |
| PATCH    | `/api/categories/{id}`  | カテゴリ更新   |
| DELETE   | `/api/categories/{id}`  | カテゴリ削除   |
| GET      | `/api/storages`         | 保管場所一覧取得（既存の `getStorageLocations` が対応） |
| POST     | `/api/storages`         | 保管場所追加   |
| PATCH    | `/api/storages/{id}`    | 保管場所更新   |
| DELETE   | `/api/storages/{id}`    | 保管場所削除   |

### リクエスト / レスポンス

```ts
// POST /api/categories, /api/storages
// Request: { name: string }
// Response: 201 Created, { id: string, name: string }

// PATCH /api/categories/{id}, /api/storages/{id}
// Request: { name: string }
// Response: 200 OK, { id: string, name: string }

// DELETE /api/categories/{id}, /api/storages/{id}
// Request: なし
// Response: 204 No Content
```

### 現段階のモック実装

- 配置先: `src/features/master/api/createMasterItem.ts` ・ `updateMasterItem.ts` ・ `deleteMasterItem.ts`
  （追加・更新・削除は `master` feature のみが呼ぶため feature 内に置く）
- 読み取り用の `getCategories` / `getStorageLocations` は `src/shared/api/` に置く
  （`inventory` feature からも参照するため）
- `createMasterItem(draft)` は `createInventory` と同じ採番ロジック（`crypto.randomUUID` の
  フォールバック含む）で ID を振って返す
- `updateMasterItem(id, draft)` は `{ ...draft, id }` を組み立てて返すだけ（`updateInventory` と同じ）
- `deleteMasterItem(id)` は何もしない（呼び出し口を用意するだけ。`deleteInventory` と同じ）
- カテゴリ用・保管場所用でモック関数を分けず、`MasterItem` 共通の1セットを両画面から呼ぶ
  （画面側が `getCategories()` / `getStorageLocations()` のどちらを初期値にするかだけを切り替える）
- 永続化はしないため、ページを離れる（別ルートへ遷移する）と内容は失われる

---

## 8. バリデーション・エラーハンドリング

| 対象 | ルール                                                       | エラーメッセージ（日本語）                       |
| ---- | -------------------------------------------------------------- | --------------------------------------------------- |
| 名称 | 必須                                                           | `${itemLabel}名を入力してください`                   |
| 名称 | 20文字以内                                                     | `${itemLabel}名は20文字以内で入力してください`       |
| 名称 | 既存の項目（編集時は自分自身を除く）と完全一致する名前は禁止   | `同じ名前の${itemLabel}が既に登録されています`       |
| 削除 | 常に成功する（在庫データとの整合性チェックはスコープ外）       | なし                                                 |

- `validateMasterItemForm(name, itemLabel, existingNames)`（`src/features/master/utils/`）に集約する
- 重複チェックは前後の空白を取り除いた（`trim()`）完全一致で行う
- 編集時、名称を変更せずそのまま送信してもエラーにならないよう、`existingNames` には
  呼び出し元（`MasterItemListView`）が編集対象自身を除いて渡す

---

## 9. テスト観点

> このセクションが `unit-test-writer` の入力になる。抽象的に書かず、
> 「入力 → 期待される結果」が読み取れる粒度で書くこと。

### 正常系

- [ ] カテゴリ管理画面（`/master/categories`）にアクセスすると初期カテゴリ一覧（野菜・肉…）が表示される
- [ ] 保管場所管理画面（`/master/storage-locations`）にアクセスすると初期保管場所一覧（冷蔵庫・冷凍庫…）が表示される
- [ ] 「追加」ボタンを押すとモーダルが開き、タイトルが「カテゴリを追加」になる（保管場所側は「保管場所を追加」）
- [ ] 名称を入力して「追加する」を押すと一覧に新しい項目が増え、「〇〇を追加しました」が表示されモーダルが閉じる
- [ ] 行の「編集」を押すとモーダルが「カテゴリを編集」で開き、名称欄に対象の現在値が初期表示される
- [ ] 名称を変更して「更新する」を押すと一覧の当該行の名称が変わり、「〇〇を更新しました」が表示される
- [ ] 「削除」を押すとその行に「削除しますか？」「削除する」「キャンセル」が表示される
- [ ] 確認表示で「削除する」を押すと対象行が消え、「〇〇を削除しました」が表示される
- [ ] 確認表示で「キャンセル」を押すと削除されず、ボタン表示に戻る
- [ ] マスタ管理画面（`/master`）に「カテゴリ管理」「保管場所管理」へのリンクが表示され、それぞれ正しい遷移先を指す
- [ ] 在庫一覧画面（`/inventory/lists`）に「マスタ管理」へのリンクが表示され、`/master` を指す
- [ ] `InventoryForm` ・ `InventoryFormModal` ・ `InventoryFilterBar` の既存テストが、
      `Category` / `StorageLocation` の import 元変更後も全て緑のまま（回帰確認。既存テストケース自体の追加変更は無い）

### 異常系

- [ ] 名称を空のまま「追加する」を押すと「カテゴリ名を入力してください」が表示され追加されない
- [ ] 21文字の名称で追加すると「カテゴリ名は20文字以内で入力してください」が表示され追加されない
- [ ] 既存と同じ名称（例: 「野菜」）で追加すると「同じ名前のカテゴリが既に登録されています」が表示され追加されない
- [ ] 編集で他の既存項目と同じ名称に変更しようとするとエラーが表示され更新されない
- [ ] 編集で名称を変更せずそのまま更新するとエラーにならず成功する（自分自身との重複は除外される）

### 境界値

- [ ] 項目が1件も無い状態で「登録されているカテゴリはありません。」が表示される
- [ ] 項目が1件だけの状態でその1件を削除すると0件表示に戻る
- [ ] 前後に空白を含む名称（例: 「 野菜 」）を追加すると、trim後の「野菜」として登録され、既存の「野菜」と重複エラーになる

---

## 10. 未決事項・確認事項

- [x] **マスタ管理画面への導線の置き場所**: 在庫一覧画面（`/inventory/lists`）のヘッダ操作エリアに
      「マスタ管理」リンクを1つ追加する。→ ユーザー承認済み（2026-08-07）
- [x] **初期値（野菜・肉…、冷蔵庫・冷凍庫…）の扱い**: 特別扱いせず、ユーザーが追加した項目と同じ
      CRUD 対象（編集・削除とも可能）として扱う。→ ユーザー承認済み（2026-08-07）
- [x] **アーキテクチャ方針**: Bulletproof React の feature 境界原則に忠実に従い、`master` feature を
      新設し、`Category` / `StorageLocation` 型と読み取り専用API を `src/shared/` に切り出す。
      → ユーザー承認済み（2026-08-07）。「1. 概要」「5. コンポーネント設計」に反映済み
