# 詳細設計書：在庫一覧（表形式）

| 項目       | 内容                                                      |
| ---------- | --------------------------------------------------------- |
| 対象要件   | 要件定義書「5-4. 在庫一覧・検索機能」「8. 画面要件 No.1」 |
| タスクID   | なし（`docs/tasks.md` 未作成）                            |
| 作成日     | 2026-08-06                                                |
| ステータス | 実装済み                                                  |

---

## 1. 概要

在庫一覧画面（ホーム）に、登録済みの食料品を**表形式**で一覧表示する。

要件定義書「5-4. 在庫一覧・検索機能」より:

- 登録済みの食品を一覧表示できる
- 期限が設定されている食品は「期限までの日数」を表示
- 期限が未設定の食品は「購入日からの経過日数」を表示

また「5-6. 消費期限管理・通知機能」より、期限切れの食品は一覧上で警告表示（赤色）する。

本設計はこのうち**表示部分のみ**を対象とする。検索・絞り込み・並び替えの UI、および通知は
別タスクとして切り出す。データ取得は Go バックエンド未着手のためモックで行う。

既存の `InventoryList` / `InventoryCard`（カード＋保管場所グルーピング）は試作であり、
本設計で表形式に作り直す（既存ファイルは削除する）。

## 2. スコープ

### やること

- 在庫を**保管場所ごとのセクションに分け**、各セクション内で1行1件の表として一覧表示する
  （列: 食品名 / カテゴリ / 数量 / 期限 / 残り日数）
- 期限あり → 「期限までの日数」、期限なし → 「購入日からの経過日数」を表示する
- 期限切れ・期限間近を警告色で表示する
- 0件のときの空状態を表示する
- モックデータを `features/inventory/api/` に集約し、ページからはダミー配列を排除する
- 表示件数（全 N 件）の表示

### やらないこと

- 検索・カテゴリ／保管場所での絞り込み UI（要件 5-4、別タスク）
- 並び替えの UI 操作（要件 5-4、別タスク。初期並び順は本設計で固定する）
- 行クリックによる編集画面への遷移（要件 5-5、別タスク）
- 登録・編集・削除（要件 5-1 / 5-5、別タスク）
- プッシュ通知および通知タイミング設定（要件 5-6、別タスク）
- カテゴリ・保管場所マスタの参照（現段階は在庫データが持つ文字列をそのまま表示する）
- 実 API 接続（Go バックエンド未着手）

---

## 3. 画面・UI 仕様

対象画面: 要件定義書「8. 画面要件」No.1 在庫一覧画面（ホーム）

### 画面構成

- 画面名 / ルート: 在庫一覧画面 / `/inventory/lists`
- UI 要素:

| 要素               | 役割                                                     |
| ------------------ | -------------------------------------------------------- |
| 見出し             | 「在庫一覧」（`<h1>`。この画面の主見出し）               |
| 件数               | 「全 N 件」                                              |
| 保管場所セクション | 保管場所名の見出し（`<h2>`）＋その保管場所の在庫テーブル |
| テーブル           | 在庫データ本体。1行 = 在庫1件                            |
| 空状態             | 0件のときセクションの代わりに表示するメッセージ          |

### テーブルの列

保管場所はセクション見出しで表すため、列には持たない。

| 列       | 内容                                  | 備考                                               |
| -------- | ------------------------------------- | -------------------------------------------------- |
| 食品名   | `name`                                | 左寄せ                                             |
| カテゴリ | `category`                            | 左寄せ。空文字のときは「未指定」                   |
| 数量     | `quantity`                            | 右寄せ。単位は付けない（単位マスタは未定義のため） |
| 期限     | `expirationDate` を `YYYY/MM/DD` 表示 | 未設定は「なし」                                   |
| 残り日数 | 期限までの日数 / 購入からの経過日数   | 下表の通り。状態に応じて色を変える                 |

