# 詳細設計書：在庫登録モーダルからのカテゴリ・保管場所の新規登録

| 項目       | 内容                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| 対象要件   | 要件定義書「5-1. 在庫登録機能」「5-2. カテゴリマスター管理機能」「5-3. 保管場所マスター管理機能」 |
| タスクID   | なし（`docs/tasks.md` 未記載の追加要望）                              |
| 作成日     | 2026-08-20                                                              |
| ステータス | 実装済み（2026-08-20）                                                  |

> このテンプレートの全セクションを埋めること。該当なしの場合も「なし」と明記し、セクションごと削除しない。
> `design-impl-reviewer` はこの構造を前提に実装と突合する。

---

## 1. 概要

在庫の新規登録モーダル（`InventoryForm`）で、カテゴリ・保管場所の選択したい項目がまだマスタに
存在しない場合、現状は一度入力を破棄してマスタ管理画面（`/master/categories` /
`/master/storage-locations`）で先に登録し直す必要がある。

要件定義書「5-1. 在庫登録機能」は「カテゴリ・保管場所はそれぞれのマスタから選択する」としており、
「5-2」「5-3」はユーザーが独自にマスタを追加できることを求めている。本設計は、両者を**在庫登録の
1画面で完結させる**ことで、利用シーン「買い物後：買ってきたものを登録したい」の入力を止めない。

カテゴリ・保管場所の `<select>` に「＋ 新規登録」の選択肢を追加する。選択すると名称の入力欄が
現れ、在庫の登録が成立したタイミングで、その名称をカテゴリ／保管場所マスタへ先に登録してから
（`POST /api/categories` または `/api/storages`。既存のマスタ管理機能と同じ BFF エンドポイントを
再利用する）、解決した名称で在庫を登録する。

ユーザー確認により、**本機能は在庫の新規登録モーダルのみに適用し、編集モーダルには適用しない**
（2026-08-20 ユーザー回答）。

## 2. スコープ

### やること

- `InventoryForm` のカテゴリ・保管場所 `<select>` に「＋ 新規登録」の選択肢を追加する
  （**登録モード [`mode='create'`] のときのみ**。詳細は「6. 状態管理・データフロー」）
- 「＋ 新規登録」を選んだときに名称入力欄を表示し、送信時にバリデーションする
  （必須・20文字以内・既存名との重複禁止。マスタ管理画面と同じルールを共有する）
- 在庫登録の送信時、新規登録が選ばれたフィールドについてカテゴリ／保管場所マスタへ先に
  `createMasterItem` で登録し、その結果の名称を使って在庫を登録する
- 新規登録したカテゴリ・保管場所を `InventoryListsView` のローカル状態に反映し、
  同一ページ内の他の選択肢（フィルタ・保管場所タブ・次に開くモーダルの選択肢）にも
  リロードなしで反映されるようにする
- カテゴリ・保管場所どちらか一方だけ「＋ 新規登録」を選ぶ／両方選ぶのいずれにも対応する
- `master` feature 専用だった `validateMasterItemForm` / `createMasterItem`（`resourcePath` 含む）を
  `inventory` feature からも参照できるよう `src/shared/` へ移動する
  （feature 間の直接 import 禁止のため。既存ロジックの変更はしない）

### やらないこと

- 在庫の**編集**モーダル（`mode='edit'`）への適用（ユーザー確認済み。「1. 概要」参照）。
  `InventoryForm` 自体は登録・編集で共通のコンポーネントのままとし、
  新規登録の選択肢を出すかどうかは呼び出し元が渡すコールバックの有無で制御する
  （「5. コンポーネント設計」参照）。将来編集にも広げる場合は別タスクとする
- カテゴリ・保管場所以外の新規マスタ種別への拡張（対象は既存の2種別のみ）
- マスタ項目の名称変更・削除をこの画面から行うこと（追加のみ。編集・削除は引き続き
  マスタ管理画面の責務）
- 在庫登録が失敗した後、既に作成済みのカテゴリ・保管場所マスタを取り消す（ロールバックする）こと。
  マスタとしては有効な項目のため取り消す理由がなく、次回の選択肢として使えることの方が有用
  （詳細は「6. 状態管理・データフロー」の再送信時の挙動）
