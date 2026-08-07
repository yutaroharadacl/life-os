# 詳細設計書：在庫登録（モーダル）

| 項目       | 内容                                                |
| ---------- | --------------------------------------------------- |
| 対象要件   | 要件定義書「5-1. 在庫登録機能」「8. 画面要件 No.2」 |
| タスクID   | なし（`docs/tasks.md` 未作成）                      |
| 作成日     | 2026-08-06                                          |
| ステータス | 実装済み（2026-08-06）                              |

---

## 1. 概要

在庫一覧画面（`/inventory/lists`）から、食料品を新規登録できるようにする。

要件定義書「5-1. 在庫登録機能」より:

- 食品名、数量、期限（任意）、購入日、カテゴリ、保管場所、メモを入力して登録できる
- カテゴリ・保管場所はそれぞれのマスタから選択する

要件定義書「8. 画面要件」では No.2「食品登録画面」を独立した画面として定義しているが、
本設計では**独立ページを作らず、在庫一覧画面上のモーダルダイアログとして実装する**
（ユーザー指示）。要件 7 の「スマホでの片手操作・簡単な入力」および
利用シーン「買い物後：買ってきたものを登録したい」に対して、
一覧 → 登録 → 一覧の画面遷移を挟まないほうが入力が速いため。
要件定義書の画面要件そのものは書き換えず、実装方式の差異として本設計書に記録する。

Go バックエンドは未着手のため、登録処理は**クライアント内のモック**とする。
登録した在庫は一覧に即座に反映されるが、リロードすると消える（永続化しない）。

## 2. スコープ

### やること

- 在庫一覧画面に「在庫を登録」ボタンを置き、押すとモーダルで登録フォームを開く
- フォームで 食品名 / カテゴリ / 保管場所 / 数量 / 期限 / 購入日 / メモ を入力する
- カテゴリ・保管場所は**モック**のマスタ一覧から `<select>` で選択する
- 入力バリデーションとエラーメッセージ表示
- 登録成功時にモーダルを閉じ、一覧へ即時反映する（該当保管場所のセクションに期限順で入る）
- 登録内容を保持するために一覧画面をクライアント側の状態管理へ移行する
- `Inventory` 型に `memo` を追加する（登録フォームで入力するため）
- モーダルのアクセシビリティ（フォーカストラップ、ESC で閉じる、`aria-labelledby`）

### やらないこと

- **永続化**（リロードで登録内容は失われる。Go バックエンド + PostgreSQL 実装時に対応）
- 在庫の編集・削除（要件 5-5、別タスク）
- カテゴリ／保管場所マスタの**管理画面**（要件 5-2 / 5-3、別タスク。本スコープは参照のみ）
- 検索・絞り込み・並び替え UI（要件 5-4、別タスク）
- 通知（要件 5-6、別タスク）
- バーコード・レシート読み取り（フェーズ2）
- 一覧への `memo` の**表示**（型には持つが列は増やさない）
- 登録日（`createdAt`）の保持（要件定義書「6. データ要件」にあるが、現時点でどの画面にも
  表示せず利用箇所がないため型に持たない。表示・並び替えに必要になった時点で追加する）
- 汎用モーダルの `src/shared/` への切り出し（利用箇所が1つのため。2つ目が出た時点で切り出す）

---

## 3. 画面・UI 仕様

対象画面: 要件定義書「8. 画面要件」No.1（在庫一覧画面）に No.2（食品登録画面）をモーダルとして内包する。

### 画面構成

- 画面名 / ルート: 在庫一覧画面 / `/inventory/lists`（**ルートの追加なし**）

| 要素                     | 役割                                                     |
| ------------------------ | -------------------------------------------------------- |
| 「在庫を登録」ボタン     | ヘッダ（`<h1>` と同じ行）に配置。押すとモーダルを開く    |
| 在庫テーブル             | 既存の `InventoryTable`。登録後は新しい在庫を含めて再描画 |
| 登録モーダル             | `<dialog>` によるモーダル。登録フォームを内包            |
| 完了メッセージ           | 登録後に一覧上部へ「〇〇を登録しました」（`aria-live`） |

### モーダルの構成

| 要素             | 内容                                                      |
| ---------------- | --------------------------------------------------------- |
| タイトル         | 「在庫を登録」                                            |
| 閉じるボタン     | 「閉じる」（右上）                                        |
| フォーム         | 下表の入力欄                                              |
| フッターボタン   | 「キャンセル」（副） / 「登録する」（主・`type="submit"`） |

送信は `<form action={submitAction}>`（React 19 のフォームアクション）で受ける。
`onSubmit` + `event.preventDefault()` は使わない。送信中かどうかは `useActionState` が返す
`isPending` で判定し、ボタンの文言と `disabled` に反映する。

### 入力項目

要件定義書「5-1」「6. データ要件」に対応。

| ラベル（日本語） | name             | 要素                  | 必須 | 初期値 | 備考                       |
| ---------------- | ---------------- | --------------------- | ---- | ------ | -------------------------- |
| 食品名           | `name`           | `<input type="text">` | ✓    | 空     | 前後の空白は除去する       |
| カテゴリ         | `category`       | `<select>`            | ✓    | 未選択 | マスタ（モック）から選択   |
| 保管場所         | `storage`        | `<select>`            | ✓    | 未選択 | マスタ（モック）から選択   |
| 数量             | `quantity`       | `<input type="number">` | ✓  | `1`    | 整数のみ                   |
| 期限             | `expirationDate` | `<input type="date">` | —    | 空     | 未入力可（要件 5-1「任意」） |
| 購入日           | `purchaseDate`   | `<input type="date">` | ✓    | 当日   | 当日はモーダルを開いた時点でクライアントが算出 |
| メモ             | `memo`           | `<textarea>`          | —    | 空     | 一覧には表示しない         |