見出し階層は `<h1>`（在庫一覧）→ `<h2>`（保管場所名）とする。
保管場所セクションは `<section aria-labelledby>` で見出し `<h2>` と結びつけ、
スクリーンリーダーでどの保管場所の表かを判別できるようにする
（`<caption>` は見出しと同じ文字列の重複になるため使わない）。

### 「残り日数」列の表示ルール

`getExpirationInfo(inventory, today)` が返す `status` / `label` で決まる。

| 条件                     | status    | 表示例        | 色                      |
| ------------------------ | --------- | ------------- | ----------------------- |
| 期限あり・期限日 < 今日  | `expired` | `3日超過`     | 赤（`--color-danger`）  |
| 期限あり・期限日 == 今日 | `warning` | `本日まで`    | 橙（`--color-warning`） |
| 期限あり・残り 1〜3日    | `warning` | `あと2日`     | 橙（`--color-warning`） |
| 期限あり・残り 4日以上   | `normal`  | `あと10日`    | 通常                    |
| 期限なし                 | `none`    | `購入から5日` | 淡色（`--color-muted`） |

- 期限間近のしきい値は **3日**（暫定。通知設定画面の実装時にユーザー設定へ差し替える）
- 期限切れの在庫も一覧から消さず、警告色を付けて残す（要件 5-6「一覧上で警告表示」）

### 並び順

**保管場所ごとにグループ化し、グループ内は期限が近い順**に固定する。

- **保管場所（セクション）の順序**: 在庫データに最初に現れた順（初出順）。
  保管場所マスタの表示順が実装されるまでの暫定仕様。
- **グループ内の行の順序**:
  1. 期限ありを先、期限なしを後に並べる
  2. 期限ありどうしは `expirationDate` の昇順
  3. 期限なしどうしは `purchaseDate` の昇順（古い＝経過日数が長いものが上）
  4. 上記が同値の場合は入力順を維持する（安定ソート）
- `storage` が空文字の在庫は「未指定」グループにまとめる。

### 状態

| 状態         | 表示内容                                                                          |
| ------------ | --------------------------------------------------------------------------------- |
| 初期表示     | 見出し＋件数＋保管場所ごとのセクション                                            |
| ローディング | なし（Server Component でモックを同期的に読むため発生しない）                     |
| 0件          | セクションを描画せず「登録されている在庫はありません。」を表示。件数は「全 0 件」 |
| エラー       | 本スコープでは発生しない（モックは必ず成功する）。実 API 接続時に別途設計         |

### 操作と遷移

- なし（本スコープは表示のみ）

### レスポンシブ

モバイルファースト。列の出し分けはしない（どの画面幅でも5列すべてを表示する）。

- **モバイル（〜599px）**: `table-layout: fixed` で列幅を割合指定し、文字を折り返して
  **横スクロールなしに全列を表示する**。フォントサイズと余白を詰める。
- **600px 以上**: フォントサイズと余白を広げ、セルを折り返さない（`white-space: nowrap`、
  溢れる場合は省略記号）。
- テーブルは `overflow-x: auto` のコンテナに入れておき、極端に狭い環境でも
  横スクロールで参照できるフォールバックを残す。

> 当初は「モバイルでは横スクロール」で設計したが、実機幅（375px）で確認したところ
> 最重要の「残り日数」列が画面外に出てしまい、要件 7 の「スマホでの片手操作」を
> 満たさないため上記に変更した。保管場所ごとに表が分かれるため、`table-layout: fixed`
> で列幅を固定し、表どうしの列位置を揃えている。

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
};

/** 期限の状態 */
export type ExpirationStatus = 'expired' | 'warning' | 'normal' | 'none';

/** 一覧の「残り日数」列に表示する情報 */
export type ExpirationInfo = {
  status: ExpirationStatus;
  /** 表示ラベル（例: 「あと3日」「3日超過」「購入から5日」） */
  label: string;
};

/** 保管場所ごとにまとめた在庫グループ（一覧のセクション1つ分） */
export type InventoryGroup = {
  /** 保管場所名。空文字の在庫は「未指定」に寄せる */
  storage: string;
  inventories: Inventory[];
};