- 認証・認可（フェーズ1は対象外。要件定義書「7. 非機能要件」）

---

## 3. 画面・UI 仕様

対象画面: 要件定義書「8. 画面要件」No.1（在庫一覧画面 `/inventory/lists`）内の登録モーダル
（`docs/design/inventory-registration.md` で定義済み）。画面遷移・ルートの追加はない。

### 画面構成

在庫登録モーダルのカテゴリ・保管場所欄のみ変更する（他の入力欄・モーダル自体の構成は
`inventory-registration.md` のまま）。

| 要素                       | 役割                                                              |
| -------------------------- | ------------------------------------------------------------------- |
| カテゴリ `<select>`        | 既存のマスタ一覧 + 末尾に「＋ 新規登録」を追加                     |
| 新しいカテゴリ名 `<input>` | カテゴリで「＋ 新規登録」を選んだときのみ表示される名称入力欄      |
| 保管場所 `<select>`        | 既存のマスタ一覧 + 末尾に「＋ 新規登録」を追加                     |
| 新しい保管場所名 `<input>` | 保管場所で「＋ 新規登録」を選んだときのみ表示される名称入力欄      |

### 見出し階層

変更なし（`inventory-registration.md` のまま。新規に見出しを追加しない）。

### 状態

| 状態                             | 表示内容                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| カテゴリ／保管場所が未選択         | 既存どおり（変更なし）                                                                          |
| 「＋ 新規登録」を選択               | 直下に「新しいカテゴリ名」／「新しい保管場所名」の入力欄が現れる。空欄から始まる                  |
| 「＋ 新規登録」から他の選択肢に戻す | 名称入力欄が非表示になり、入力していた値もクリアされる（次に選び直したとき空欄から始まる）        |
| 新しい名称が未入力のまま送信       | 「カテゴリ名を入力してください」／「保管場所名を入力してください」を名称入力欄の下に表示           |
| 新しい名称が20文字超               | 「カテゴリ名は20文字以内で入力してください」等を表示                                             |
| 新しい名称が既存マスタと重複       | 「同じ名前のカテゴリが既に登録されています」等を表示                                             |
| マスタ登録（`POST`）が通信失敗     | 返ってきたエラーメッセージを名称入力欄の下に表示し、送信中表示を解除する（在庫登録は実行しない）  |
| 送信中                             | 既存どおり「登録中…」（マスタ登録・在庫登録をまとめて1回の送信中表示にする。個別の進捗表示はしない） |

### 操作と遷移

| ユーザー操作                                             | 起きること                                                                           | 遷移先 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------ |
| カテゴリで「＋ 新規登録」を選ぶ                            | 「新しいカテゴリ名」入力欄が現れる                                                       | なし   |
| 名称を入力し「登録する」を押す（入力正常）                 | カテゴリ（必要なら保管場所も）をマスタへ登録 → 在庫を登録 → モーダルを閉じ完了メッセージ | なし   |
| 名称が不正なまま「登録する」を押す                         | 名称入力欄にエラー表示。モーダルは開いたまま。在庫登録は実行しない                       | なし   |
| マスタ登録が失敗                                            | エラー表示。モーダルは開いたまま。在庫登録は実行しない                                   | なし   |
| 「＋ 新規登録」から通常の選択肢に選び直す                   | 名称入力欄が消え、通常の在庫登録フローに戻る                                             | なし   |

画面遷移は発生しない（`inventory-registration.md` の既存方針を踏襲）。

### アクセシビリティ（ARIA・キーボード操作）

なし（複合ウィジェットパターンの新規追加はない。名称入力欄は既存の他フィールドと同じ
`aria-invalid` / `aria-describedby` パターンを使う）。

---

## 4. データ・型定義

```ts
// src/features/inventory/types/index.ts（既存の InventoryFormValues に追加）

/** 登録フォームの入力値。入力欄の生の値なのですべて文字列で持つ */
export type InventoryFormValues = {
  name: string;
  category: string;
  /** カテゴリで「＋ 新規登録」を選んだときに入力する新しいカテゴリ名。それ以外は空文字 */
  newCategoryName: string;
  storage: string;
  /** 保管場所で「＋ 新規登録」を選んだときに入力する新しい保管場所名。それ以外は空文字 */
  newStorageName: string;
  quantity: string;
  expirationDate: string;
  purchaseDate: string;
  memo: string;
};
```