- `<select>` の先頭には `value=""` の「選択してください」を置く（未選択を表現するため）。
- すべての入力欄は `<label htmlFor>` と `id` で結び付ける（`getByLabelText` で引けること）。

### 見出し階層

| 見出しテキスト | レベル | 備考                                                       |
| -------------- | ------ | ---------------------------------------------------------- |
| 在庫一覧       | `<h1>` | ページの主見出し（既存 `InventoryTable` 内）               |
| 保管場所名     | `<h2>` | 保管場所ごとのセクション（既存）                           |
| 在庫を登録     | `<h2>` | モーダルのタイトル。`<dialog aria-labelledby>` で紐付ける |

`<dialog>` はモーダル表示中、背後のコンテンツを不活性化するため、
ページ本体の `<h2>`（保管場所名）と同レベルでも見出し構造は破綻しない。

### 状態

| 状態         | 表示内容                                                                               |
| ------------ | -------------------------------------------------------------------------------------- |
| 初期表示     | 一覧＋「在庫を登録」ボタン。モーダルは閉じている（DOM 上は `<dialog>` が非表示で存在） |
| モーダル表示 | フォーム。ESC・キャンセル・閉じるで閉じる（フォーカス管理は `<dialog>` の標準挙動に任せる） |
| 入力エラー   | 該当欄の下に赤字でメッセージ。最初のエラー欄へフォーカスを移す。モーダルは閉じない     |
| 登録成功     | モーダルを閉じ、フォームを初期化し、一覧に反映。完了メッセージを表示                   |
| 送信中       | 「登録する」が「登録中…」に変わり、キャンセルとともに `disabled` になる（二重送信の防止） |
| エラー       | なし（モックは必ず成功する。実 API 接続時に通信エラー表示を追加する）                 |

### 操作と遷移

背景（オーバーレイ）クリックで閉じる判定は、**押した位置と離した位置の両方**を見る。
`click` は mousedown と mouseup の共通祖先に届くため、フォーム内で押して背景で離す
（文字列選択のドラッグ）と `<dialog>` が target になり、入力途中のフォームごと
閉じてしまうため。

| ユーザー操作                     | 起きること                                                       | 遷移先 |
| -------------------------------- | ---------------------------------------------------------------- | ------ |
| 「在庫を登録」を押す             | モーダルが開く（`showModal()`）。購入日に当日が入る               | なし   |
| 「登録する」を押す（入力正常）   | 在庫が一覧へ追加され、モーダルが閉じ、完了メッセージが出る       | なし   |
| 「登録する」を押す（入力不正）   | エラーメッセージ表示。モーダルは開いたまま                       | なし   |
| 「キャンセル」/「閉じる」/ ESC   | 入力内容を破棄してモーダルを閉じる                               | なし   |

**画面遷移は発生しない**（ルーターを触らない）。

### レスポンシブ

モバイルファースト。

- **モバイル（〜599px）**: モーダルは画面下から立ち上がるシート状（幅 100%、上部角丸、最大高 90vh、
  内容が溢れたら縦スクロール）。入力欄は縦1列。ボタンは横並びで幅を等分。
- **600px 以上**: 中央配置のカード（`max-width: 480px`）。入力欄は引き続き縦1列（項目数が少ないため）。
- タップ領域は最小 44px 高を確保する（要件 7「スマホでの片手操作」）。

---

## 4. データ・型定義

配置先ファイル: `src/features/inventory/types/index.ts`

```ts
/** 在庫（ドメイン型） */
export type Inventory = {
  /** 食品ID */
  id: string;
  /** 食品名 */
  name: string;
  /** カテゴリ名 */
  category: string;
  /** 保管場所名 */
  storage: string;
  /** 数量 */
  quantity: number;
  /** 期限。未設定は null。ISO 形式（YYYY-MM-DD） */
  expirationDate: string | null;
  /** 購入日。ISO 形式（YYYY-MM-DD） */
  purchaseDate: string;
  /** メモ。未入力は空文字 */
  memo: string;
};

/** 新規登録の入力値（ID はサーバーが採番するため持たない） */
export type InventoryDraft = Omit<Inventory, 'id'>;

/** カテゴリマスタ */
export type Category = {
  id: string;
  name: string;
};

/** 保管場所マスタ。DOM の組み込み型 `Storage` と衝突するため `StorageLocation` とする */
export type StorageLocation = {
  id: string;
  name: string;
};

/** 登録フォームの入力値。入力欄の生の値なのですべて文字列で持つ */
export type InventoryFormValues = {
  name: string;
  category: string;
  storage: string;
  quantity: string;
  expirationDate: string;
  purchaseDate: string;
  memo: string;
};

/** フィールドごとのエラーメッセージ。エラーのないフィールドはキーを持たない */
export type InventoryFormErrors = Partial<Record<keyof InventoryFormValues, string>>;
```