/** 在庫 API のレスポンス（将来の Go バックエンドとの契約） */
export type InventoryResponse = {
  id: string;
  name: string;
  category: string;
  storage: string;
  quantity: number;
  expiration_date: string | null;
  purchase_date: string;
};
```

### 要件定義書「6. データ要件」との対応

| 要件定義書の項目 | 型のフィールド   | 本スコープでの扱い                       |
| ---------------- | ---------------- | ---------------------------------------- |
| 食品ID           | `id`             | 必須。React の `key` に使う              |
| 食品名           | `name`           | 必須。表示する                           |
| カテゴリ         | `category`       | 必須。マスタ紐付けは将来。今は名称文字列 |
| 保管場所         | `storage`        | 必須。同上                               |
| 数量             | `quantity`       | 必須。表示する                           |
| 期限             | `expirationDate` | 任意（null 可）。表示する                |
| 購入日           | `purchaseDate`   | 必須。経過日数の算出に使う               |
| 登録日           | —                | 本スコープでは表示しないため型に持たない |
| メモ             | —                | 一覧では表示しないため型に持たない       |

> 既存型からの変更点: `id` を追加、日付形式を `YYYY/MM/DD` から ISO の `YYYY-MM-DD` へ変更
> （比較・ソートを文字列のまま安全に行うため。表示時に `YYYY/MM/DD` へ整形する）。

---

## 5. コンポーネント設計

### 新規／変更するファイル

| ファイルパス                                                                  | 新規/変更/削除 | 責務                                                       |
| ----------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------- |
| `src/features/inventory/types/index.ts`                                       | 変更           | `Inventory` の更新、`ExpirationStatus` 等の追加            |
| `src/features/inventory/utils/isoDate.ts`                                     | 新規           | `parseIsoDate` / `toDayValue`（ISO 日付の解釈を一元化）    |
| `src/features/inventory/utils/isoDate.test.ts`                                | 新規           | 上記のテスト                                               |
| `src/features/inventory/utils/expiration.ts`                                  | 新規           | `getExpirationInfo`（純粋関数。日付換算は内部ヘルパー）    |
| `src/features/inventory/utils/expiration.test.ts`                             | 新規           | 上記のテスト                                               |
| `src/features/inventory/utils/sortInventories.ts`                             | 新規           | `sortByExpiration`（純粋関数）                             |
| `src/features/inventory/utils/sortInventories.test.ts`                        | 新規           | 上記のテスト                                               |
| `src/features/inventory/utils/groupInventories.ts`                            | 新規           | `groupByStorage`（保管場所ごとのグループ配列を返す）       |
| `src/features/inventory/utils/groupInventories.test.ts`                       | 新規           | 上記のテスト                                               |
| `src/features/inventory/utils/formatDate.ts`                                  | 新規           | `formatDate`（ISO → `YYYY/MM/DD`）                         |
| `src/features/inventory/utils/formatDate.test.ts`                             | 新規           | 上記のテスト                                               |
| `src/features/inventory/api/getInventories.ts`                                | 新規           | モックの在庫データを返す                                   |
| `src/features/inventory/components/InventoryTable/InventoryTable.tsx`         | 新規           | 表本体（見出し・件数・テーブル・空状態）                   |
| `src/features/inventory/components/InventoryTable/InventoryTable.module.scss` | 新規           | 表のスタイル                                               |
| `src/features/inventory/components/InventoryTable/index.ts`                   | 新規           | バレル                                                     |
| `src/features/inventory/components/InventoryTable/InventoryTable.test.tsx`    | 新規           | 表示のテスト                                               |
| `src/app/inventory/lists/page.tsx`                                            | 変更           | モックを取得して `InventoryTable` に渡すだけの薄い層       |
| `src/app/globals.css`                                                         | 変更           | 警告色などのカスタムプロパティを追加                       |
| `src/features/inventory/components/InventoryList/*`                           | 削除           | 表形式へ作り直すため                                       |
| `src/features/inventory/components/InventoryCard/*`                           | 削除           | 同上                                                       |
| `src/features/inventory/utils/groupeInventories.ts` / `.test.ts`              | 削除           | `groupInventories.ts` へ作り直す（綴りと戻り値の型を変更） |

> ここに列挙されていないファイルを実装時に勝手に増やさない。必要になったら本設計書を先に更新する。

### 階層図

```
InventoryLists (src/app/inventory/lists/page.tsx)
└── InventoryTable
    └── （保管場所セクションと行はコンポーネント内で map。子コンポーネントは作らない）
```

行やセクションを独立コンポーネントに切らない理由: 表示のみで状態を持たず、`<tr>` は
親の `<tbody>` と密結合なため。行に操作（編集・削除）が入る段階で切り出す。

### Props

```ts
// InventoryTable
type Props = {
  /** 表示する在庫。グループ化と並び替えはコンポーネント側で行う */
  inventories?: Inventory[];
  /** 期限日数の基準日。省略時は当日 */
  today?: Date;
};
```

`groupByStorage` の戻り値型 `InventoryGroup` は「4. データ・型定義」を参照。
グループを `Record<string, Inventory[]>` ではなく配列にするのは、
オブジェクトのキー順に依存せず**セクションの表示順を型として明示する**ため。

`today` を Props で受けられるようにするのは、テストで日付を固定するため
（実装側にテスト専用コードを埋め込まず、既定値で本番挙動を保つ）。

### globals.css に追加するカスタムプロパティ

```css
--color-danger: #dc2626; /* 期限切れ */
--color-warning: #d97706; /* 期限間近 */
--color-muted: #6b7280; /* 補助テキスト */
--color-border: #e5e7eb; /* 罫線 */
--color-surface: #f9fafb; /* テーブルヘッダ・空状態の背景 */
```

ダークモード（`prefers-color-scheme: dark`）でも既存の `--background` / `--foreground`
と同様に上書き値を定義する。

---

## 6. 状態管理・データフロー

- **Server Component / Client Component の分担**
  - `page.tsx`、`InventoryTable` ともに **Server Component**。`'use client'` は付けない。
  - 表示のみで state・イベントハンドラを持たないため。絞り込み UI を追加する段階で、
    その UI だけを Client Component として切り出す。
- **サーバー状態**: 現段階は `features/inventory/api/getInventories.ts` のモックを
  `page.tsx` から直接呼ぶ。**TanStack Query はまだ使わない**（Client Component が無いため）。
  実 API 接続時に、Client 側で必要になった時点で導入する。
- **クライアント状態**: なし。**Zustand は使わない**（絞り込み条件が入る段階で導入する）。
- **レンダリング戦略**: 「残り日数」はアクセス時点の日付で計算する必要があるため、
  このルートは**静的プリレンダリングの対象にしない**。`src/app/inventory/lists/page.tsx` に
  `export const dynamic = 'force-dynamic'` を付与する。
  これを怠ると `today` の既定値（`new Date()`）がビルド時刻のまま HTML に焼き込まれ、
  日付が変わっても警告表示が更新されない（要件 5-6 を満たさなくなる）。

### データの流れ

```
getInventories()            … モック配列を返す
  → page.tsx                … 受け取って props で渡すだけ
  → InventoryTable          … groupByStorage で保管場所ごとに分割
                            → 各グループ内を sortByExpiration で並び替え
                            → 行ごとに getExpirationInfo / formatDate で表示用に整形
                            → 保管場所セクション + <table> を描画