- 使用箇所: `InventoryForm` の `useState<InventoryFormValues>`、`toInventoryFormValues` の戻り値、
  `validateInventoryForm` の引数
- `newCategoryName` / `newStorageName` は `InventoryFormErrors`（`Partial<Record<keyof InventoryFormValues, string>>`）
  の型に自動的に含まれるため、型定義自体の追加は不要
- `InventoryDraft`（`Omit<Inventory, 'id'>`）・`Inventory` 自体は変更しない。
  `newCategoryName` / `newStorageName` は在庫データの一部ではなく、フォーム内で
  カテゴリ・保管場所マスタへの登録要否を判断するための一時的な入力値のため

```ts
// src/features/inventory/utils/validateInventoryForm.ts（既存ファイルに追加）

/** カテゴリ・保管場所の `<select>` で「＋ 新規登録」を表す値 */
export const NEW_MASTER_ITEM_VALUE = '__new__';
```

- 使用箇所: `InventoryForm`（`<option value={NEW_MASTER_ITEM_VALUE}>` の描画・選択中判定）、
  `validateInventoryForm`（新規登録が選ばれているかどうかの判定）

既存の `Category` / `StorageLocation`（`src/shared/types/index.ts`）は変更しない。
`createMasterItem` の戻り値の型として引き続き使う。

---

## 5. コンポーネント設計

### 既存コードの再利用

| 再利用するもの                                    | 用途                                                                 |
| ---------------------------------------------------- | ----------------------------------------------------------------------- |
| `createMasterItem`（`shared/api/` へ移動後のもの）  | 新しいカテゴリ・保管場所の登録（`POST /api/categories` / `/api/storages`） |
| `validateMasterItemForm`（`shared/utils/` へ移動後） | 新しい名称の必須・文字数・重複チェック（マスタ管理画面と同一ルール）     |
| `InventoryForm.module.scss` の `.field` / `.error`  | 新しい名称入力欄のスタイル（新規クラスを追加しない）                    |

### 新規／変更するファイル

#### `shared` への移動（feature 間の直接 import を避けるため）

| ファイルパス                                       | 新規/変更                                                | 責務                                                        |
| ----------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| `src/shared/api/createMasterItem.ts`                  | 新規（`features/master/api/createMasterItem.ts` から移動） | マスタ項目の追加（`inventory`・`master` 両 feature から使う） |
| `src/shared/api/createMasterItem.test.ts`             | 新規（同上、移動）                                          | 上記のテスト                                                    |
| `src/shared/api/resourcePath.ts`                      | 新規（`features/master/api/resourcePath.ts` から移動）      | `MasterResource` → BFF パスの対応表                             |
| `src/shared/utils/validateMasterItemForm.ts`          | 新規（`features/master/utils/validateMasterItemForm.ts` から移動） | マスタ項目名称の必須・文字数・重複チェック                     |
| `src/shared/utils/validateMasterItemForm.test.ts`     | 新規（同上、移動）                                          | 上記のテスト                                                    |
| `src/features/master/api/createMasterItem.ts`         | 削除                                                        | `src/shared/api/createMasterItem.ts` へ移動                     |
| `src/features/master/api/createMasterItem.test.ts`    | 削除                                                        | 同上                                                             |
| `src/features/master/api/resourcePath.ts`             | 削除                                                        | `src/shared/api/resourcePath.ts` へ移動                         |
| `src/features/master/utils/validateMasterItemForm.ts` | 削除                                                        | `src/shared/utils/validateMasterItemForm.ts` へ移動              |
| `src/features/master/utils/validateMasterItemForm.test.ts` | 削除                                                   | 同上                                                             |
| `src/features/master/api/updateMasterItem.ts`         | 変更                                                        | `RESOURCE_PATHS` の import 元を `@/shared/api/resourcePath` に変更（ロジック変更なし） |
| `src/features/master/api/deleteMasterItem.ts`         | 変更                                                        | 同上                                                             |
| `src/features/master/components/MasterItemListView/MasterItemListView.tsx` | 変更                                    | `createMasterItem` の import 元を `@/shared/api/createMasterItem` に変更（ロジック変更なし） |
| `src/features/master/components/MasterItemForm/MasterItemForm.tsx`         | 変更                                    | `validateMasterItemForm` の import 元を `@/shared/utils/validateMasterItemForm` に変更（ロジック変更なし） |
| `src/features/master/components/MasterItemListView/MasterItemListView.test.tsx` | 変更 | `createMasterItem` の `vi.mock` パスを `@/shared/api/createMasterItem` に変更（テストケース自体は変更しない。回帰確認） |