既存の `ExpirationStatus` / `ExpirationInfo` / `InventoryGroup` は変更しない。

`InventoryResponse` に登録関連のフィールドを追加する。

```ts
/** 在庫 API のレスポンス（将来の Go バックエンドとの契約） */
export type InventoryResponse = {
  id: string;
  name: string;
  category: string;
  storage: string;
  quantity: number;
  expiration_date: string | null;
  purchase_date: string;
  memo: string;
};
```

> `created_at`（登録日）は API 側では持つ想定だが、フロントで使う場面がないためレスポンス型に含めない。
> 表示・並び替えに必要になった時点で追加する。

### 要件定義書「6. データ要件」との対応

| 要件定義書の項目 | 型のフィールド   | 本スコープでの扱い                                   |
| ---------------- | ---------------- | ---------------------------------------------------- |
| 食品ID           | `id`             | 登録時にモックが採番（`crypto.randomUUID()`）        |
| 食品名           | `name`           | 必須入力                                             |
| カテゴリ         | `category`       | マスタ（モック）から選択。値は**名称文字列**を保持   |
| 保管場所         | `storage`        | 同上                                                 |
| 数量             | `quantity`       | 必須入力。1 以上の整数                               |
| 期限             | `expirationDate` | 任意入力。未入力は `null`                            |
| 購入日           | `purchaseDate`   | 必須入力。既定は当日                                 |
| 登録日           | —                | 利用箇所がないため**型に持たない**（スコープ外）     |
| メモ             | `memo`           | 任意入力。未入力は空文字。一覧には出さない           |

> カテゴリ・保管場所を ID ではなく名称文字列で持つのは、既存の `Inventory` と
> `groupByStorage`（`storage` 文字列でグループ化）を壊さないため。
> マスタ管理画面（要件 5-2 / 5-3）でマスタ名の変更・削除に対応する段階で ID 参照へ移行する。
> 本スコープではマスタが読み取り専用のモックであり、名称が変わることはない。

---

## 5. コンポーネント設計

### 既存コードの再利用

| 再利用するもの                                  | 用途                                       |
| ----------------------------------------------- | ------------------------------------------ |
| `InventoryTable`                                | 一覧表示。ヘッダに操作要素を差せるよう拡張 |
| `groupByStorage` / `sortByExpiration`           | 登録後の並び替え。**変更なし**             |
| `getExpirationInfo` / `formatDate`              | 表示整形。**変更なし**                     |
| `parseIsoDate`（`utils/isoDate.ts`）            | 日付バリデーションに再利用                 |
| `globals.css` のカスタムプロパティ              | 色。ボタン・オーバーレイ用に追加定義       |

`getInventories.ts` 内のプライベート関数 `toIsoDate(date)` は、フォームの購入日の既定値でも
必要になるため `utils/isoDate.ts` へ `formatIsoDate` として移し、両者から使う（重複実装の回避）。

### 新規／変更するファイル

