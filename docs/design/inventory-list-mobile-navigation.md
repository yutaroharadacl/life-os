# 詳細設計書：在庫一覧画面のモバイル向けナビゲーション再構成

| 項目       | 内容                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------ |
| 対象要件   | 要件定義書「5-4. 在庫一覧・検索機能」「7. 非機能要件（ユーザビリティ・マルチデバイス対応）」「8. 画面要件 No.1, No.4, No.5」 |
| タスクID   | なし（`docs/tasks.md` 未作成）                                                              |
| 作成日     | 2026-08-18                                                                                  |
| ステータス | 実装済み（2026-08-18）                                                                      |

---

## 1. 概要

本サービスは**スマートフォンでの閲覧を前提**とする（要件定義書「4. 利用者」「7. 非機能要件」）。
現状の在庫一覧画面（`/inventory/lists`）は、検索・絞り込み・並び替えの UI（`InventoryFilterBar`）が常時展開表示されており、
また「マスタ管理」「通知設定」への導線がテーブルヘッダに常設されているため、スマホの縦スペースを圧迫している。

本設計では、ユーザー指定の3点を対象に画面構成を見直す。

1. 検索・絞り込み・並び替え UI の常時表示をやめ、開閉可能なパネルにする
2. 「マスタ管理」「通知設定」への導線を、新設するハンバーガーメニューへ移動する
3. 保管場所（すべて／冷蔵庫／冷凍庫 など）で表示を切り替えられるタブ UI を追加する

在庫一覧・検索・絞り込み・並び替え自体の**ロジック**（[inventory-search-filter.md](inventory-search-filter.md)）は変更しない。
本設計は既存のロジックはそのままに、**UI の配置と開閉構造だけを再構成**するものである。

## 2. スコープ

### やること

- `InventoryFilterBar` を開閉可能なパネルにする（初期状態は閉じている）。対象はキーワード・カテゴリ・並び替え・クリア操作
- `InventoryFilterBar` から保管場所の絞り込み（`<select>`）を削除し、代わりに保管場所タブ（新規 `InventoryStorageTabs`）に統合する
- 保管場所タブ（「すべて」＋保管場所マスタの各名称）を新設し、常時表示する（開閉パネルの対象外）
- サイト共通のヘッダ（新規 `AppHeader`）を追加し、ハンバーガーボタンから開くメニューに「マスタ管理」「通知設定」への導線を移す（あわせて「在庫一覧」への導線も設ける）
- `AppHeader` はルートレイアウト（`src/app/layout.tsx`）に配置し、全画面（在庫一覧・マスタ管理・通知設定）で共通にする
- 上記に伴い、`InventoryTable` のヘッダ部（アクション領域）から「マスタ管理」「通知設定」リンクを削除する（「在庫を登録」ボタンは残す）

### やらないこと

- 絞り込み・並び替えの**ロジック**（`filterInventories` / `sortInventories` / `useInventoryFilterStore` の中身）の変更
- 保管場所タブ選択時のサーバーサイド絞り込み（Go バックエンド未着手のため、既存どおりクライアント側の配列操作）
- 開閉状態・選択中タブの永続化（`localStorage` 等）。画面を離れると初期状態に戻る
- カテゴリ・保管場所マスタ自体の追加・編集・削除（要件 5-2 / 5-3、別タスク）
- ヘッダーへの検索窓の追加、通知バッジ表示などの新機能
- ダークモード・カラーテーマの変更（既存の CSS カスタムプロパティをそのまま使う）
- PC 表示時のレイアウト最適化（サービスはスマホ前提のため、既存のタブレット以上ブレークポイント (600px) の踏襲に留める）

---

## 3. 画面・UI 仕様

対象画面: 要件定義書「8. 画面要件」No.1 在庫一覧画面（ホーム）、および No.4 マスタ管理画面・No.5 通知設定画面への導線（ヘッダは全画面共通）

### 画面構成

- 画面名 / ルート: 在庫一覧画面 / `/inventory/lists`（**ルートの追加なし**）
- ヘッダはルートレイアウトに追加するため、`/master`・`/master/categories`・`/master/storage-locations`・`/notifications` にも表示される