#### `inventory`（変更）

| ファイルパス                                                                       | 新規/変更 | 責務                                                                                     |
| -------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------- |
| `src/features/inventory/types/index.ts`                                               | 変更      | `InventoryFormValues` に `newCategoryName` / `newStorageName` を追加                        |
| `src/features/inventory/utils/validateInventoryForm.ts`                               | 変更      | `NEW_MASTER_ITEM_VALUE` を追加。引数に `existingCategoryNames` / `existingStorageNames` を追加し、新規名称のバリデーションを追加 |
| `src/features/inventory/utils/validateInventoryForm.test.ts`                          | 変更      | 新規登録時のバリデーションのテストケースを追加                                              |
| `src/features/inventory/utils/toInventoryFormValues.ts`                               | 変更      | 戻り値に `newCategoryName: ''` / `newStorageName: ''` を追加（編集時は常に空欄で始まる）    |
| `src/features/inventory/utils/toInventoryFormValues.test.ts`                          | 変更      | 上記フィールドを含む期待値に更新                                                            |
| `src/features/inventory/utils/toInventoryDraft.ts`                                    | 変更なし  | 既存どおり必要なキーだけを取り出すため、`newCategoryName` / `newStorageName` を無視して動作する（追加の変更不要） |
| `src/features/inventory/components/InventoryForm/InventoryForm.tsx`                   | 変更      | 「＋ 新規登録」選択肢・名称入力欄の描画、送信時のマスタ登録〜在庫登録の一連の処理を追加      |
| `src/features/inventory/components/InventoryForm/InventoryForm.test.tsx`              | 変更      | 新規登録フローのテストを追加                                                                |
| `src/features/inventory/components/InventoryFormModal/InventoryFormModal.tsx`         | 変更      | `onCreateCategory` / `onCreateStorageLocation` を Props に追加し、`InventoryForm` へそのまま渡す |
| `src/features/inventory/components/InventoryFormModal/InventoryFormModal.test.tsx`    | 変更      | 上記 Props が転送されることのテストを追加                                                   |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.tsx`         | 変更      | `categories` / `storageLocations` を `initialCategories` / `initialStorageLocations` に改名し `useState` へ昇格。マスタ登録ハンドラを追加し、登録モードのときだけ `InventoryFormModal` に渡す |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.test.tsx`    | 変更      | 新規登録の反映・編集モードで選択肢が出ないことのテストを追加                                |
| `src/app/inventory/lists/page.tsx`                                                     | 変更      | `InventoryListsView` へ渡す Props 名を `initialCategories` / `initialStorageLocations` に更新 |

> ここに列挙されていないファイルを実装時に勝手に増やさない。必要になったら本設計書を先に更新する。
> `InventoryForm.module.scss` は変更しない（既存の `.field` / `.error` を再利用する）。

`InventoryForm.tsx` 内で、カテゴリ・保管場所は「`<select>` + 条件付きの名称 `<input>`」という
ほぼ同一の描画パターンを2回使うため、実装時はコンポーネント本体の中に非公開（バレル export しない）
の描画ヘルパーを1つ切り出してよい。新しいディレクトリ・ファイルは増やさない
（`fieldProps` / `renderError` と同様、同一ファイル内の実装詳細として扱う）。

### 階層図

```
InventoryListsView（'use client'）
├── InventoryFilterBar / InventoryStorageTabs   … categories/storageLocations は同じ state を参照
├── InventoryTable
└── InventoryFormModal
    └── InventoryForm
        ├── カテゴリ <select> + 「新しいカテゴリ名」<input>（新規登録時のみ）
        └── 保管場所 <select> + 「新しい保管場所名」<input>（新規登録時のみ）
```