| ファイルパス                                                                          | 新規/変更 | 責務                                                            |
| ------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------- |
| `src/features/inventory/types/index.ts`                                               | 変更      | `memo` 追加、登録関連の型を追加                                 |
| `src/features/inventory/utils/isoDate.ts`                                             | 変更      | `formatIsoDate(date: Date): string` を追加（`toIsoDate` の移設） |
| `src/features/inventory/utils/isoDate.test.ts`                                        | 変更      | `formatIsoDate` のテストを追加                                  |
| `src/features/inventory/utils/validateInventoryForm.ts`                               | 新規      | 入力値 → `InventoryFormErrors`（純粋関数）                      |
| `src/features/inventory/utils/validateInventoryForm.test.ts`                          | 新規      | 上記のテスト                                                    |
| `src/features/inventory/utils/toInventoryDraft.ts`                                    | 新規      | 入力値 → `InventoryDraft`（純粋関数。型変換のみ）               |
| `src/features/inventory/utils/toInventoryDraft.test.ts`                               | 新規      | 上記のテスト                                                    |
| `src/features/inventory/api/getInventories.ts`                                        | 変更      | モックに `memo` を追加、`formatIsoDate` を利用                  |
| `src/features/inventory/api/getCategories.ts`                                         | 新規      | カテゴリマスタのモック                                          |
| `src/features/inventory/api/getStorageLocations.ts`                                   | 新規      | 保管場所マスタのモック                                          |
| `src/features/inventory/api/createInventory.ts`                                       | 新規      | 登録のモック（ID を採番して `Inventory` を返す）                |
| `src/features/inventory/components/InventoryForm/InventoryForm.tsx`                   | 新規      | 入力欄・バリデーション・送信（`'use client'`）                  |
| `src/features/inventory/components/InventoryForm/InventoryForm.module.scss`           | 新規      | フォームのスタイル                                              |
| `src/features/inventory/components/InventoryForm/index.ts`                            | 新規      | バレル                                                          |
| `src/features/inventory/components/InventoryForm/InventoryForm.test.tsx`              | 新規      | 入力・エラー・送信のテスト                                      |
| `src/features/inventory/components/InventoryFormModal/InventoryFormModal.tsx`         | 新規      | `<dialog>` の開閉制御（`'use client'`）                         |
| `src/features/inventory/components/InventoryFormModal/InventoryFormModal.module.scss` | 新規      | モーダルのスタイル                                              |
| `src/features/inventory/components/InventoryFormModal/index.ts`                       | 新規      | バレル                                                          |
| `src/features/inventory/components/InventoryFormModal/InventoryFormModal.test.tsx`    | 新規      | 開閉のテスト                                                    |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.tsx`         | 新規      | 一覧＋登録ボタン＋モーダルを束ねる状態保持層（`'use client'`）  |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.module.scss` | 新規      | 登録ボタン・完了メッセージのスタイル                            |
| `src/features/inventory/components/InventoryListsView/index.ts`                       | 新規      | バレル                                                          |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.test.tsx`    | 新規      | 登録 → 一覧反映までの結合的な振る舞いのテスト                   |
| `src/features/inventory/components/InventoryTable/InventoryTable.tsx`                 | 変更      | ヘッダに `action` スロットを追加（他は変更なし）                |
| `src/features/inventory/components/InventoryTable/InventoryTable.module.scss`         | 変更      | ヘッダを左右振り分けレイアウトにする                            |
| `src/features/inventory/components/InventoryTable/InventoryTable.test.tsx`            | 変更      | `action` の描画テストを追加                                     |
| `src/app/inventory/lists/page.tsx`                                                    | 変更      | モックを取得し `InventoryListsView` に渡すだけの薄い層          |
| `src/app/globals.css`                                                                 | 変更      | ボタン・オーバーレイ・入力欄用のカスタムプロパティを追加        |
| `vitest.setup.ts`                                                                     | 変更      | jsdom に無い `<dialog>` の `showModal` / `close` を補う（下記） |
| `src/features/inventory/utils/expiration.test.ts`                                     | 変更      | ファクトリに `memo: ''` を追加（`Inventory` の必須項目が増えたため） |
| `src/features/inventory/utils/groupInventories.test.ts`                               | 変更      | 同上                                                            |
| `src/features/inventory/utils/sortInventories.test.ts`                                | 変更      | 同上                                                            |

#### `vitest.setup.ts` を変更する理由

jsdom 30.0.1 の `HTMLDialogElement` は `open` プロパティしか実装しておらず、
`showModal()` / `close()` を呼ぶと `TypeError` になる。
本設計はネイティブ `<dialog>` を採用しているため、**テスト環境側**に最小限の代替実装を置く。

- 実装コードにテスト専用の分岐は入れない（規約「テストのために実装側へテスト専用のコードを埋め込む」の禁止を守る）。
- 代替実装は `open` 属性の付け外しと `close` イベントの発火のみ。
  フォーカストラップ・背景の不活性化・ESC によるキャンセルはブラウザ固有の挙動であり、
  jsdom では再現しないため**テストの対象にしない**（詳細は「9. テスト観点」）。

> ここに列挙されていないファイルを実装時に勝手に増やさない。必要になったら本設計書を先に更新する。

### 階層図

```
InventoryLists (src/app/inventory/lists/page.tsx)   … Server Component
└── InventoryListsView                              … 'use client'（在庫リストの state を保持）
    ├── InventoryTable                              … action プロップに「在庫を登録」ボタンを渡す
    └── InventoryFormModal                          … <dialog> の開閉
        └── InventoryForm                           … 入力・検証・送信
```

`InventoryForm` を `InventoryFormModal` から分けるのは、編集機能（要件 5-5）で
同じフォームを再利用するため、および**モーダルの開閉**と**フォームの入力**という
別々の関心を混ぜないため。

`InventoryFormModal` は `open` が `true` のときだけ `InventoryForm` をレンダリングする
（`<dialog>` 要素自体は常に DOM に置き、`showModal()` / `close()` で開閉を制御する）。
閉じるたびにフォームがアンマウントされるため、**開き直したときに前回の入力が残らない**。
入力内容を明示的にリセットする処理を書かずに済む。

### Props

```ts
// InventoryTable（変更）
type Props = {
  /** 表示する在庫。グループ化と並び替えはこのコンポーネントで行う */
  inventories?: Inventory[];
  /** 期限日数の基準日。省略時は当日 */
  today?: Date;
  /** ヘッダ右側に置く操作要素（例: 登録ボタン）。省略時は何も描画しない */
  action?: ReactNode;
};
```

```ts
// InventoryListsView
type Props = {
  /** 初期表示する在庫（Server Component から受け取るモック） */
  initialInventories?: Inventory[];
  /** 選択肢に出すカテゴリマスタ */
  categories?: Category[];
  /** 選択肢に出す保管場所マスタ */
  storageLocations?: StorageLocation[];
};
```

```ts
// InventoryFormModal
type Props = {
  /** モーダルを開くかどうか */
  open: boolean;
  /** 閉じる操作（キャンセル・ESC・背景クリック）が起きたときに呼ぶ */
  onClose: () => void;
  categories?: Category[];
  storageLocations?: StorageLocation[];
  /** 登録が成立したときに呼ぶ */
  onSubmit: (draft: InventoryDraft) => void;
};
```

```ts
// InventoryForm
type Props = {
  categories?: Category[];
  storageLocations?: StorageLocation[];
  /**
   * 入力が妥当だったときに呼ぶ。
   * Promise を返すと解決するまで「登録中…」を表示する
   * （実 API 接続時にそのまま通信の完了待ちに使える）
   */
  onSubmit: (draft: InventoryDraft) => void | Promise<void>;
  /** キャンセルボタンを押したときに呼ぶ */
  onCancel: () => void;
  /** 購入日の既定値の基準日。省略時は当日（テストで日付を固定するため） */
  today?: Date;
};
```

### フォームの送信と状態

`InventoryForm` は React 19 の**フォームアクション**で送信を受ける。

```tsx
const [submitErrors, submitAction, isPending] = useActionState<InventoryFormErrors>(async () => {
  /* 検証 → エラーなら返す / 妥当なら await onSubmit(...) */
}, {});