| 要素                     | 役割                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `AppHeader`（全画面共通） | アプリ名表示（見出しではない。`/inventory/lists` へのリンク）＋ハンバーガーボタン。押すとメニューが開く |
| ハンバーガーメニュー      | 「在庫一覧」「マスタ管理」「通知設定」への導線（`<dialog>` によるボトムシート）             |
| 保管場所タブ              | 「すべて」＋保管場所マスタの各名称。選択中の保管場所のみ一覧に表示する                     |
| 絞り込みトグルボタン      | 押すと `InventoryFilterBar`（キーワード・カテゴリ・並び替え・クリア）の開閉を切り替える     |
| `InventoryFilterBar`     | 既存。保管場所 `<select>` を削除。開閉パネルの中身になる                                    |
| 「在庫を登録」ボタン      | 既存。変更なし（`InventoryTable` のアクション領域に残す）                                  |
| 在庫テーブル              | 既存 `InventoryTable`。絞り込み・並び替え後の配列を受け取って描画（変更なし）              |

### 見出し階層

**必ず埋めること。** `AppHeader` のアプリ名表示は見出しタグを使わない（1ページに `<h1>` が複数になるのを避けるため）。
ハンバーガーメニューの `<dialog>` は `InventoryFormModal` と同じ扱いで `<h2>` を使う（既存の `InventoryFormModal` も同様に、ページの `<h1>` とは独立してモーダル内で `<h2>` を使っている前例に倣う）。

| 見出しテキスト           | レベル | 備考                                                                 |
| -------------------------- | ------ | ---------------------------------------------------------------------- |
| （アプリ名。例:「在庫管理」） | なし   | `AppHeader` 内。見出しタグは使わず `<Link href="/inventory/lists">` として表示する（在庫一覧に戻る導線を兼ねる） |
| 在庫一覧                    | `<h1>` | 既存のまま。`InventoryTable` 内（変更なし）                            |
| 保管場所名                  | `<h2>` | 既存のまま。`InventoryTable` 内、保管場所ごとのセクション（変更なし）  |
| メニュー                    | `<h2>` | ハンバーガーメニューの `<dialog>` のタイトル（`aria-labelledby` で紐付け） |

### 状態

| 状態                             | 表示内容                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| 初期表示                          | ハンバーガーメニュー: 閉。絞り込みパネル: 閉。保管場所タブ: 「すべて」が選択された状態          |
| ハンバーガーメニュー展開中         | 画面下からシートが立ち上がり、「在庫一覧」「マスタ管理」「通知設定」のリンクが表示される（背景は不活性化） |
| 絞り込みパネル展開中               | キーワード欄・カテゴリ選択・並び替え選択・クリアボタンが表示される                              |
| 保管場所タブで「すべて」以外を選択 | 選択した保管場所の在庫のみが一覧に表示される（既存の `storage` 絞り込みと同じ挙動）             |
| 0件（該当保管場所に在庫なし）      | 既存の「該当する在庫が見つかりません。」／「登録されている在庫はありません。」の出し分けを踏襲 |
| エラー                            | 発生しない（すべてクライアント側の状態操作）                                                    |

### 操作と遷移

| ユーザー操作                                     | 起きること                                                                                     | 遷移先 |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------ |
| ハンバーガーボタンを押す                          | メニューシートが開く                                                                             | なし   |
| アプリ名（ブランド表示）を押す                    | `/inventory/lists` へ遷移する                                                                     | `/inventory/lists` |
| メニュー内の「在庫一覧」を押す                    | メニューが閉じ、`/inventory/lists` へ遷移する                                                     | `/inventory/lists` |
| メニュー内の「マスタ管理」を押す                  | メニューが閉じ、`/master` へ遷移する                                                              | `/master` |
| メニュー内の「通知設定」を押す                    | メニューが閉じ、`/notifications` へ遷移する                                                       | `/notifications` |
| メニューの背景（`::backdrop`）をクリック / ESC     | メニューが閉じる（`InventoryFormModal` と同じ挙動）                                               | なし   |
| 絞り込みトグルボタンを押す                        | `InventoryFilterBar` の開閉が切り替わる                                                          | なし   |
| 保管場所タブを選ぶ                                | `useInventoryFilterStore` の `storage` が更新され、一覧が即時に絞り込まれる                       | なし   |
| 「すべて」タブを選ぶ                              | `storage` が空文字に戻り、全保管場所がグルーピング表示される（既存の初期状態と同じ）              | なし   |