### Props

```ts
// InventoryForm（変更差分。他の Props は既存のまま）
type Props = {
  categories?: Category[];
  storageLocations?: StorageLocation[];
  mode?: InventoryFormMode;
  initialValues?: InventoryFormValues;
  onSubmit: (draft: InventoryDraft) => void | Promise<void>;
  onCancel: () => void;
  today?: Date;
  /**
   * カテゴリで「＋ 新規登録」を選んだときに呼ぶ。カテゴリ名を渡し、作成された Category を返す。
   * 省略時は「＋ 新規登録」の選択肢自体を表示しない（編集モードでの利用を想定）。
   */
  onCreateCategory?: (name: string) => Promise<Category>;
  /** 保管場所版。役割は onCreateCategory と同じ */
  onCreateStorageLocation?: (name: string) => Promise<StorageLocation>;
};
```

```ts
// InventoryFormModal（変更差分。他の Props は既存のまま）
type Props = {
  open: boolean;
  onClose: () => void;
  categories?: Category[];
  storageLocations?: StorageLocation[];
  mode?: InventoryFormMode;
  initialValues?: InventoryFormValues;
  onSubmit: (draft: InventoryDraft) => void | Promise<void>;
  /** InventoryForm へそのまま転送する */
  onCreateCategory?: (name: string) => Promise<Category>;
  /** InventoryForm へそのまま転送する */
  onCreateStorageLocation?: (name: string) => Promise<StorageLocation>;
};
```

```ts
// InventoryListsView（変更差分）
type Props = {
  initialInventories?: Inventory[];
  /** 選択肢に出すカテゴリマスタの初期値（Server Component から受け取る） */
  initialCategories?: Category[];
  /** 選択肢に出す保管場所マスタの初期値（Server Component から受け取る） */
  initialStorageLocations?: StorageLocation[];
  today?: Date;
  warningThresholdDays?: number;
};
```

`InventoryTable` / `InventoryFilterBar` / `InventoryStorageTabs` の Props は変更しない
（`categories` / `storageLocations` を state 経由で受け取るようになるだけで、渡し方は既存のまま）。

---

## 6. 状態管理・データフロー

### Server / Client Components の分担

変更なし。`page.tsx`（Server）が初期データを取得し `InventoryListsView`（Client）へ渡す構成を維持する。

### クライアント状態

`InventoryListsView` で、`categories` / `storageLocations` を props からそのまま使う既存の方式を
やめ、**`useState` へ昇格する**（新規）。

| state                | 型                  | 用途                                                             |
| ----------------------- | --------------------- | -------------------------------------------------------------------- |
| `categories`          | `Category[]`         | 初期値は `initialCategories`。新規登録の成功時に追加される         |
| `storageLocations`    | `StorageLocation[]`  | 初期値は `initialStorageLocations`。新規登録の成功時に追加される   |

昇格する理由: 在庫登録モーダルで新規登録したカテゴリ・保管場所を、同じページ内の
`InventoryFilterBar`（カテゴリ絞り込み）・`InventoryStorageTabs`（保管場所タブ）・
次に開く登録／編集モーダルの選択肢に、リロードなしで反映するため。

### 新規登録モードの制御

「＋ 新規登録」の選択肢は `InventoryForm` が `onCreateCategory` / `onCreateStorageLocation` の
**Props が渡されているかどうか**だけで表示・非表示を判断する（`mode` を直接見ない）。
`InventoryListsView` 側で次のように渡し分けることで、「登録モードのみ」という要件を満たす。

```ts
<InventoryFormModal
  // ...
  mode={editingTarget ? 'edit' : 'create'}
  onCreateCategory={editingTarget ? undefined : handleCreateCategory}
  onCreateStorageLocation={editingTarget ? undefined : handleCreateStorageLocation}
/>
```

`InventoryFormModal` はこの2つの Props を条件を付けずに `InventoryForm` へそのまま転送する
（判断ロジックを持たない）。

### 新規登録のマスタ追加ハンドラ（`InventoryListsView`）