<form action={submitAction}>
```

- `onSubmit` ハンドラと `event.preventDefault()` は使わない。
- 送信中の表示（`isPending`）が同じコンポーネントで得られるため `useActionState` を使う。
  `useFormStatus` は子コンポーネントを切る必要があり、`useTransition` は
  `<form action>` が内部で張る transition を拾えないため採用しない。
- **入力欄は制御コンポーネントのままにする。** 非制御 + `FormData` にすると、
  アクション完了後に React がフォームを自動リセットする挙動と噛み合わず、
  検証エラーで差し戻したときに入力内容が消えるおそれがあるため。
  アクションは `FormData` ではなく `values`（state）から読む。
- エラー表示は `useActionState` が持つため、「編集したら引っ込める」挙動は
  別の `editedFields` state で表現する（送信のたびにリセットする）。

### globals.css に追加するカスタムプロパティ

```css
--color-accent: #2563eb; /* 主ボタンの背景 */
--color-accent-foreground: #ffffff; /* 主ボタンの文字 */
--color-overlay: rgb(0 0 0 / 50%); /* モーダルの背景 */
--color-input-background: #ffffff; /* 入力欄の背景 */
```

ダークモード（`prefers-color-scheme: dark`）でも既存の各色と同様に上書き値を定義する。

---

## 6. 状態管理・データフロー

### Server Component / Client Component の分担

| コンポーネント        | 種別   | 理由                                                         |
| --------------------- | ------ | ------------------------------------------------------------ |
| `page.tsx`            | Server | モックを読んで渡すだけ                                       |
| `InventoryListsView`  | Client | 登録した在庫を保持し、一覧を再描画する必要がある             |
| `InventoryTable`      | Client | 上記の子として巻き込まれる（コード自体は変更なしで動作する） |
| `InventoryFormModal`  | Client | `<dialog>` の DOM API とイベントを扱う                       |
| `InventoryForm`       | Client | 入力 state とイベントハンドラを持つ                          |

> 規約「`'use client'` は最小の葉コンポーネントだけ」に対する例外。
> 登録した在庫を一覧へ即時反映するには、**一覧と登録フォームの共通の親**が
> state を持つ必要があり、その結果テーブルもクライアント境界に入る。
> `'use client'` を書くのは `InventoryListsView` / `InventoryFormModal` / `InventoryForm` の
> 3ファイルだけで、`InventoryTable` には書かない（親経由で自動的にクライアント扱いになる）。

### サーバー状態

現段階は `page.tsx` が `getInventories()` / `getCategories()` / `getStorageLocations()` を
同期的に呼び、props で渡す。**TanStack Query は使わない**（実 API がなく、
キャッシュ・再取得・楽観的更新のいずれも意味を持たないため）。
Go バックエンド接続時に `InventoryListsView` の `useState` を `useQuery` + `useMutation` に
置き換える。

### クライアント状態

`InventoryListsView` の `useState` で保持する。**Zustand は使わない**。

| state          | 型            | 用途                             |
| -------------- | ------------- | -------------------------------- |
| `inventories`  | `Inventory[]` | 表示中の在庫（初期値は props）   |
| `isModalOpen`  | `boolean`     | モーダルの開閉                   |
| `flashMessage` | `string`      | 登録完了メッセージ（空なら非表示） |

> Zustand を使わない理由: これらの state は `InventoryListsView` の内側だけで完結し、
> 離れたコンポーネント間で共有していないため。絞り込み条件など、
> 複数の画面要素から読み書きする状態が出てきた段階で導入する。
> なお `inventories` は本来サーバー状態であり、規約「サーバー状態を Zustand に持たせない」
> にも抵触する。

### レンダリング戦略

`src/app/inventory/lists/page.tsx` の `export const dynamic = 'force-dynamic'` は**維持する**。
「残り日数」がアクセス時点の日付に依存するため（既存の理由から変更なし）。

**「残り日数」の基準日は `page.tsx` で1度だけ求め、props で渡す。**
`InventoryTable` は本設計でクライアント境界の内側に入り、SSR とハイドレーションの
**2回**描画されるようになった。表示側の既定値（`today = new Date()`）に任せると
サーバーのタイムゾーンとブラウザのタイムゾーンで別々の日付になり、
同じ瞬間でも「あと1日」と「本日まで」のように表示が食い違う（hydration mismatch）。
`InventoryListsView` / `InventoryTable` の `today` の既定値はテスト用の保険であり、
アプリ側の呼び出しでは必ず明示的に渡すこと。

登録フォームの購入日の既定値は**サーバーでは計算しない**。
`InventoryForm` がマウント時（＝モーダルを開いた時点）にクライアントで `new Date()` から
算出する。サーバーで算出するとリクエスト時刻に固定され、
日付をまたいで画面を開きっぱなしにしたときに古い日付が入るため。

実装後は `pnpm build` を実行し、`/inventory/lists` が `ƒ (Dynamic)` のままであることを確認する。

### データの流れ

```
getInventories() / getCategories() / getStorageLocations()   … モック
  → page.tsx                        … props で渡すだけ
  → InventoryListsView              … useState(initialInventories)
      ├→ InventoryTable             … 既存どおりグループ化・並び替え・整形して描画
      └→ InventoryFormModal
          └→ InventoryForm          … 入力 → validateInventoryForm
                                     → エラーがあれば表示して中断
                                     → 無ければ toInventoryDraft → onSubmit(draft)
  ← InventoryListsView              … createInventory(draft) で id を採番
                                     → setInventories([...prev, created])
                                     → モーダルを閉じ、完了メッセージを出す
