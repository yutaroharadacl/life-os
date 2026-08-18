# 詳細設計書：通知設定機能

| 項目       | 内容                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------- |
| 対象要件   | 要件定義書「5-6. 消費期限管理・通知機能」（通知タイミング設定の部分）、画面要件 No.5 通知設定画面 |
| タスクID   | なし（`docs/tasks.md` 未作成）                                                            |
| 作成日     | 2026-08-18                                                                                |
| ステータス | 実装済み（2026-08-18）                                                                    |

---

## 1. 概要

要件定義書 5-6 は次を求めている。

- 消費期限が近づいたらプッシュ通知で知らせる
- 通知タイミングはアプリ全体で一律設定（例：「◯日前」をユーザーが数値で設定可能）
- 個別（食品ごと）の通知設定はフェーズ2の拡張候補（今回対象外）
- 期限切れの食品は一覧上で警告表示する（**在庫一覧機能で実装済み。今回のスコープ外**）

本機能が実際に作るのは「通知タイミング（◯日前）を設定する画面」（画面要件 No.5）のみ。
プッシュ通知の配信自体は Go バックエンド・配信基盤が未着手のため実装しない。

**在庫一覧の警告表示ロジックとの関係（重要な設計判断）**：
`src/features/inventory/utils/expiration.ts` の `WARNING_THRESHOLD_DAYS`（現在 3 日固定）には
「通知設定画面（要件 5-6）の実装時にユーザー設定値へ差し替える暫定値」という既存コメントが残っている。
これを踏まえ、本設計では**設定した日数を在庫一覧の「期限間近」判定のしきい値として実際に反映させる**
（プッシュ通知配信自体は無くても、一覧の警告表示という形でユーザーが設定の効果を確認できるようにする）。
この方針は「10. 未決事項・確認事項」で確認を取ってから確定する。

## 2. スコープ

### やること

- 通知設定画面（`/notifications`）で、通知タイミング（◯日前、1〜90 の整数）を表示・変更・保存する
- 保存した日数を在庫一覧（`/inventory/lists`）の「期限間近」警告表示のしきい値に反映する
  （`expiration.ts` の固定値 3 日をユーザー設定値に差し替える）
- 在庫一覧画面から通知設定画面への導線を追加する（マスタ管理と同じ並びに置く）
- 入力値の必須・整数・範囲チェック

### やらないこと

- プッシュ通知の実配信（Service Worker・通知権限リクエスト・配信サーバー等）。Go バックエンドと
  配信基盤が未着手のため対象外
- 個別（食品ごと）の通知タイミング設定。要件定義書がフェーズ2の拡張候補としている
- 期限切れ（赤色）表示ロジックの変更。期限切れは「期限日を過ぎているか」だけで決まり、
  通知タイミングの設定値とは無関係のため、今回の変更対象外（`expired` 判定は現状のまま）
- 設定値の永続化（Go バックエンドでの保存）。今回もモックで完結し、ページを離れると
  入力内容は失われ、既定値（3日）に戻る（他機能と同じ制約。「10. 未決事項」参照）

---

## 3. 画面・UI 仕様

対象画面：画面要件 No.5 通知設定画面

### 画面構成

- ルート: `/notifications`
- 見出し「通知設定」
- 入力欄1つ（通知タイミング。単位「日前」）と「保存する」ボタンのみのシンプルな画面
- 保存に成功すると画面上部にフラッシュメッセージを表示する（既存の在庫一覧・マスタ管理と同じパターン）

在庫一覧画面（`/inventory/lists`）のヘッダ操作エリア（「マスタ管理」リンクの隣）に、
通知設定画面へのリンクを追加する。

### 見出し階層

| 画面 | 見出しテキスト | レベル | 備考 |
| ---- | -------------- | ------ | ---- |
| `/notifications` | 通知設定 | `<h1>` | この画面の主見出し |

### 状態

| 状態                 | 表示内容                                                             |
| -------------------- | ------------------------------------------------------------------- |
| 初期表示             | `getNotificationSettings()` の現在値（既定 3 日）を入力欄に表示      |
| バリデーションエラー | 入力欄の下にエラーメッセージ（必須・整数・範囲）を表示し、保存は成立しない |
| 保存中               | ボタンが「保存中…」表示になり操作不可                                 |
| 保存成功             | 画面上部に「通知設定を保存しました」を表示                            |

### 操作と遷移

- `/inventory/lists` のリンク「通知設定」を押す → `/notifications` に遷移
- 入力欄に日数を入力して「保存する」を押す → バリデーションOKなら保存完了メッセージを表示／
  NGならエラー表示のままとどまる