```ts
const createCategoryMutation = useMutation({
  mutationFn: (name: string) => createMasterItem('category', { name }),
});
const createStorageLocationMutation = useMutation({
  mutationFn: (name: string) => createMasterItem('storage', { name }),
});

const handleCreateCategory = async (name: string): Promise<Category> => {
  const created = await createCategoryMutation.mutateAsync(name);
  setCategories((previous) => [...previous, created]);
  return created;
};
// handleCreateStorageLocation も同様（setStorageLocations を更新）
```

失敗時（`mutateAsync` が reject）は `setCategories` を呼ばずにそのまま例外を伝播させる
（`InventoryForm` 側で捕捉してエラー表示する。次項参照）。

### `InventoryForm` の送信フロー

```
検証（validateInventoryForm。既存名一覧は categories/storageLocations props から作る）
  → エラーがあれば表示して中断（既存どおり）
  → カテゴリが NEW_MASTER_ITEM_VALUE なら onCreateCategory(newCategoryName) を呼ぶ
      → 成功: 戻り値の名称を「実際に使うカテゴリ名」として保持し、
              フォームの category を選択済みの通常の値に戻す（setValues）
      → 失敗: newCategoryName のエラーとして表示し、ここで中断（在庫登録は行わない）
  → 保管場所も同様に処理する
  → 解決した名称で toInventoryDraft を組み立て、onSubmit(draft) を呼ぶ（以降は既存どおり）
```

**再送信時の冪等性**: カテゴリの作成に成功した直後に `category` を通常の選択値へ戻すため、
（例えば保管場所側の作成やその後の在庫登録が失敗して）利用者が同じフォームのまま
「登録する」を再度押しても、**成功済みのカテゴリを再作成しようとしない**
（`category` は既に `NEW_MASTER_ITEM_VALUE` ではないため）。これにより、通信失敗時の
再送信で重複したカテゴリ・保管場所が作られることを避ける。

### レンダリング戦略

変更なし。

### データの流れ

```
InventoryForm（送信）
  → [新規登録が選ばれたフィールドのみ] onCreateCategory / onCreateStorageLocation
      → InventoryListsView.handleCreateCategory / handleCreateStorageLocation
      → createMasterItem('category' | 'storage', { name })（BFF 経由）
      → 成功時: InventoryListsView の categories / storageLocations state に追加
  → 解決済みの名称で onSubmit(draft)
      → InventoryListsView.handleSubmit（既存どおり createInventory を呼ぶ）
      → 成功時: inventories state に追加、モーダルを閉じる、完了メッセージ表示
```

---

## 7. API 仕様

新規エンドポイントはない。既存の `POST /api/categories` ・ `POST /api/storages`
（`docs/design/backend-api-integration.md` で定義済み、実装済み）をそのまま再利用する。

| メソッド | パス              | 用途                             | 呼び出し元（新規）                          |
| -------- | ------------------- | ---------------------------------- | ---------------------------------------------- |
| POST     | `/api/categories`    | カテゴリ追加（既存）              | `InventoryListsView.handleCreateCategory`      |
| POST     | `/api/storages`      | 保管場所追加（既存）              | `InventoryListsView.handleCreateStorageLocation` |

### リクエスト / レスポンス

変更なし（`backend-api-integration.md` 「7.5」の `createMasterItem` と同一）。

### 現段階のモック実装

なし。T-08（`backend-api-integration.md`）で Go バックエンドへの接続が完了済みのため、
本タスクもモックを新設せず実 API（BFF 経由）をそのまま呼ぶ。

---

## 8. バリデーション・エラーハンドリング