```

追加した在庫の表示位置は `groupByStorage` / `sortByExpiration` が決めるため、
配列の末尾に足すだけでよい（保管場所セクション内で期限順に並ぶ）。
新しい保管場所の在庫を足した場合、そのセクションは末尾に追加される（初出順のため）。

---

## 7. API 仕様

> Go バックエンドは未着手。現段階はモック実装だが、将来の API 契約を見据えて入出力を定義する。

| メソッド | パス                | 用途                   |
| -------- | ------------------- | ---------------------- |
| GET      | `/api/inventories`  | 在庫の一覧取得（既存） |
| POST     | `/api/inventories`  | 在庫の新規登録         |
| GET      | `/api/categories`   | カテゴリマスタの一覧   |
| GET      | `/api/storages`     | 保管場所マスタの一覧   |

### リクエスト / レスポンス

```ts
// POST /api/inventories — Request
type CreateInventoryRequest = {
  name: string;
  category: string;
  storage: string;
  quantity: number;
  expiration_date: string | null; // YYYY-MM-DD
  purchase_date: string; // YYYY-MM-DD
  memo: string;
};

// POST /api/inventories — Response 201
type CreateInventoryResponse = {
  inventory: InventoryResponse; // id はサーバーが採番
};

// POST /api/inventories — Response 400
type ValidationErrorResponse = {
  errors: { field: string; message: string }[];
};

// GET /api/categories — Response 200
type GetCategoriesResponse = {
  categories: { id: string; name: string }[];
};

// GET /api/storages — Response 200
type GetStoragesResponse = {
  storages: { id: string; name: string }[];
};
```

API のフィールドは snake_case、フロントのドメイン型は camelCase。
変換は API 層（`src/features/inventory/api/`）の責務とする。

### 現段階のモック実装

配置先: `src/features/inventory/api/`

```ts
// createInventory.ts
/** 在庫を登録する（Go バックエンド実装までのモック）。永続化はしない */
export const createInventory = (draft: InventoryDraft): Inventory => ({
  ...draft,
  id: createId(),
});
```

- 遅延・エラーは入れない（同期関数）。
- ID は `crypto.randomUUID()` を使うが、**これは secure context（https / localhost）でしか
  公開されない**。スマホから `http://<LAN-IP>:3000` で開くと `undefined` になり登録が
  例外で失敗するため、`Date.now()` + 連番のフォールバックを用意する
  （要件 4 でスマートフォンが主要デバイスのため、この経路は実際に通る）。
  jsdom は無条件に `randomUUID` を公開するので、テストでは明示的に潰して検証する。

```ts
// getCategories.ts — 要件 5-2 の初期値
export const getCategories = (): Category[] => [
  { id: 'c1', name: '野菜' },
  { id: 'c2', name: '肉' },
  { id: 'c3', name: '魚' },
  { id: 'c4', name: '乳製品' },
  { id: 'c5', name: '調味料' },
  { id: 'c6', name: '冷凍食品' },
  { id: 'c7', name: '麺' },
  { id: 'c8', name: 'その他' },
];

// getStorageLocations.ts — 要件 5-3 の初期値
export const getStorageLocations = (): StorageLocation[] => [
  { id: 's1', name: '冷蔵庫' },
  { id: 's2', name: '冷凍庫' },
  { id: 's3', name: 'パントリー' },
  { id: 's4', name: '常温棚' },
];
```

`getInventories.ts` の既存モックが使う `category` / `storage` の値は、
上記マスタに含まれる名称に揃える（既存データは条件を満たしている）。
あわせて全件に `memo` を追加する（一部は空文字、一部は文言ありとし、両方のパターンを含める）。

モックが再現すべきパターン（既存から維持）: 期限切れ / 期限間近 / 余裕あり / 期限なし。

---

## 8. バリデーション・エラーハンドリング

`validateInventoryForm(values: InventoryFormValues): InventoryFormErrors` に集約する（純粋関数）。
先に見つかったエラーで打ち切らず、**全フィールドを検証してまとめて返す**。

| フィールド       | ルール                                             | エラーメッセージ（日本語）                 |
| ---------------- | -------------------------------------------------- | ------------------------------------------ |
| 食品名           | 前後の空白を除いて1文字以上                        | `食品名を入力してください`                 |
| 食品名           | 前後の空白を除いて50文字以内                       | `食品名は50文字以内で入力してください`     |
| カテゴリ         | 空文字でないこと                                   | `カテゴリを選択してください`               |
| 保管場所         | 空文字でないこと                                   | `保管場所を選択してください`               |
| 数量             | 空文字でないこと                                   | `数量を入力してください`                   |
| 数量             | 整数であること（小数・数値以外を弾く）             | `数量は整数で入力してください`             |
| 数量             | 1 以上 999 以下                                    | `数量は1以上999以下で入力してください`     |
| 購入日           | 空文字でないこと                                   | `購入日を入力してください`                 |
| 購入日           | `parseIsoDate` が通ること                          | `購入日を正しい日付で入力してください`     |
| 期限             | 空文字は許可。入力時は `parseIsoDate` が通ること   | `期限を正しい日付で入力してください`       |
| メモ             | 200文字以内                                        | `メモは200文字以内で入力してください`      |