- 保存した日数は、`/inventory/lists` に戻ったときの「期限間近」警告のしきい値として使われる
  （ただし本機能はモックのため、ページを離れると設定値そのものは失われ既定値の3日に戻る。
  「2. スコープ／やらないこと」参照）

---

## 4. データ・型定義

```ts
// src/shared/types/index.ts に追加
// inventory feature（警告表示のしきい値として）・notification feature（設定画面の対象データとして）
// の両方から参照されるため shared に置く

/** 通知設定。今回は通知タイミングの1項目のみ */
export type NotificationSettings = {
  /** 期限の何日前から「期限間近」として警告・通知するか */
  warningThresholdDays: number;
};
```

> `notification` feature 固有の型は追加しない。`NotificationSettingsView` は入力欄が1項目のみのため、
> `MasterItemForm`（`master` feature）が単一の名称フィールドを生の `string` の `useState` で扱っているのと
> 同じ方針で、`warningThresholdDays` の入力値も専用の型を起こさず生の `string` で扱う（実装レビューで
> 未使用の型が残っていた点を是正し、設計書もこれに合わせて更新した）。

- 要件定義書との対応：5-6「通知タイミングはアプリ全体で一律設定（例：「◯日前」をユーザーが数値で設定可能）」が
  `NotificationSettings.warningThresholdDays` に対応する

---

## 5. コンポーネント設計

### 配置方針

- 設定画面（読み取り・書き込みの UI）は新規 `notification` feature に置く
- `NotificationSettings` 型と読み取り専用の `getNotificationSettings` は、`inventory` feature
  （警告表示のしきい値として読む）・`notification` feature（設定画面の対象データとして読む）の
  両方から参照するため `src/shared/` に置く（`master-management.md` で確立した方針を踏襲）
- 更新用のモック関数 `updateNotificationSettings` は `notification` feature からしか呼ばれないため
  feature 内に閉じる
- `inventory` feature 側は、警告のしきい値を固定値からパラメータへ変更する最小限の変更にとどめる
  （`expiration.ts` に第3引数を追加し、省略時は現行と同じ 3 日をデフォルトにすることで、
  既存の呼び出し・既存のテストを壊さない）

### 新規／変更するファイル

#### `shared`

| ファイルパス                                | 新規/変更 | 責務                                             |
| ---------------------------------------------- | --------- | -------------------------------------------------- |
| `src/shared/types/index.ts`                    | 変更      | `NotificationSettings` を追加                      |
| `src/shared/api/getNotificationSettings.ts`    | 新規      | 通知設定の取得（モック）。既定値 `{ warningThresholdDays: 3 }` を返す |

#### `notification`（新設 feature）

| ファイルパス                                                                              | 新規/変更 | 責務                                                                 |
| --------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------- |
| `src/features/notification/utils/validateNotificationSettingsForm.ts`                         | 新規      | 通知タイミングの必須・整数・範囲チェック                               |
| `src/features/notification/utils/validateNotificationSettingsForm.test.ts`                    | 新規      | 上記のテスト                                                          |
| `src/features/notification/api/updateNotificationSettings.ts`                                 | 新規      | 通知設定の更新（モック）。将来の `PUT /api/notification-settings` の差し替え点 |
| `src/features/notification/api/updateNotificationSettings.test.ts`                            | 新規      | 上記のテスト                                                          |
| `src/features/notification/components/NotificationSettingsView/NotificationSettingsView.tsx`  | 新規      | 通知設定画面（画面5）そのもの。見出し・入力欄・保存ボタン・完了メッセージを1コンポーネントで完結させる（一覧やモーダルが無い単一項目の設定画面のため、他機能のような Form/FormModal/List の分割はしない） |
| `.../NotificationSettingsView.module.scss`                                                    | 新規      | 上記のスタイル                                                         |
| `.../index.ts`                                                                                 | 新規      | バレル export                                                         |
| `.../NotificationSettingsView.test.tsx`                                                        | 新規      | 上記のテスト                                                          |

#### `app`

| ファイルパス                     | 新規/変更 | 責務                                                                    |
| ----------------------------------- | --------- | -------------------------------------------------------------------------- |
| `src/app/notifications/page.tsx`    | 新規      | 画面5。`getNotificationSettings()`（`@/shared/api`）を取得し `NotificationSettingsView` に渡す |

#### `inventory`（既存・変更）

