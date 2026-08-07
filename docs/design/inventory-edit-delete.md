# 詳細設計書：在庫編集・削除機能

| 項目       | 内容                                      |
| ---------- | ----------------------------------------- |
| 対象要件   | 要件定義書「5-5. 在庫編集・削除機能」、画面要件 No.3 食品編集画面 |
| タスクID   | なし（`docs/tasks.md` 未作成）             |
| 作成日     | 2026-08-07                                |
| ステータス | 実装済み（2026-08-07）                    |

---

## 1. 概要

要件定義書 5-5 は次を求めている。

- 数量の増減を編集できる
- 保管場所を変更できる（例：冷蔵庫→冷凍庫へ移動）
- 使い切った・廃棄した食品を削除できる

画面要件 No.3「食品編集画面」の概要は「数量・保管場所・期限などを編集」であり、5-5 の3項目に加え期限の編集も対象に含む。
本設計では、既存の在庫登録フォーム（`InventoryForm` / `InventoryFormModal`）を編集モードでも再利用し、
食品名・カテゴリ・保管場所・数量・期限・購入日・メモの全項目を編集可能にする（詳細は「10. 未決事項」参照）。
削除は在庫一覧の行から直接行い、誤操作による消失を避けるため行内で確認を挟む。

## 2. スコープ

### やること

- 在庫一覧（`InventoryTable`）の各行に「編集」「削除」操作を追加する
- 「編集」を押すと、登録時と同じモーダル（`InventoryFormModal`）を編集モードで開き、対象在庫の値を初期表示する
- 編集フォームを送信すると、対象の在庫を更新し、一覧に即時反映する（保管場所を変えた場合はグループ移動、期限を変えた場合は残り日数・警告表示も再計算される）
- 「削除」を押すと行内で確認を表示し、確定すると一覧から即時に取り除く
- 更新・削除の結果を登録時と同様のフラッシュメッセージで通知する

### やらないこと

- Go バックエンドとの実通信（PATCH / DELETE の実 API 呼び出し）。今回もモックで完結し、リロードで内容は失われる
- 数量のみを一覧上で直接 +/- するインラインステッパー（画面要件で編集は専用画面／モーダルと定義されているため）
- 個別（食品ごと）の通知設定、削除の取り消し（Undo）機能
- カテゴリ・保管場所マスタ自体の追加・編集・削除（別機能 5-2 / 5-3 で対応）

---

## 3. 画面・UI 仕様

対象画面：画面要件 No.3 食品編集画面（実装形態は既存の食品登録画面と同じくモーダル。ルートは増やさず `/inventory/lists` 内で完結する）

### 画面構成

- `/inventory/lists`（既存画面）の在庫一覧テーブルに「操作」列を追加し、行ごとに「編集」「削除」ボタンを置く
- 「編集」ボタン → 既存の登録モーダルを編集モードで開く（タイトル「在庫を編集」、初期値に対象在庫の値、送信ボタン「更新する」）
- 「削除」ボタン → 押した行内に確認表示（「削除しますか？」「削除する」「キャンセル」）を出す。新しいモーダルやページ遷移は発生しない

### 見出し階層

既存の見出し構成（`InventoryTable` の `h1` 在庫一覧 / `h2` 保管場所ごと）から変更なし。編集モーダルのタイトルは既存の登録モーダルと同じく `h2`（ダイアログ自身の見出しであり、ページの見出し階層には含めない）。

| 見出しテキスト | レベル | 備考                                     |
| -------------- | ------ | ---------------------------------------- |
| 在庫一覧       | `<h1>` | 既存。変更なし                           |
| （保管場所名） | `<h2>` | 既存。変更なし                           |
| 在庫を編集     | `<h2>` | 編集モーダルのタイトル（登録時は「在庫を登録」のまま） |

### 状態

| 状態                     | 表示内容                                                                 |
| ------------------------ | -------------------------------------------------------------------------- |
| 編集モーダル・初期表示   | 対象在庫の現在値がすべての入力欄に反映された状態でフォームを表示           |
| 編集送信中               | 送信ボタンが「更新中…」表示になり、キャンセル・送信ボタンとも無効化        |
| 編集バリデーションエラー | 登録フォームと同じ規則でフィールドごとにエラーメッセージを表示し、最初のエラー欄にフォーカス |
| 編集成功                 | モーダルを閉じ、一覧上部に「〇〇を更新しました」を表示                     |
| 削除・確認前             | 「削除」ボタンのみ表示                                                     |
| 削除・確認中             | 「削除しますか？」＋「削除する」「キャンセル」を同じ行内に表示             |
| 削除成功                 | 対象行が一覧から消え、一覧上部に「〇〇を削除しました」を表示。保管場所グループの最後の1件を削除した場合はそのグループ自体が非表示になる |
| 削除後0件                | 一覧が「登録されている在庫はありません。」表示に戻る                       |