| 対象                                  | ルール                                                             | エラーメッセージ（日本語）                       |
| ---------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------- |
| 新しいカテゴリ名（`newCategoryName`）    | カテゴリで「＋ 新規登録」を選んだときのみ検証。必須                    | `カテゴリ名を入力してください`                       |
| 新しいカテゴリ名                         | 20文字以内                                                            | `カテゴリ名は20文字以内で入力してください`           |
| 新しいカテゴリ名                         | 既存カテゴリ名（`categories` props）と完全一致（trim後）する名前は禁止 | `同じ名前のカテゴリが既に登録されています`           |
| 新しい保管場所名（`newStorageName`）     | 保管場所で「＋ 新規登録」を選んだときのみ検証。必須                    | `保管場所名を入力してください`                       |
| 新しい保管場所名                         | 20文字以内                                                            | `保管場所名は20文字以内で入力してください`           |
| 新しい保管場所名                         | 既存保管場所名と完全一致（trim後）する名前は禁止                       | `同じ名前の保管場所が既に登録されています`           |
| カテゴリ作成（`POST /api/categories`）の通信失敗 | `onCreateCategory` が reject したら在庫登録を実行しない              | （`Error.message` をそのまま `newCategoryName` の下に表示） |
| 保管場所作成（`POST /api/storages`）の通信失敗   | 同上                                                                  | 同上                                                  |

- 上記の必須・文字数・重複チェックは `validateMasterItemForm`（`shared/utils/`）をそのまま流用する
  （マスタ管理画面と同一のルール・メッセージ形式にするため、新しいロジックを作らない）
- 重複チェックの対象は `InventoryForm` に渡された `categories` / `storageLocations` props
  （＝ `InventoryListsView` の最新の state）。編集時のような「自分自身を除外する」処理は不要
  （新規登録は常に新しい項目を作る操作のため）
- カテゴリ・保管場所いずれも、名称入力欄のエラー表示は既存の「フィールドごとの下に赤字」パターンを
  踏襲する（`InventoryForm` の `renderError` をそのまま使う）
- 在庫登録自体（`createInventory`）の通信失敗は、既存どおり `InventoryListsView` の
  `errorMessage`（`role="alert"`）で表示する（変更なし）

---

## 9. テスト観点

> このセクションが `unit-test-writer` の入力になる。抽象的に書かず、
> 「入力 → 期待される結果」が読み取れる粒度で書くこと。

### 移動したファイルの回帰確認

- [ ] `src/shared/utils/validateMasterItemForm.ts` … 移動前の `master/utils/validateMasterItemForm.test.ts`
      の全ケースがそのまま緑になる（ロジック変更なし）
- [ ] `src/shared/api/createMasterItem.ts` … 移動前の `master/api/createMasterItem.test.ts`
      の全ケースがそのまま緑になる
- [ ] `MasterItemForm` ・ `MasterItemListView` の既存テストが、import 元変更後も全て緑のまま

### `validateInventoryForm(values, existingCategoryNames, existingStorageNames)`

#### 正常系

- [ ] `category` が通常の選択値（例: `'野菜'`）のとき、`newCategoryName` が空文字でもエラーにならない
- [ ] `category` が `NEW_MASTER_ITEM_VALUE`、`newCategoryName` が有効な名称（既存と重複しない）のとき、
      `category` ・ `newCategoryName` のいずれもエラーにならない
- [ ] `storage` も同様（`NEW_MASTER_ITEM_VALUE` ＋ 有効な `newStorageName` でエラーなし）
- [ ] `category` ・ `storage` の両方が `NEW_MASTER_ITEM_VALUE` で、それぞれ有効な名称のとき、
      両方ともエラーにならない

#### 異常系

- [ ] `category` が `NEW_MASTER_ITEM_VALUE`、`newCategoryName` が空文字 →
      `{ newCategoryName: 'カテゴリ名を入力してください' }`
- [ ] `category` が `NEW_MASTER_ITEM_VALUE`、`newCategoryName` が `existingCategoryNames` に含まれる →
      `{ newCategoryName: '同じ名前のカテゴリが既に登録されています' }`
- [ ] `storage` が `NEW_MASTER_ITEM_VALUE`、`newStorageName` が空文字 →
      `{ newStorageName: '保管場所名を入力してください' }`
- [ ] `storage` が `NEW_MASTER_ITEM_VALUE`、`newStorageName` が既存と重複 →
      `{ newStorageName: '同じ名前の保管場所が既に登録されています' }`

#### 境界値

- [ ] `newCategoryName` が20文字 → エラーなし / 21文字 → `カテゴリ名は20文字以内で入力してください`
- [ ] `category` が `NEW_MASTER_ITEM_VALUE` ではない通常の値のとき、`newCategoryName` に
      21文字の文字列が入っていてもエラーにならない（新規登録が選ばれていないフィールドは検証しない）