| ファイルパス                                                                       | 新規/変更 | 内容                                                                                     |
| -------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------ |
| `src/features/inventory/utils/expiration.ts`                                           | 変更      | `getExpirationInfo` に第3引数 `warningThresholdDays?: number`（省略時 3）を追加し、固定値の代わりに使う |
| `src/features/inventory/utils/expiration.test.ts`                                      | 変更      | 第3引数を指定したときの挙動のテストを追加（既存ケースは変更しない）                        |
| `src/features/inventory/components/InventoryTable/InventoryTable.tsx`                  | 変更      | `warningThresholdDays?: number`（省略時 3）を Props に追加し `getExpirationInfo` に渡す    |
| `src/features/inventory/components/InventoryTable/InventoryTable.test.tsx`             | 変更      | 上記のテストを追加                                                                          |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.tsx`          | 変更      | `warningThresholdDays?: number`（省略時 3）を Props に追加して `InventoryTable` に橋渡し ＋ 「通知設定」リンクをヘッダ操作エリアに追加 |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.module.scss`  | 変更      | 「通知設定」リンクも「マスタ管理」リンクと同じ見た目にするため、既存クラス `.masterLink` をそのまま再利用する。専用の見た目にする必要は無いため新規クラスは追加しない。ただし1機能専用に見えるクラス名だったため `.navLink` にリネームする（実装レビューで指摘・是正） |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.test.tsx`     | 変更      | 上記のテストを追加                                                                          |
| `src/app/inventory/lists/page.tsx`                                                      | 変更      | `getNotificationSettings()`（`@/shared/api`）を取得し `warningThresholdDays` を `InventoryListsView` に渡す |

> ここに列挙されていないファイルを実装時に勝手に増やさない。必要になったら本設計書を先に更新する。

### 階層図

```
src/shared/
├── types/index.ts        （追加: NotificationSettings）
└── api/
    └── getNotificationSettings.ts

/notifications (app/notifications/page.tsx)
└── NotificationSettingsView ('use client', features/notification)

/inventory/lists (page.tsx、既存・変更)
└── InventoryListsView（既存・変更）
    ├── (追加) 通知設定へのリンク
    └── InventoryTable（既存・変更。warningThresholdDays を受け取り getExpirationInfo に渡す）
```

### Props

```ts
// NotificationSettingsView
type Props = {
  /** 初期表示する通知タイミング（日）。省略時は 3 */
  initialWarningThresholdDays?: number;
};

// InventoryTable（追加分のみ）
type Props = {
  // ...既存 Props
  /** 「期限間近」警告のしきい値（日）。省略時は 3（現行の固定値と同じ） */
  warningThresholdDays?: number;
};

// InventoryListsView（追加分のみ）
type Props = {
  // ...既存 Props
  warningThresholdDays?: number;
};
```

```ts
// expiration.ts（変更箇所のみ）
export const getExpirationInfo = (
  inventory: Inventory,
  today?: Date,
  warningThresholdDays?: number, // 省略時 3
) => ExpirationInfo;
```

---

## 6. 状態管理・データフロー

- **Server / Client 分担**：`app/notifications/page.tsx` は Server Component（`getNotificationSettings()` を
  `@/shared/api` から呼ぶだけ）。`NotificationSettingsView` が `'use client'` の起点
- **サーバー状態**：TanStack Query は未導入のまま。`NotificationSettingsView` の `useState` がその場の唯一の状態源
- **クライアント状態**：Zustand は使わない（ページを跨いで保持すべき状態が無いため）
- **レンダリング戦略**：通知設定の表示・保存は日時・リクエスト情報に依存しないため、`/notifications` は
  既定の静的プリレンダリングのままでよい（`dynamic = 'force-dynamic'` は不要）。
  `/inventory/lists` は既存どおり `dynamic = 'force-dynamic'` を維持する（「残り日数」表示のため。変更なし）
- **データの流れ**：
  1. `/notifications` を開く → `getNotificationSettings()` の現在値（既定 3）が入力欄の初期値になる
  2. 入力して「保存する」→ バリデーションOKなら `updateNotificationSettings({ warningThresholdDays })` を呼び、
     完了メッセージを表示する（一覧側の state を直接更新するような橋渡しは無い。別ページ・別状態のため）
  3. `/inventory/lists` を開く（開き直す）たびに、`app/inventory/lists/page.tsx` が
     `getNotificationSettings()` を呼び直し、その時点の値（モックのため常に既定の3）を
     `InventoryListsView` → `InventoryTable` → `getExpirationInfo` に橋渡しする

---

## 7. API 仕様

> Go バックエンドは未着手。現段階はモック実装だが、将来の API 契約を見据えて入出力を定義する。

| メソッド | パス                         | 用途           |
| -------- | ---------------------------- | -------------- |
| GET      | `/api/notification-settings` | 通知設定取得（既存の `getNotificationSettings` が対応） |
| PUT      | `/api/notification-settings` | 通知設定更新   |

### リクエスト / レスポンス

```ts
// GET /api/notification-settings
// Response: 200 OK, { warning_threshold_days: number }