**画面遷移はメニューのリンク以外は発生しない**（ハンバーガーボタン・トグルボタン・タブはルーターを触らない）。

### レスポンシブ

モバイルファースト。本画面変更はスマホでの縦スペース節約が主目的のため、タブレット以上でも同じ開閉挙動を維持する（PC 用の別レイアウトは設けない）。

- 保管場所タブ・絞り込みトグルボタンは横幅いっぱいに配置し、タブが収まらない場合は横スクロール（`overflow-x: auto`。既存 `InventoryTable` の `.scroller` と同じ方針）
- ハンバーガーメニューは `InventoryFormModal` と同じく、モバイルでは画面下から立ち上がるシート、600px 以上では中央のカードにする
- タップ領域は既存規約どおり最小44pxを維持する

---

## 4. データ・型定義

新規の型追加・変更はない。既存の以下をそのまま再利用する（`src/features/inventory/types/index.ts`）。

```ts
// 既存（変更なし）
export type InventoryFilterState = {
  keyword: string;
  category: string;
  storage: string; // '' は「すべて」。保管場所タブが setStorage で更新する
  sortOrder: SortOrder;
};
```

`storage: ''`（＝「すべて」）という既存の値のあつかいを、保管場所タブの「すべて」に転用する（`InventoryFilterBar` の
保管場所 `<select>` が担っていた役割をそのままタブに移すだけで、状態の形は変えない）。

### 要件定義書「6. データ要件」との対応

本設計は既存データ型を変更しない。UI 配置の変更のみのため対応表は該当なし。

---

## 5. コンポーネント設計

### 既存コードの再利用

| 再利用するもの                                   | 用途                                                                                     |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `useInventoryFilterStore`（`storage` / `setStorage`） | 保管場所タブの選択状態の読み書き。ストア自体の変更は不要                                   |
| `InventoryFilterBar` の既存フィールド（キーワード・カテゴリ・並び替え・クリア） | 中身は流用し、保管場所 `<select>` の削除と開閉ラッパーの追加のみ行う                       |
| `<dialog>` による開閉パターン（`InventoryFormModal`） | ハンバーガーメニューの実装に流用（`showModal()` / `close()`、ESC・背景クリックでの close） |
| `InventoryTable`（`groupByStorage` を含む）           | 変更なし。保管場所タブが `storage` を絞り込んだ結果、1グループだけが渡ってくる形で動作する |
| CSS カスタムプロパティ（`--color-*`）                | 新規コンポーネントのスタイルもすべてここから使う。ハードコードしない                       |

### 新規／変更するファイル