- [ ] `existingCategoryNames` / `existingStorageNames` を省略したとき（既定値 `[]`）、
      新規登録時の重複チェックは常に通る

### `InventoryForm`

#### 正常系

- [ ] `onCreateCategory` を渡すと、カテゴリの `<select>` に「＋ 新規登録」の `<option>` が表示される
- [ ] `onCreateCategory` を渡さないと、「＋ 新規登録」の `<option>` が表示されない
- [ ] カテゴリで「＋ 新規登録」を選ぶと「新しいカテゴリ名」の入力欄が表示される
- [ ] 「新しいカテゴリ名」に入力して他の必須項目も入力し送信すると、
      `onCreateCategory` が入力した名称（trim 済み）で呼ばれる
- [ ] `onCreateCategory` が `{ id: '...', name: '発酵食品' }` を返したとき、
      `onSubmit` が `category: '発酵食品'` を含む draft で呼ばれる（`newCategoryName` は draft に含まれない）
- [ ] 保管場所も同様（`onCreateStorageLocation` の呼び出し・`onSubmit` の `storage` への反映）
- [ ] カテゴリ・保管場所の両方で「＋ 新規登録」を選んで送信すると、両方のコールバックが呼ばれ、
      `onSubmit` の draft に両方の解決済み名称が入る
- [ ] 「＋ 新規登録」から通常の選択肢に選び直すと「新しいカテゴリ名」入力欄が非表示になる

#### 異常系

- [ ] カテゴリで「＋ 新規登録」を選び、名称を空のまま送信すると「カテゴリ名を入力してください」が
      表示され、`onCreateCategory` ・ `onSubmit` のどちらも呼ばれない
- [ ] 名称が既存カテゴリと重複した状態で送信すると「同じ名前のカテゴリが既に登録されています」が
      表示され、`onCreateCategory` は呼ばれない
- [ ] `onCreateCategory` が reject（Error）すると、そのメッセージが「新しいカテゴリ名」欄の下に
      表示され、`onSubmit` は呼ばれない
- [ ] カテゴリの新規登録（`onCreateCategory`）が成功し、保管場所の新規登録（`onCreateStorageLocation`）が
      失敗したとき、`onSubmit` は呼ばれない（在庫登録は実行されない）

#### 境界値

- [ ] `onCreateCategory` ・ `onCreateStorageLocation` をどちらも渡さないとき、
      既存の（新規登録機能追加前の）挙動から変化がない（回帰確認）

### `InventoryFormModal`

#### 正常系

- [ ] `onCreateCategory` / `onCreateStorageLocation` を渡すと、`InventoryForm` に
      そのまま渡り「＋ 新規登録」の選択肢が表示される
- [ ] 渡さないとき、`InventoryForm` 側に「＋ 新規登録」の選択肢が表示されない（回帰確認）

### `InventoryListsView`

#### 正常系

- [ ] 「在庫を登録」から開いたモーダル（登録モード）で、カテゴリ・保管場所に
      「＋ 新規登録」の選択肢が表示される
- [ ] カテゴリを新規登録して在庫を登録すると、一覧に新しい在庫が反映され、
      その後に開いた別の登録モーダルのカテゴリ選択肢に、新規登録したカテゴリ名が追加されている
- [ ] 保管場所を新規登録して在庫を登録すると、`InventoryStorageTabs` に新しい保管場所のタブが
      リロードなしで追加される

#### 異常系

- [ ] カテゴリの新規登録（`createMasterItem` 相当）が失敗すると、在庫は一覧に追加されず、
      エラーメッセージが表示される

#### 境界値

- [ ] 一覧の行の「編集」から開いたモーダル（編集モード）で、カテゴリ・保管場所に
      「＋ 新規登録」の選択肢が表示されない

---

## 10. 未決事項・確認事項

以下はユーザー確認済み。

| 論点                                                       | 決定                                                                 |
| ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| 新規登録の選択肢を編集モーダルにも出すか                     | 出さない。在庫の新規登録モーダルのみに適用する（2026-08-20 ユーザー回答） |

上記以外の未決事項はなし。