### 操作と遷移

- 一覧の行で「編集」を押す → 編集モードのモーダルが開く（画面遷移なし）
- 編集モーダルで「更新する」を押す → バリデーション OK なら一覧を更新してモーダルを閉じる／NG ならエラー表示のままモーダルにとどまる
- 編集モーダルで「キャンセル」・背景クリック・Esc → 何も更新せずモーダルを閉じる（既存の登録モーダルと同じ挙動）
- 一覧の行で「削除」を押す → 同じ行内に確認表示が出る
- 確認表示で「削除する」を押す → 在庫を一覧から取り除き、確認表示も消える
- 確認表示で「キャンセル」を押す → 何も削除せず確認表示を閉じる

---

## 4. データ・型定義

新規のドメイン型は不要。既存の `Inventory` / `InventoryDraft` / `InventoryFormValues` をそのまま使う。
フォームを登録・編集の両モードで共有するため、モード識別用の型のみ追加する。

```ts
// src/features/inventory/types/index.ts に追加

/** 在庫フォームの動作モード。ラベル・初期値の出し分けに使う */
export type InventoryFormMode = 'create' | 'edit';
```

- 要件定義書「6. データ要件」との対応：新規項目はなし。既存の食品ID・食品名・カテゴリ・保管場所・数量・期限・購入日・メモをすべて編集対象とする

---

## 5. コンポーネント設計

### 新規／変更するファイル

| ファイルパス                                                              | 新規/変更 | 責務                                                                 |
| -------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------- |
| `src/features/inventory/types/index.ts`                                    | 変更      | `InventoryFormMode` 型を追加                                          |
| `src/features/inventory/utils/toInventoryFormValues.ts`                    | 新規      | `Inventory` → `InventoryFormValues` の変換（`toInventoryDraft` の逆）  |
| `src/features/inventory/utils/toInventoryFormValues.test.ts`               | 新規      | 上記のテスト                                                          |
| `src/features/inventory/api/updateInventory.ts`                            | 新規      | 在庫の更新（モック）。将来の `PATCH /api/inventories/:id` の差し替え点 |
| `src/features/inventory/api/updateInventory.test.ts`                       | 新規      | 上記のテスト                                                          |
| `src/features/inventory/api/deleteInventory.ts`                            | 新規      | 在庫の削除（モック）。将来の `DELETE /api/inventories/:id` の差し替え点 |
| `src/features/inventory/api/deleteInventory.test.ts`                       | 新規      | 上記のテスト                                                          |
| `src/features/inventory/components/InventoryForm/InventoryForm.tsx`        | 変更      | `mode` / `initialValues` を受け取り、編集時の初期値・ラベルを出し分ける |
| `src/features/inventory/components/InventoryForm/InventoryForm.test.tsx`   | 変更      | 編集モードのテストを追加                                               |
| `src/features/inventory/components/InventoryFormModal/InventoryFormModal.tsx` | 変更   | `mode` / `initialValues` を `InventoryForm` に橋渡しし、タイトルを出し分ける |
| `src/features/inventory/components/InventoryFormModal/InventoryFormModal.test.tsx` | 変更 | 編集モードのテストを追加                                               |
| `src/features/inventory/components/InventoryRowActions/InventoryRowActions.tsx` | 新規 | 一覧の1行分の「編集」「削除」操作。削除の行内確認もここで持つ           |
| `src/features/inventory/components/InventoryRowActions/InventoryRowActions.module.scss` | 新規 | 上記のスタイル                                                         |
| `src/features/inventory/components/InventoryRowActions/index.ts`           | 新規      | バレル export                                                         |
| `src/features/inventory/components/InventoryRowActions/InventoryRowActions.test.tsx` | 新規 | 上記のテスト                                                           |
| `src/features/inventory/components/InventoryTable/InventoryTable.tsx`      | 変更      | 「操作」列を追加し、行ごとに `InventoryRowActions` を描画。`onEdit` / `onDelete` を受け取る |
| `src/features/inventory/components/InventoryTable/InventoryTable.module.scss` | 変更   | 列幅定義に「操作」列を追加                                             |
| `src/features/inventory/components/InventoryTable/InventoryTable.test.tsx` | 変更      | 操作列・コールバック呼び出しのテストを追加                             |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.tsx` | 変更   | 編集対象の状態管理、更新・削除ハンドラ、モーダルのモード切り替えを追加  |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.test.tsx` | 変更 | 編集・削除の一連の操作フローのテストを追加                             |