// PUT /api/notification-settings
// Request: { warning_threshold_days: number }
// Response: 200 OK, { warning_threshold_days: number }
```

### 現段階のモック実装

- 配置先: `src/shared/api/getNotificationSettings.ts`（読み取り）、
  `src/features/notification/api/updateNotificationSettings.ts`（更新）
- `getNotificationSettings()` は `{ warningThresholdDays: 3 }` を固定で返す
- `updateNotificationSettings(settings)` は受け取った値をそのまま返すだけ（`updateInventory` 等と同じく
  実際には永続化しない）
- 対象データが1レコードのみ（ユーザー単位の設定であり ID を持たない）のため、
  `createMasterItem` 等と異なり ID 採番ロジックは無い

---

## 8. バリデーション・エラーハンドリング

| 対象               | ルール                     | エラーメッセージ（日本語）                     |
| ------------------ | -------------------------- | -------------------------------------------------- |
| 通知タイミング     | 必須                       | `通知タイミングを入力してください`                  |
| 通知タイミング     | 整数のみ（符号・小数不可） | `通知タイミングは整数で入力してください`            |
| 通知タイミング     | 1以上90以下                | `通知タイミングは1以上90以下で入力してください`     |

- `validateNotificationSettingsForm(warningThresholdDays)`（`src/features/notification/utils/`）に集約する
- 上限90日は要件に明記が無いため実装上の妥当な上限として設定する（「10. 未決事項」参照）

---

## 9. テスト観点

> このセクションが `unit-test-writer` の入力になる。抽象的に書かず、
> 「入力 → 期待される結果」が読み取れる粒度で書くこと。

### 正常系

- [ ] `/notifications` にアクセスすると入力欄に既定値の `3` が表示される
- [ ] 入力欄の値を `5` に変更して「保存する」を押すと「通知設定を保存しました」が表示される
- [ ] 保存中はボタンが「保存中…」表示になり、キャンセル相当の操作がなく保存ボタンのみ無効化される
- [ ] 在庫一覧画面（`/inventory/lists`）に「通知設定」へのリンクが表示され、`/notifications` を指す
- [ ] `InventoryTable` に `warningThresholdDays={7}` を渡すと、期限が7日後の在庫が `warning`（あと7日）になる
- [ ] `InventoryTable` に `warningThresholdDays` を渡さないとき、期限が3日後の在庫が `warning` になる（既存の既定値の回帰確認）
- [ ] `getExpirationInfo` に `warningThresholdDays=7` を渡すと、期限が7日後の在庫が `warning` になる（既定の3日なら `normal` になるはずの日数で確認する）
- [ ] `getExpirationInfo` の第3引数を省略すると、これまでどおり3日以内が `warning` になる（回帰確認）

### 異常系

- [ ] 入力欄を空にして「保存する」を押すと「通知タイミングを入力してください」が表示され保存されない
- [ ] 入力欄に `0` を入れて保存すると「通知タイミングは1以上90以下で入力してください」が表示され保存されない
- [ ] 入力欄に `91` を入れて保存すると「通知タイミングは1以上90以下で入力してください」が表示され保存されない
- [ ] 入力欄に `1.5` を入れて保存すると「通知タイミングは整数で入力してください」が表示され保存されない

### 境界値

- [ ] 入力欄に `1` を入れて保存するとエラーにならない
- [ ] 入力欄に `90` を入れて保存するとエラーにならない
- [ ] 期限が警告しきい値ちょうどの日数（例: `warningThresholdDays=7` で期限が7日後）のとき `warning` になる
- [ ] 期限がしきい値+1日後（例: `warningThresholdDays=7` で期限が8日後）のとき `normal` になる
- [ ] `expired`（期限切れ・赤色）判定は `warningThresholdDays` の値に関わらず変化しない（期限日を過ぎているかだけで決まる）

---

## 10. 未決事項・確認事項

> 設計時に判断できなかったことを勝手に決めず、ここに挙げてユーザーに確認する。
> **すべて解決してから実装フェーズに進む。**

- [x] **通知タイミング設定値と在庫一覧の警告表示（オレンジ色「期限間近」）の連動**：
      設定した日数を実際に在庫一覧の「期限間近」判定のしきい値として反映させる。
      → ユーザー承認済み（2026-08-18）
- [x] **設定値の永続化方法**：他機能（在庫・カテゴリ・保管場所）と同様、ページ単位のモック state
      （リロード・ページ遷移で既定値の3日に戻る）とする。→ ユーザー承認済み（2026-08-18）
- [x] **入力可能範囲**：1〜90日を妥当な範囲として実装する。→ ユーザー承認済み（2026-08-18）