```

---

## 7. API 仕様

> Go バックエンドは未着手。現段階はモック実装だが、将来の API 契約を見据えて入出力を定義する。

| メソッド | パス               | 用途           |
| -------- | ------------------ | -------------- |
| GET      | `/api/inventories` | 在庫の一覧取得 |

### リクエスト / レスポンス

```ts
// Request
// クエリパラメータなし（絞り込み・並び替えは別タスクで追加する）

// Response 200
type GetInventoriesResponse = {
  inventories: InventoryResponse[];
};

// 例
{
  "inventories": [
    {
      "id": "1",
      "name": "豚こま肉",
      "category": "肉",
      "storage": "冷蔵庫",
      "quantity": 1,
      "expiration_date": "2026-08-06",
      "purchase_date": "2026-08-03"
    }
  ]
}
```

- API のフィールドは snake_case、フロントのドメイン型は camelCase。
  変換は API 層（`getInventories.ts`）の責務とし、コンポーネントには
  `Inventory` だけを渡す。

### 現段階のモック実装

- 配置先: `src/features/inventory/api/getInventories.ts`
- 実装: ハードコードした `Inventory[]` を返す同期関数。遅延やエラーは入れない。

```ts
/** 在庫一覧を取得する（Go バックエンド実装までのモック） */
export const getInventories = (): Inventory[] => [/* ... */];
```

- モックデータは期限切れ・期限間近・余裕あり・期限なしの4パターンを最低1件ずつ含める。
- 日付は**当日からの相対**（`shiftDays(-2)` など）で生成する。絶対日付をハードコードすると
  日が経つにつれて上記4パターンが崩れ、動作確認の役に立たなくなるため。

---

## 8. バリデーション・エラーハンドリング

入力フォームは本スコープに含まれないため、入力バリデーションはなし。
表示時の防御的な扱いのみ定義する。

| 対象                              | ルール                       | 表示                                                  |
| --------------------------------- | ---------------------------- | ----------------------------------------------------- |
| `inventories`                     | 未指定 / 空配列              | 空状態メッセージを表示                                |
| `storage`                         | 空文字                       | 「未指定」                                            |
| `category`                        | 空文字                       | 「未指定」                                            |
| `expirationDate`                  | `null`                       | 期限列は「なし」、残り日数列は「購入から N 日」       |
| `expirationDate` / `purchaseDate` | 日付として解釈できない文字列 | 期限列・残り日数列とも「-」を表示し、行自体は描画する |
| `purchaseDate`                    | 期限が未設定で購入日が未来   | 残り日数列は「-」（経過日数を決められないため）       |

- 想定するエラーケース: 本スコープでは通信を行わないため、通信エラーは発生しない。
  不正なデータが混じっても**例外を投げず、その列だけフォールバック表示**して一覧全体を守る。
- 「日付として解釈できない」の判定は `parseIsoDate` に一元化する。書式（`YYYY-MM-DD`）だけでなく
  **実在する日付かどうか**も見る（`2026-02-30` は不正として扱う）。
  表示（`formatDate`）と日数計算（`getExpirationInfo`）で判定が食い違わないようにするため。

---

## 9. テスト観点

> このセクションが `unit-test-writer` の入力になる。

### `getExpirationInfo(inventory, today)`

#### 正常系

- [ ] 期限が今日より3日後 → `{ status: 'warning', label: 'あと3日' }`
- [ ] 期限が今日より10日後 → `{ status: 'normal', label: 'あと10日' }`
- [ ] 期限が今日 → `{ status: 'warning', label: '本日まで' }`
- [ ] 期限が3日前 → `{ status: 'expired', label: '3日超過' }`
- [ ] 期限が `null`・購入日が5日前 → `{ status: 'none', label: '購入から5日' }`
- [ ] 期限が `null`・購入日が今日 → `{ status: 'none', label: '購入から0日' }`

#### 異常系

- [ ] `expirationDate` が `'not-a-date'` → `{ status: 'none', label: '-' }`（例外を投げない）
- [ ] `expirationDate` が `null` かつ `purchaseDate` が `'not-a-date'` → `{ status: 'none', label: '-' }`

#### 境界値

- [ ] 期限が今日より4日後 → `warning` ではなく `normal`（しきい値3日の外側）
- [ ] 期限が今日より1日後 → `{ status: 'warning', label: 'あと1日' }`
- [ ] 期限が今日より1日前 → `{ status: 'expired', label: '1日超過' }`
- [ ] 基準日の時刻が 23:59 でも日付単位で判定する（同日なら `本日まで`）

### `sortByExpiration(inventories)`

#### 正常系

- [ ] 期限ありの在庫が期限の昇順に並ぶ
- [ ] 期限ありがすべて期限なしより前に並ぶ
- [ ] 期限なしどうしは購入日の昇順に並ぶ

#### 異常系

- [ ] 引数を省略すると空配列を返す

#### 境界値

- [ ] 空配列 → 空配列
- [ ] 1件 → そのまま1件
- [ ] 期限が同じ2件 → 元の順序が保たれる（安定ソート）
- [ ] 元の配列を破壊しない（引数の配列の順序が変わらない）

### `groupByStorage(inventories)`

#### 正常系

- [ ] 保管場所ごとにグループ化され、グループの順序は初出順になる
- [ ] 同じ保管場所の在庫が1つのグループにまとまる

#### 異常系

- [ ] 引数を省略すると空配列を返す
- [ ] `storage` が空文字の在庫は `storage: '未指定'` のグループに入る

#### 境界値

- [ ] 空配列 → 空配列
- [ ] 全件が同じ保管場所 → グループは1つ
- [ ] 元の配列を破壊しない

### `formatDate(isoDate)`

- [ ] `'2026-08-06'` → `'2026/08/06'`
- [ ] `null` → `'なし'`
- [ ] `'not-a-date'` → `'-'`

### `InventoryTable`

#### 正常系

- [ ] 保管場所が2種類の在庫を渡すと、`getAllByRole('table')` が2つ返る
- [ ] 保管場所名が見出し（`getByRole('heading', { name: '冷蔵庫' })`）として表示される
- [ ] 同じ保管場所の在庫3件を渡すと、その表の `getAllByRole('row')` がヘッダ行を含め4行になる
- [ ] 食品名・カテゴリ・数量・期限がテキストとして表示される
- [ ] 「全 3 件」が表示される（保管場所をまたいだ総件数）
- [ ] 期限切れの在庫の行に「N日超過」が表示される
- [ ] 期限なしの在庫の行に「なし」と「購入から N 日」が表示される
- [ ] `today` を固定して渡すと、その基準日で残り日数が計算される
- [ ] 各表の中で期限が近い順に行が並ぶ（1行目が最も期限の近い在庫）

#### 異常系

- [ ] `storage` が空文字の在庫は「未指定」という見出しのセクションに入る
- [ ] `category` が空文字の在庫は「未指定」と表示される

#### 境界値

- [ ] 0件のとき「登録されている在庫はありません。」が表示され、`table` ロールが存在しない
- [ ] `inventories` を省略したとき（デフォルト値 `[]`）も 0件と同じ表示になる
- [ ] 1件のとき「全 1 件」と表示され、表が1つだけ描画される

---

## 10. 未決事項・確認事項

> 設計時に判断できなかったことを勝手に決めず、ここに挙げてユーザーに確認する。
> **すべて解決してから実装フェーズに進む。**

未決事項はすべて解決済み（2026-08-06 ユーザー確認）。

- [x] **期限間近のしきい値** → **3日前から**。通知設定画面の実装時にユーザー設定値へ差し替える。
- [x] **表の初期並び順** → **保管場所ごとにまとめ、グループ内は期限が近い順**。
      保管場所（セクション）の順序は在庫データの初出順。
- [x] **数量の単位** → **数値のみ**を表示する（単位マスタは要件に存在しないため型にも持たない）。
- [x] **メモ列** → 一覧には**表示しない**。
- [x] **既存ファイルの削除** → `InventoryCard` / `InventoryList` / `groupeInventories`
      （およびそのテスト）を**削除する**。保管場所グルーピングは `groupInventories.ts` として作り直す。

### 今後のタスクへ持ち越す事項（本スコープ外）

- 保管場所セクションの表示順は、保管場所マスタ（要件 5-3）実装時にマスタの並び順へ差し替える
- 期限間近のしきい値は、通知設定画面（要件 5-6）実装時にユーザー設定値へ差し替える