> ここに列挙されていないファイルを実装時に勝手に増やさない。必要になったら本設計書を先に更新する。

### 階層図

```
InventoryLists (app/inventory/lists/page.tsx)
└── InventoryListsView ('use client')
    ├── InventoryFilterBar
    ├── InventoryTable
    │   └── InventoryRowActions ('use client', 行ごと)
    └── InventoryFormModal ('use client', 登録／編集を1つのモーダルで共有)
        └── InventoryForm ('use client')
```

`InventoryTable` はこれまで通り `'use client'` を付けない。行の操作（編集起動・削除確認）は葉コンポーネントの `InventoryRowActions` に閉じ込め、既存の「最小の葉コンポーネントだけ `'use client'`」方針を維持する。

### Props

```ts
// InventoryForm
type Props = {
  categories?: Category[];
  storageLocations?: StorageLocation[];
  mode?: InventoryFormMode; // 省略時 'create'
  initialValues?: InventoryFormValues; // 省略時は createInitialValues(today) を使用（既存挙動）
  onSubmit: (draft: InventoryDraft) => void | Promise<void>;
  onCancel: () => void;
  today?: Date;
};

// InventoryFormModal
type Props = {
  open: boolean;
  onClose: () => void;
  categories?: Category[];
  storageLocations?: StorageLocation[];
  mode?: InventoryFormMode; // 省略時 'create'
  initialValues?: InventoryFormValues;
  onSubmit: (draft: InventoryDraft) => void; // InventoryForm 側は void | Promise<void> だが、InventoryFormModal は既存実装のまま同期のみ
};

// InventoryRowActions
type Props = {
  inventory: Inventory;
  onEdit: (inventory: Inventory) => void;
  onDelete: (inventory: Inventory) => void;
};

// InventoryTable（追加分のみ）
type Props = {
  // ...既存 Props
  onEdit?: (inventory: Inventory) => void;
  onDelete?: (inventory: Inventory) => void;
};
```

`mode` によるラベルの出し分け（`InventoryForm` / `InventoryFormModal` 内部で定数マップとして持つ）：

| mode     | モーダルタイトル | 送信ボタン | 送信中ラベル |
| -------- | ---------------- | ---------- | ------------ |
| `create` | 在庫を登録        | 登録する   | 登録中…      |
| `edit`   | 在庫を編集        | 更新する   | 更新中…      |

---

## 6. 状態管理・データフロー

- **Server / Client 分担**：既存どおり `InventoryListsView` を起点とする `'use client'` ツリー。新規の `InventoryRowActions` のみが削除確認用のローカル state（`useState`）を持つ。`InventoryTable` 自体は state を持たない（既存方針を維持）
- **サーバー状態**：TanStack Query は今回も未導入（Go バックエンドがないため）。登録機能と同様、`InventoryListsView` の `useState<Inventory[]>` をその場の唯一の状態源とする
- **クライアント状態**：絞り込み条件は既存の `useInventoryFilterStore`（Zustand）のまま変更なし。編集対象・モーダルのモードは Zustand 化せず、`InventoryListsView` のローカル `useState` で持つ（絞り込み条件のようにページを跨いで保持する必要がないため）
- **レンダリング戦略**：既存の `export const dynamic = 'force-dynamic'`（`app/inventory/lists/page.tsx`）を変更なしで踏襲。今回の変更は日時計算を増やさない
- **データの流れ**：
  1. `InventoryTable` の行で「編集」→ `InventoryRowActions` が `onEdit(inventory)` を呼ぶ
  2. `InventoryListsView` が `editingTarget` に対象を保持し、モーダルを `mode: 'edit'` で開く（`initialValues` は `toInventoryFormValues(editingTarget)`）
  3. フォーム送信で得た `InventoryDraft` と `editingTarget.id` を合成し（`updateInventory(id, draft)`）、`inventories` 配列内の該当要素を差し替える
  4. 「削除」→ `InventoryRowActions` が確認後に `onDelete(inventory)` を呼び、`InventoryListsView` が `deleteInventory(id)` を呼んだうえで `inventories` から該当要素を除去する
  5. どちらも成功後に既存の `flashMessage` の仕組みでメッセージを表示する

---

## 7. API 仕様

> Go バックエンドは未着手。現段階はモック実装だが、将来の API 契約を見据えて入出力を定義する。

| メソッド | パス                    | 用途     |
| -------- | ----------------------- | -------- |
| PATCH    | `/api/inventories/{id}` | 在庫更新 |
| DELETE   | `/api/inventories/{id}` | 在庫削除 |

### リクエスト / レスポンス