| ファイルパス                                                                              | 新規/変更 | 責務                                                                                          |
| --------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------ |
| `src/shared/components/AppHeader/AppHeader.tsx`                                               | 新規      | サイト共通ヘッダ。アプリ名表示（`/inventory/lists` へのリンク）＋ハンバーガーボタン＋メニュー（`<dialog>`、「在庫一覧」「マスタ管理」「通知設定」の3リンク）。`'use client'` |
| `src/shared/components/AppHeader/AppHeader.module.scss`                                       | 新規      | ヘッダ・ハンバーガーボタン・メニューシートのスタイル                                            |
| `src/shared/components/AppHeader/index.ts`                                                    | 新規      | バレル                                                                                           |
| `src/shared/components/AppHeader/AppHeader.test.tsx`                                          | 新規      | ハンバーガー開閉・リンク遷移のテスト                                                            |
| `src/features/inventory/components/InventoryStorageTabs/InventoryStorageTabs.tsx`             | 新規      | 保管場所タブ（「すべて」＋保管場所マスタ）。`useInventoryFilterStore` を直接参照。`'use client'` |
| `src/features/inventory/components/InventoryStorageTabs/InventoryStorageTabs.module.scss`     | 新規      | タブのスタイル（横スクロール対応含む）                                                          |
| `src/features/inventory/components/InventoryStorageTabs/index.ts`                             | 新規      | バレル                                                                                           |
| `src/features/inventory/components/InventoryStorageTabs/InventoryStorageTabs.test.tsx`        | 新規      | タブ表示・選択・ストア連携のテスト                                                              |
| `src/app/layout.tsx`                                                                           | 変更      | `<AppHeader />` を `{children}` の前に追加                                                       |
| `src/features/inventory/components/InventoryFilterBar/InventoryFilterBar.tsx`                 | 変更      | 保管場所 `<select>` を削除。開閉トグルボタンを追加し、既存フィールドを開閉パネル内に移す         |
| `src/features/inventory/components/InventoryFilterBar/InventoryFilterBar.module.scss`         | 変更      | 開閉トグルボタン・パネルのスタイル追加。保管場所フィールド分のスタイルを削除                     |
| `src/features/inventory/components/InventoryFilterBar/InventoryFilterBar.test.tsx`            | 変更      | 保管場所 `<select>` のテストを削除。フィールド系のテストはパネルを開いてから行うよう更新。開閉トグルのテストを追加 |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.tsx`                 | 変更      | `InventoryTable` の `action` からマスタ管理・通知設定リンクを削除（登録ボタンのみ残す）。`InventoryStorageTabs` を追加。`InventoryFilterBar` への `storageLocations` 受け渡しを廃止 |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.module.scss`         | 変更      | `.navLink` を削除。単一ボタンになった `.actions` のスタイル調整                                 |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.test.tsx`            | 変更      | 「マスタ管理」「通知設定」リンクのテストを削除（`AppHeader.test.tsx` へ移設）。保管場所タブの切り替えテストを追加。既存の絞り込み系テストは、パネルを開く操作を追加 |

`src/app/inventory/lists/page.tsx`・`src/app/master/**`・`src/app/notifications/page.tsx` は変更しない
（`AppHeader` はルートレイアウト経由で自動的に全画面に適用されるため、各 `page.tsx` 側の変更は不要）。

> ここに列挙されていないファイルを実装時に勝手に増やさない。必要になったら本設計書を先に更新する。

### 階層図

```
RootLayout (src/app/layout.tsx)                        … Server Component
├── AppHeader                                            … 'use client'（ハンバーガー開閉のため）
│   └── <dialog>（メニュー: 在庫一覧 / マスタ管理 / 通知設定 リンク）
└── {children}
    └── InventoryLists (src/app/inventory/lists/page.tsx) … Server Component（変更なし）
        └── InventoryListsView                            … 'use client'（既存）
            ├── InventoryStorageTabs                       … 'use client'（新規）useInventoryFilterStore を直接参照
            ├── 絞り込みトグルボタン + InventoryFilterBar    … 'use client'（変更）useInventoryFilterStore を直接参照
            └── InventoryTable                             … 変更なし。絞り込み後の配列を props で受け取る
```

### Props

```ts
// InventoryFilterBar（変更）
type Props = {
  /** 選択肢に出すカテゴリマスタ */
  categories?: Category[];
  // storageLocations は削除（保管場所は InventoryStorageTabs に一本化）
};
```

```ts
// InventoryStorageTabs（新規）
type Props = {
  /** タブに出す保管場所マスタ */
  storageLocations?: StorageLocation[];
};
```

```ts
// AppHeader（新規）
// Props なし（マスタ管理・通知設定のリンク先は固定パスのため受け取る値がない）
```

---

## 6. 状態管理・データフロー

### Server Component / Client Component の分担

- `RootLayout`（`src/app/layout.tsx`）: 引き続き Server Component。`AppHeader` を子として描画するだけ
- `AppHeader`: 新規に `'use client'`。ハンバーガーメニューの開閉に state とブラウザ API（`<dialog>` の `showModal`/`close`）が要る最小の葉コンポーネント
- `InventoryStorageTabs`: 新規に `'use client'`。`useInventoryFilterStore` を直接参照するため
- `InventoryFilterBar`: 既存どおり `'use client'`。開閉状態のローカル `useState` を追加

### サーバー状態

変更なし。`src/app/inventory/lists/page.tsx` が `getInventories()` 等を同期的に呼び、props で渡す既存の流れのまま。

### クライアント状態

- **保管場所タブの選択状態**: 新設せず、既存の `useInventoryFilterStore` の `storage` / `setStorage` をそのまま使う
  （`InventoryFilterBar` の保管場所 `<select>` が持っていた責務をそのまま移すだけで、ストアの形は変えない）
- **絞り込みパネルの開閉状態**: `InventoryFilterBar` 内のローカル `useState<boolean>`（初期値 `false`）。
  絞り込み条件そのものではなく「UI をどう見せるか」の一時状態のため、Zustand ストアには入れない
- **ハンバーガーメニューの開閉状態**: `AppHeader` 内のローカル `useState<boolean>`（初期値 `false`）。
  `InventoryFormModal` と同じ理由で Zustand には入れない（画面をまたいで共有する必要がない一時 UI 状態のため）

### レンダリング戦略

変更なし。`src/app/inventory/lists/page.tsx` の `export const dynamic = 'force-dynamic'` は維持する。
`AppHeader` はルートレイアウトに置くが、日時やリクエストに依存する表示を持たないため、この追加によって
既存ページの静的/動的判定に影響はない。

### データの流れ

```
useInventoryFilterStore（keyword, category, storage, sortOrder）
  ↑ InventoryStorageTabs   … タブ選択のたびに setStorage を呼ぶ（保管場所 select の代替）
  ↑ InventoryFilterBar     … 開いている間、入力・選択のたびに setKeyword/setCategory/setSortOrder を呼ぶ
  ↓ InventoryListsView     … ストアを読み取り
      filterInventories(inventories, { keyword, category, storage })
        → InventoryTable に sortOrder とあわせて渡す（既存のまま）