- 検証タイミングは**送信時のみ**（入力のたびに赤字が出るのを避ける）。
  一度エラーになったフィールドは、値が変わった時点でそのフィールドのエラーを消す。
- エラーのある入力欄には `aria-invalid="true"` と `aria-describedby="<id>-error"` を付け、
  メッセージを `<p id="<id>-error">` として直下に置く。
- 送信時にエラーがあれば、**最初のエラーフィールドへフォーカスを移す**
  （画面外のエラーに気づけるようにするため）。対象の要素は `<form>` の `elements.namedItem()`
  から引く（入力欄ごとに ref を持つと `react-hooks/refs`「レンダー中に ref を触らない」に反するため）。
- 期限が購入日より前でもエラーにしない（期限切れの食品を登録する場面があるため）。
  同様に購入日が未来でもエラーにしない。
- 通信エラーは本スコープでは発生しない（モックは必ず成功する）。

---

## 9. テスト観点

> このセクションが `unit-test-writer` の入力になる。

### `formatIsoDate(date)` （`utils/isoDate.ts`）

- [ ] `new Date(2026, 7, 6)` → `'2026-08-06'`
- [ ] 月・日が1桁のとき0埋めされる（`new Date(2026, 0, 5)` → `'2026-01-05'`）
- [ ] ローカルタイムの年月日を使う（UTC 変換で日付がずれない）

### `validateInventoryForm(values)`

#### 正常系

- [ ] すべて妥当な値 → `{}`（空オブジェクト）
- [ ] 期限が空文字（任意項目の未入力）でもエラーにならない
- [ ] メモが空文字でもエラーにならない
- [ ] 期限が購入日より前でもエラーにならない

#### 異常系

- [ ] 食品名が空文字 → `{ name: '食品名を入力してください' }`
- [ ] 食品名が空白のみ（`'   '`）→ `{ name: '食品名を入力してください' }`
- [ ] カテゴリが空文字 → `{ category: 'カテゴリを選択してください' }`
- [ ] 保管場所が空文字 → `{ storage: '保管場所を選択してください' }`
- [ ] 数量が空文字 → `{ quantity: '数量を入力してください' }`
- [ ] 数量が `'abc'` → `{ quantity: '数量は整数で入力してください' }`
- [ ] 数量が `'1.5'` → `{ quantity: '数量は整数で入力してください' }`
- [ ] 数量が `'0'` → `{ quantity: '数量は1以上999以下で入力してください' }`
- [ ] 購入日が空文字 → `{ purchaseDate: '購入日を入力してください' }`
- [ ] 購入日が `'2026-02-30'`（実在しない日付）→ `{ purchaseDate: '購入日を正しい日付で入力してください' }`
- [ ] 期限が `'not-a-date'` → `{ expirationDate: '期限を正しい日付で入力してください' }`
- [ ] 複数フィールドが不正 → **そのすべてのキー**がエラーに含まれる

#### 境界値

- [ ] 食品名が50文字 → エラーなし / 51文字 → エラーあり
- [ ] 数量が `'1'` → エラーなし / `'999'` → エラーなし / `'1000'` → エラーあり
- [ ] メモが200文字 → エラーなし / 201文字 → エラーあり

### `toInventoryDraft(values)`

- [ ] 数量の文字列 `'3'` が数値 `3` に変換される
- [ ] 期限が空文字のとき `expirationDate` が `null` になる
- [ ] 期限が `'2026-09-01'` のとき `expirationDate` がその文字列のまま入る
- [ ] 食品名の前後の空白が除去される（`'  牛乳  '` → `'牛乳'`）
- [ ] メモが空文字のとき `memo` が空文字のまま入る（`null` にしない）
- [ ] 戻り値に `id` が含まれない

### `createInventory(draft)` （`api/`）

#### 正常系

- [ ] draft の各フィールドが戻り値にそのまま入る
- [ ] `id` が空でない文字列として採番される
- [ ] 2回呼ぶと異なる `id` が採番される

#### 異常系

- [ ] `crypto.randomUUID` が使えない環境（secure context 外）でも例外を投げずに `id` が採番される
- [ ] 同環境で2回呼ぶと異なる `id` が採番される

### `InventoryForm`

#### 正常系

- [ ] 食品名・カテゴリ・保管場所・数量・期限・購入日・メモの各入力欄が
      `getByLabelText` で取得できる
- [ ] `categories` の各名称が `<option>` として表示される
- [ ] `storageLocations` の各名称が `<option>` として表示される
- [ ] `today` に固定日を渡すと、購入日の初期値がその日付（`YYYY-MM-DD`）になる
- [ ] 数量の初期値が `1` である
- [ ] すべて入力して「登録する」を押すと `onSubmit` が
      `{ name, category, storage, quantity: 数値, expirationDate, purchaseDate, memo }` で呼ばれる