```ts
// PATCH /api/inventories/{id}
// Request: InventoryResponse から id を除いた形（更新後の全項目）
// Response: 200 OK, InventoryResponse（更新後の在庫）

// DELETE /api/inventories/{id}
// Request: なし
// Response: 204 No Content
```

### 現段階のモック実装

- 配置先: `src/features/inventory/api/updateInventory.ts`, `src/features/inventory/api/deleteInventory.ts`
- `updateInventory(id, draft)` は `{ ...draft, id }` を組み立てて返すだけ（`createInventory.ts` の採番ロジックに相当する部分がなく、既存 id を再利用する点のみ異なる）
- `deleteInventory(id)` は現段階では何もしない（呼び出し口を用意するだけ）。実際の一覧からの除去は `InventoryListsView` 側の state 操作で行う
- 永続化はしないため、更新・削除ともにページをリロードすると元のモックデータ（`getInventories.ts`）に戻る。これは登録機能と同じ既存の制約であり、本機能で新たに広げるものではない

---

## 8. バリデーション・エラーハンドリング

| 対象                       | ルール                                                     | エラーメッセージ（日本語）                     |
| -------------------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| 編集フォームの各項目       | 登録フォームと同一（`validateInventoryForm` をそのまま再利用） | 既存の登録フォームと同じメッセージ                |
| 削除確認                   | 「削除する」を押すまでは削除を実行しない                     | なし（確認表示のみ、エラーではない）              |

- 編集フォームのバリデーションは新規に作らず、`validateInventoryForm` をそのまま流用する（対象がフォーム入力値である以上、登録時と区別する理由がないため）
- 削除に失敗するケースは今回のモック実装では存在しない（対象の在庫が一覧に表示されている＝ローカル state 上に存在することが保証されるため）

---

## 9. テスト観点

### 正常系

- [ ] 一覧の各行に「編集」「削除」ボタンが表示される
- [ ] 「編集」ボタンを押すと編集モーダルが開き、タイトルが「在庫を編集」、送信ボタンが「更新する」になる
- [ ] 編集モーダルの各入力欄に、対象在庫の現在値（食品名・カテゴリ・保管場所・数量・期限・購入日・メモ）が初期表示される
- [ ] 数量だけを変更して「更新する」を押すと、一覧の当該行の数量が更新される
- [ ] 保管場所を「冷蔵庫」から「冷凍庫」に変更して更新すると、対象の行が冷蔵庫グループから消え、冷凍庫グループに表示される
- [ ] 期限を今日から3日後に変更して更新すると、残り日数列が「あと3日」（warning 色）に変わる
- [ ] 更新が成功すると、モーダルが閉じ、一覧上部に「〇〇を更新しました」が表示される
- [ ] 「削除」ボタンを押すと、その行に「削除しますか？」「削除する」「キャンセル」が表示される
- [ ] 確認表示で「削除する」を押すと、対象の行が一覧から消え、「全 N 件」の件数表示が1件減る
- [ ] 削除が成功すると、一覧上部に「〇〇を削除しました」が表示される
- [ ] 確認表示で「キャンセル」を押すと、在庫は削除されず、確認表示だけが閉じてボタン表示に戻る

### 異常系

- [ ] 編集フォームで数量欄を空にして「更新する」を押すと、「数量を入力してください」が表示され、一覧は更新されない
- [ ] 編集フォームで数量に `0` を入れて送信すると、「数量は1以上999以下で入力してください」が表示され、更新されない
- [ ] 編集フォームで食品名を空にして送信すると、「食品名を入力してください」が表示され、更新されない

### 境界値

- [ ] 在庫が1件のみの状態でその1件を削除すると、一覧が「登録されている在庫はありません。」表示になる
- [ ] 保管場所グループ内に1件しかない在庫を別の保管場所に編集で移動すると、元のグループの見出しごと表示から消える
- [ ] 絞り込み・検索条件を適用した状態で、絞り込み結果に含まれる在庫を削除しても、条件に一致しない他の在庫には影響しない

---

## 10. 未決事項・確認事項

- [x] **編集で変更可能にする項目の範囲**：既存の登録フォームをそのまま編集モードで再利用し、食品名・カテゴリ・購入日・メモを含む全項目を編集可能にする。→ ユーザー承認済み（2026-08-07）
- [x] **削除確認のUXパターン**：行内インライン確認（「削除しますか？」＋ボタン2つ）を採用する。→ ユーザー承認済み（2026-08-07）
- [x] **更新・削除後のメッセージ表示**：登録時と同じ仕組み（一覧上部のフラッシュメッセージ）を再利用する。→ ユーザー承認済み（2026-08-07）