```

絞り込み・並び替えの計算ロジックは [inventory-search-filter.md](inventory-search-filter.md) から一切変更しない。
本設計が変えるのは「`storage` を誰が更新するか（select → タブ）」と「他のフィールドをどう見せるか（常時 → 開閉式）」のみ。

### 新規登録時に保管場所タブを「すべて」へ戻す挙動について

`InventoryListsView` の `handleSubmit`（新規登録時）は既存実装で `resetFilters()` を呼んでおり、
`resetFilters` は `keyword` / `category` / `storage` をすべて初期値に戻す（`useInventoryFilterStore.ts` 既存実装）。
`storage` は保管場所タブの選択状態そのものであるため、**この既存呼び出しをそのまま使うだけで**
「10. 未決事項」で確定した「登録時に保管場所タブを『すべて』へ自動で戻す」を満たす。
本設計のために `handleSubmit` や `resetFilters` へ新たなロジックを追加する必要はない。

---

## 7. API 仕様

> Go バックエンドは未着手。本設計はクライアント側の UI 再構成のみで、新規エンドポイントは追加しない。

| メソッド | パス                 | 用途                       |
| -------- | ---------------------- | ---------------------------- |
| GET      | `/api/inventories`    | 在庫の一覧取得（既存、変更なし） |
| GET      | `/api/storages`       | 保管場所マスタ取得（既存、変更なし。`InventoryStorageTabs` の選択肢に使う） |

### 現段階のモック実装

- 新規のモック実装は不要。既存の `getStorageLocations`（`src/shared/api/getStorageLocations.ts`）をそのまま
  `InventoryListsView` → `InventoryStorageTabs` に転送する

---

## 8. バリデーション・エラーハンドリング

自由入力やサーバー通信を伴わない UI 再構成のため、新たなバリデーションは発生しない。

| 対象                       | ルール                                                              | 表示                         |
| ---------------------------- | ---------------------------------------------------------------------- | ------------------------------- |
| 保管場所タブ                | `storageLocations` が0件のときは「すべて」タブのみ表示する            | —（クラッシュしない）         |
| ハンバーガーメニュー         | 特になし（リンクのみで入力を伴わない）                                | —                              |
| 絞り込みパネルの開閉         | 特になし（表示/非表示の切り替えのみ）                                 | —                              |

- 通信エラーは発生しない（すべてクライアント側の表示状態操作のため）。

---

## 9. テスト観点

> このセクションが `unit-test-writer` の入力になる。

### `AppHeader`

#### 正常系

- [ ] アプリ名（ブランド表示）がリンクとして表示され `/inventory/lists` を指す
- [ ] ハンバーガーボタンが `getByRole('button')` で取得できる（アクセシブルネームを付与する）
- [ ] 初期状態でメニュー（「在庫一覧」「マスタ管理」「通知設定」リンク）は表示されていない
- [ ] ハンバーガーボタンを押すとメニューが開き、「在庫一覧」（`/inventory/lists` を指す）「マスタ管理」（`/master` を指す）「通知設定」（`/notifications` を指す）のリンクが表示される
- [ ] メニュー内の「マスタ管理」リンクを押すとメニューが閉じる
- [ ] ESC キーでメニューが閉じる（`InventoryFormModal` と同様の `onCancel` 経由）

#### 境界値

- [ ] メニューを開いた状態で再度ハンバーガーボタンを押すと閉じる

### `InventoryStorageTabs`

#### 正常系

- [ ] 「すべて」タブが常に先頭に表示される
- [ ] `storageLocations` の各名称がタブとして表示される
- [ ] 初期状態では「すべて」タブが選択状態（`aria-selected` 等）になっている
- [ ] 保管場所タブを選ぶと `useInventoryFilterStore` の `storage` がその保管場所名に更新される
- [ ] 「すべて」タブを選ぶと `storage` が `''` に戻る

#### 境界値

- [ ] `storageLocations` を省略（既定値 `[]`）すると「すべて」タブのみでクラッシュしない
- [ ] `storage` がストア側で既に特定の保管場所に設定されている状態でマウントすると、対応するタブが選択状態で表示される

### `InventoryFilterBar`（既存テストの更新）

#### 正常系

- [ ] 初期状態ではキーワード欄・カテゴリ選択・並び替え選択が表示されていない（パネルが閉じている）
- [ ] 開閉トグルボタンを押すとキーワード欄・カテゴリ選択・並び替え選択・クリアボタンが表示される
- [ ] 開いている状態でトグルボタンを押すと閉じる（再度押すと非表示になる）
- [ ] 開いた状態でキーワード入力・カテゴリ選択・並び替え選択を行うと、既存どおり `useInventoryFilterStore` が更新される
- [ ] 保管場所の `<select>` は表示されない（`InventoryStorageTabs` に統合されたため）

#### 境界値

- [ ] `categories` を省略しても選択肢が「すべて」のみでクラッシュしない（パネルを開いた状態で確認）

### `InventoryListsView`（既存テストの更新）

#### 正常系

- [ ] 「マスタ管理」「通知設定」へのリンクは表示されない（`AppHeader` に移動したため、このコンポーネント単体のテストからは削除）
- [ ] 保管場所タブが表示されている
- [ ] 保管場所タブで特定の保管場所を選ぶと、その保管場所の在庫のみが表示される
- [ ] 「すべて」タブに戻すと全保管場所の在庫が再びグルーピング表示される
- [ ] 絞り込みパネルを開いてから行う既存の検索・絞り込み・並び替え・クリアの振る舞いは変わらない（パネルを開く操作を各テストに追加）

#### 境界値

- [ ] 保管場所タブで特定の保管場所（例: 冷蔵庫）を選択中に、別の保管場所（例: 冷凍庫）で在庫を新規登録すると、
      保管場所タブが「すべて」に自動で戻り、登録した在庫が一覧に表示される
      （既存の `resetFilters` が `storage` も初期化する挙動をそのまま利用する）

---

## 10. 未決事項・確認事項

未決事項はすべて解決済み（2026-08-18 ユーザー確認）。

- [x] **ハンバーガーメニューの中身とブランド表示** → **アプリ名表示＋在庫一覧への導線あり**。
      ヘッダーにアプリ名（例:「在庫管理」）を表示し、押すと在庫一覧（`/inventory/lists`）に戻る。
      ハンバーガーメニューには「マスタ管理」「通知設定」に加えて「在庫一覧」も追加し、3項目にする
      （マスタ管理・通知設定のサブ画面からも在庫一覧へ戻れるようにするため）。
- [x] **保管場所タブ選択時の `InventoryTable` の保管場所見出し（`<h2>`）の扱い** → **変更しない（そのまま表示する）**。
      `InventoryTable` には手を入れず、タブの選択表示と見出しの重複は許容する。
- [x] **絞り込みパネルの開閉トグルボタンの見た目** → **テキストボタンのみ**（例:「絞り込み・並び替え」）。
      適用中インジケーター（バッジ等）は本スコープでは追加しない。
- [x] **保管場所タブ選択中に新規登録した場合の挙動** → **「すべて」に自動で戻す**。
      既存仕様（キーワード・カテゴリ絞り込みは登録時に自動クリアされる）と同じ考え方に揃え、
      登録直後は必ず新しい在庫が一覧に見える状態にする。