- [ ] 期限を未入力のまま送信すると `onSubmit` の `expirationDate` が `null` になる
- [ ] 「キャンセル」を押すと `onCancel` が呼ばれ、`onSubmit` は呼ばれない
- [ ] `onSubmit` が解決するまで「登録する」が「登録中…」になり、
      「登録中…」と「キャンセル」がどちらも `disabled` になる（二重送信されない）
- [ ] `onSubmit` が解決するとボタンが「登録する」に戻り、押せるようになる

#### 異常系

- [ ] 食品名を空のまま「登録する」を押すと「食品名を入力してください」が表示され、
      `onSubmit` は呼ばれない
- [ ] 数量に `0` を入れて送信するとエラーメッセージが表示され、`onSubmit` は呼ばれない
- [ ] エラー表示後に食品名を入力し直すと、そのフィールドのエラーメッセージが消える
- [ ] 送信時にエラーがあると、最初のエラーフィールドにフォーカスが当たる

#### 境界値

- [ ] `categories` / `storageLocations` を省略したとき（既定値 `[]`）、
      選択肢は「選択してください」のみになりクラッシュしない
- [ ] メモ・期限だけ未入力でも登録できる（任意項目のみ空）

### `InventoryFormModal`

> jsdom はフォーカストラップ・背景の不活性化・ESC によるキャンセルを再現しないため、
> これらはテスト対象にしない（ブラウザ標準の挙動であり、こちらの実装ではないため）。
> ESC は `<dialog>` が発火する `cancel` イベントを直接発火させ、**ハンドラの結線**だけを検証する。

- [ ] `open={false}` のとき入力欄が描画されない（`queryByLabelText('食品名')` が `null`）
- [ ] `open={true}` のとき入力欄が描画され、ダイアログのアクセシブル名が「在庫を登録」になる
- [ ] 「閉じる」ボタンを押すと `onClose` が呼ばれる
- [ ] 「キャンセル」ボタンを押すと `onClose` が呼ばれる
- [ ] `<dialog>` に `cancel` イベント（ESC 相当）が発火すると `onClose` が呼ばれる
- [ ] フォーム送信が成立すると `onSubmit` が draft 付きで呼ばれる
- [ ] `open` を `true` → `false` → `true` と変えると、入力欄の値が初期状態に戻っている

### `InventoryListsView`

#### 正常系

- [ ] 初期表示で `initialInventories` の在庫が一覧に表示される
- [ ] 「在庫を登録」ボタンが表示されている
- [ ] ボタンを押すとダイアログが開く
- [ ] フォームに入力して登録すると、その食品名が一覧に表示される
- [ ] 登録後にダイアログが閉じる
- [ ] 登録後に「〇〇を登録しました」という完了メッセージが表示される
- [ ] 保管場所「冷蔵庫」で登録すると、「冷蔵庫」セクションの表に行が増える
- [ ] 既存にない保管場所で登録すると、新しい保管場所セクションが増える
- [ ] 登録した在庫は保管場所セクション内で期限順の正しい位置に入る
- [ ] 「全 N 件」の件数が登録後に1増える

#### 異常系

- [ ] 入力エラーのまま「登録する」を押しても一覧の件数は変わらず、入力欄も表示されたまま
- [ ] ダイアログを閉じてから開き直すと、前回入力した内容が残っていない

#### 境界値

- [ ] `initialInventories` を省略したとき（既定値 `[]`）空状態が表示され、
      そこから1件登録すると「全 1 件」になる

### `InventoryTable`（既存テストへの追加）

- [ ] `action` に要素を渡すとヘッダ内に描画される
- [ ] `action` を省略しても既存の表示が壊れない

---

## 10. 未決事項・確認事項

> 設計時に判断できなかったことを勝手に決めず、ここに挙げてユーザーに確認する。
> **すべて解決してから実装フェーズに進む。**

未決事項はすべて解決済み（2026-08-06 ユーザー確認）。

- [x] **登録データの永続化** → **永続化しない**。クライアントの `useState` に持つだけとし、
      リロードで消える。`localStorage` は使わない（バックエンド実装時に捨てるコードになるため）。
- [x] **状態管理に Zustand を使うか** → **使わない**。`InventoryListsView` の `useState` で保持する。
- [x] **`createdAt`（登録日）を型に持つか** → **持たない**。利用箇所がないため型から外す。
      表示・並び替えに必要になった時点で追加する。
- [x] **カテゴリ・保管場所の保持形式** → **名称文字列**で保持する。
      ID 参照への移行はマスタ管理画面（要件 5-2 / 5-3）の実装時に行う。
- [x] **モーダルの実装方式** → ネイティブ **`<dialog>` + `showModal()`** を使う。

### 今後のタスクへ持ち越す事項（本スコープ外）

- 登録した在庫の永続化（Go + PostgreSQL 実装時）
- カテゴリ・保管場所マスタの管理画面（要件 5-2 / 5-3）。実装時にモックを差し替える
- 編集フォーム（要件 5-5）。`InventoryForm` に初期値 props を足して再利用する
- 送信中・通信エラーの UI（実 API 接続時）
- モーダルの `src/shared/components/Modal` への切り出し（2つ目の利用箇所が出た時点）
- 登録日（`createdAt`）の追加。表示・並び替えで必要になった時点で型・API 契約に戻す
