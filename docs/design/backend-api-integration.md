# 詳細設計書：バックエンドAPI接続（在庫・マスタの永続化）

| 項目       | 内容                                      |
| ---------- | ----------------------------------------- |
| 対象要件   | 要件定義書「6. データ要件」「9. 制約条件（データ消失なし）」 |
| タスクID   | `docs/tasks.md` の T-08                   |
| 作成日     | 2026-08-20                                |
| ステータス | 実装済み（2026-08-20）                    |

> このテンプレートの全セクションを埋めること。該当なしの場合も「なし」と明記し、セクションごと削除しない。
> `design-impl-reviewer` はこの構造を前提に実装と突合する。

---

## 1. 概要

`../backend`（Go + PostgreSQL）に在庫・カテゴリマスタ・保管場所マスタの CRUD API が実装済みになった。
本タスクは `src/features/*/api/`・`src/shared/api/` のモック実装を、この Go バックエンドへの実際の接続に置き換える。

ユーザー指示により、フロントエンドの API 層を **BFF（Backend for Frontend）** として設計する。
Go バックエンドには CORS 設定が存在せずブラウザから直接叩くと失敗すること、また Go のURLをクライアントに
露出させないことの2点から、**ブラウザは Go バックエンドに直接アクセスしない**。かわりに：

- **読み取り（一覧取得）**: Server Component（`page.tsx`）がサーバー側で Go バックエンドへ直接 `fetch` する
  （Server Component はサーバー上でしか実行されないため、これ自体が BFF の役割を果たす。CORS の制約も受けない）。
- **書き込み（登録・更新・削除）**: ブラウザ上のクライアントコンポーネントから、同一オリジンの
  Next.js Route Handler（`src/app/api/**/route.ts`）を叩く。この Route Handler がサーバー側で
  Go バックエンドを呼び出す、狭義の BFF プロキシとして働く。

対象は在庫（`features/inventory`）・カテゴリマスタ・保管場所マスタ（`features/master` + `shared/api`）。
通知設定（`features/notification`）は Go バックエンドに API が存在しないため、本タスクでは対象外とし、
引き続きモックのままとする（「2. スコープ／やらないこと」参照）。

`docs/tasks.md` の T-08 は「TanStack Query を初めて実際に使う」ことも要件としている。今回は
**書き込み（登録・更新・削除）のミューテーションにのみ TanStack Query の `useMutation` を使う**。
一覧の読み取りは既存どおり Server Component からクライアントコンポーネントへ props で渡す構成を維持し、
`useQuery` は導入しない（ユーザー承認済み。理由は「6. 状態管理・データフロー」参照）。

## 2. スコープ

### やること

- 在庫の一覧取得・登録・更新・削除を Go バックエンド（`POST/GET/PATCH/DELETE /api/inventories`）に接続する
- カテゴリマスタ・保管場所マスタの一覧取得・追加・編集・削除を Go バックエンド
  （`/api/categories`、`/api/storages`）に接続する
- ブラウザからの書き込みリクエストを中継する Next.js Route Handler（BFF）を新設する
  （`src/app/api/inventories`、`src/app/api/categories`、`src/app/api/storages` 配下）
- 在庫の「カテゴリ名／保管場所名」⇄「カテゴリID／保管場所ID」の変換を BFF 層で行う
  （フロントエンドのドメイン型は名前ベースを維持する。詳細は「4. データ・型定義」）
- TanStack Query の `QueryClientProvider` をアプリ全体に配線する（`src/app/layout.tsx`）
- 在庫登録・編集フォーム、マスタ項目登録・編集フォームの送信、削除操作を非同期化し、
  通信失敗時にエラーメッセージを表示する
- 一覧取得・マスタ取得を行う `page.tsx` に `export const dynamic = 'force-dynamic'` を設定する
  （ビルド時の静的化を防ぎ、常に最新のサーバーデータを取得する）

### やらないこと

- 通知設定（`GET/PUT /api/notification-settings`）の接続。Go バックエンドに未実装のため対象外
  （引き続き `src/shared/api/getNotificationSettings.ts` ・
  `src/features/notification/api/updateNotificationSettings.ts` はモックのまま）
- 在庫の「登録日」をレスポンスに含めること。`docs/tasks.md` の T-08 は「登録日をデータモデルに追加する」
  としているが、Go バックエンドの `InventoryResponse`（`inventory-create-api.md` で確定済み）は
  `registered_at` を返さない方針で実装済みのため、本タスクでは追加しない（ユーザー確認済み。
  必要になった場合はバックエンド側の設計変更を伴う別タスクとする）
- 在庫の絞り込み（カテゴリ・保管場所・キーワード）を `GET /api/inventories` のクエリパラメータで
  サーバー側に行わせること。現状どおり一覧を全件取得し、`filterInventories`（クライアント側）で
  絞り込む構成を維持する（名前ベースのドメイン型を維持する方針と整合させるため。「6. 状態管理・
  データフロー」参照）
- 在庫・マスタ項目の型を ID ベースへ変更すること（ユーザー確認済み。「4. データ・型定義」参照）
- 一覧取得に TanStack Query の `useQuery` を導入すること（ユーザー確認済み。「6. 状態管理・
  データフロー」参照）
- 削除操作の確認ダイアログの追加（既存の即時削除の挙動を維持する。要件定義書に確認ダイアログの
  要求なし）
- ページネーション・楽観的更新（optimistic update）。件数規模・要件定義書のいずれにも根拠がないため
- 認証・認可（フェーズ1は対象外。要件定義書「7. 非機能要件」）

---

## 3. 画面・UI 仕様

対象画面は要件定義書「8. 画面要件」No.1（在庫一覧画面）・No.4-1（カテゴリ管理画面）・
No.4-2（保管場所管理画面）。画面構成・見出し階層は既存のまま変更しない
（`docs/design/inventory-list-table.md`・`master-management.md` を参照）。

### 画面構成

変更なし。データの取得元がモックから実 API に変わるのみで、UI 要素の追加・削除はない。

### 見出し階層

変更なし（既存の設計書どおり）。

### 状態

| 状態         | 表示内容 |
| ------------ | -------- |
| 初期表示     | 変更なし（Server Component が取得した一覧を表示） |
| ローディング | 変更なし（Server Component のレンダリング待ちは Next.js 標準の挙動に従う。個別のスケルトン等は追加しない） |
| 0件          | 変更なし |
| エラー（一覧取得） | Server Component 側の `fetch` が失敗した場合は例外を投げ、Next.js の標準エラー画面に委ねる（本タスクでは専用の `error.tsx` を新設しない。要件定義書に個別の要求なし） |
| エラー（登録・更新・削除） | 一覧画面・マスタ管理画面それぞれの既存の完了メッセージ（`role="status"`）と並べて、通信失敗時は `role="alert"` のエラーメッセージを表示する（新規）。登録・編集の場合はモーダルを閉じずに再送信できる状態を保つ |

### 操作と遷移

変更なし。「食品名・数量等を入力して送信する」「一覧の編集・削除ボタンを押す」といった既存の操作は
そのままで、送信先が実 API になるだけ。

### アクセシビリティ（ARIA・キーボード操作）

なし（複合ウィジェットパターンの新規追加はない。エラーメッセージは `role="alert"` のみ追加）。

---

## 4. データ・型定義

### 4.1 在庫ドメイン型：名前ベースを維持する

在庫のカテゴリ・保管場所は、現状フロントエンドでは名前の文字列で保持している
（`Inventory.category` / `Inventory.storage`、絞り込み・フォームの選択値もすべて名前ベース）。
Go バックエンドは `category_id` / `storage_id` を要求するが、この差は **BFF 層（Route Handler）で
名前⇄ID を変換して吸収する**（ユーザー承認済み）。カテゴリ名・保管場所名はバックエンドで
`UNIQUE` 制約により一意なので、名前からIDへの解決は一意に決まる。

`Inventory` / `InventoryDraft` / `InventoryFormValues` などの既存の型は変更しない。

**変更するのは `InventoryResponse` のみ**（Go の実際のレスポンス形状に合わせる）。

```ts
// src/features/inventory/types/index.ts（既存の InventoryResponse を置き換える）

/** 在庫 API のレスポンス（Go バックエンドの InventoryResponse と一致させる） */
export type InventoryResponse = {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  storage_id: string;
  storage_name: string;
  quantity: number;
  expiration_date: string | null;
  purchase_date: string;
  memo: string;
};
```

- 使用箇所: `src/features/inventory/utils/toInventory.ts`（Go レスポンス → `Inventory` への変換）、
  および `src/app/api/inventories/route.ts` / `src/app/api/inventories/[id]/route.ts`
  （Go からのレスポンスをパースする型として）

### 4.2 マスタ項目：どちらのリソースかを表す型を追加する

`MasterItemListView` はカテゴリ・保管場所の両方で共用されるが、実 API 接続にあたり
「カテゴリなのか保管場所なのか」を BFF のどちらのエンドポイントに投げるかの判断に使う情報が
これまで存在しなかった（モックには宛先の区別が不要だったため）。新しい型を追加する。

```ts
// src/shared/types/index.ts に追加

/** マスタ項目の種別。BFF のどのエンドポイント（/api/categories・/api/storages）を使うかを決める */
export type MasterResource = 'category' | 'storage';
```

- 使用箇所: `MasterItemListView` の `resource` Props、
  `createMasterItem` / `updateMasterItem` / `deleteMasterItem`（`features/master/api/`）の第一引数、
  `app/master/categories/page.tsx` / `app/master/storage-locations/page.tsx` から渡す値

### 4.3 共有 fetch ヘルパー

```ts
// src/shared/api/fetchJson.ts

/**
 * fetch を実行し、成功時は JSON をパースして返す。
 * レスポンスが 204（No Content）のときは undefined を返す。
 * 失敗時（res.ok が false）は、ボディの { error: string } を読み取り Error として投げる。
 * 読み取れない場合は既定のメッセージにする。
 */
export const fetchJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  // 実装は「7. API仕様」参照
};
```

- 使用箇所: `backendFetch`（下記）、および `features/inventory/api/` `features/master/api/` の
  各書き込み関数（ブラウザから同一オリジンの BFF を呼ぶときの共通処理として）

```ts
// src/shared/api/backendFetch.ts

/**
 * サーバー側（Server Component・Route Handler）専用。
 * Go バックエンド（BACKEND_API_URL、既定は http://localhost:8080）へ直接 fetch する。
 * 常に最新のデータを取るため cache: 'no-store' を付ける。
 */
export const backendFetch = <T,>(path: string, init?: RequestInit): Promise<T> => {
  // 実装は「7. API仕様」参照
};
```

- 使用箇所: `getInventories` / `getCategories` / `getStorageLocations`
  （Server Component 用の読み取り関数）、`src/app/api/inventories/forwardInventoryRequest.ts`
  （カテゴリ名／保管場所名の解決、Go への書き込み呼び出し）

`BACKEND_API_URL`（既定値付きの環境変数参照）は `backendFetch` ・ `proxyToBackend` ・
`forwardInventoryRequest` の3箇所から共通で使うため、実装時に `src/shared/api/backendApiUrl.ts`
に切り出した（レビュー指摘。既定ポートを変更する際の直し忘れを防ぐ）。

```ts
// src/shared/api/proxyToBackend.ts

/**
 * ブラウザからのリクエストをそのまま Go バックエンドへ中継する（純粋なプロキシ）。
 * リクエストボディ・レスポンスボディの形が Go とフロントエンドで一致しているエンドポイント
 * （カテゴリ・保管場所の追加／編集／削除）にのみ使う。ステータスコードはそのまま転送する。
 */
export const proxyToBackend = (path: string, request: Request): Promise<Response> => {
  // 実装は「7. API仕様」参照
};
```

- 使用箇所: `src/app/api/categories/route.ts`・`src/app/api/categories/[id]/route.ts`・
  `src/app/api/storages/route.ts`・`src/app/api/storages/[id]/route.ts`

### 4.4 在庫レスポンスの変換関数

```ts
// src/features/inventory/utils/toInventory.ts

/** Go バックエンドのレスポンスをフロントエンドのドメイン型に変換する */
export const toInventory = (response: InventoryResponse): Inventory => ({
  id: response.id,
  name: response.name,
  category: response.category_name,
  storage: response.storage_name,
  quantity: response.quantity,
  expirationDate: response.expiration_date,
  purchaseDate: response.purchase_date,
  memo: response.memo,
});
```

- 使用箇所: `getInventories.ts`（一覧の配列変換）、
  `src/app/api/inventories/forwardInventoryRequest.ts`（単体の変換）

---

## 5. コンポーネント設計

### 新規／変更するファイル

| ファイルパス                                              | 新規/変更 | 責務 |
| ----------------------------------------------------------- | --------- | ---- |
| `src/shared/api/fetchJson.ts`                                | 新規      | fetch＋JSONパース＋エラー変換の共通処理 |
| `src/shared/api/fetchJson.test.ts`                            | 新規      | 上記のテスト |
| `src/shared/api/backendApiUrl.ts`                              | 新規      | `BACKEND_API_URL`（既定値付き）の共通参照先。`backendFetch`・`proxyToBackend`・`forwardInventoryRequest` の3箇所が個別に既定値を持っていたのを集約した（レビュー指摘） |
| `src/shared/api/backendFetch.ts`                              | 新規      | Go バックエンドへの直接 fetch（サーバー専用） |
| `src/shared/api/backendFetch.test.ts`                         | 新規      | 上記のテスト |
| `src/shared/api/proxyToBackend.ts`                            | 新規      | Route Handler 用の純粋プロキシ |
| `src/shared/api/proxyToBackend.test.ts`                       | 新規      | 上記のテスト |
| `src/shared/components/QueryProvider/QueryProvider.tsx`       | 新規      | `QueryClientProvider` の配線。スタイルを持たないため `.module.scss` は作らない |
| `src/shared/components/QueryProvider/QueryProvider.test.tsx`  | 新規      | 上記のテスト（`children` をそのまま描画することを確認。レビュー指摘で追加） |
| `src/shared/components/QueryProvider/index.ts`                | 新規      | バレル |
| `src/shared/types/index.ts`                                   | 変更      | `MasterResource` 型を追加 |
| `src/shared/api/getCategories.ts`                              | 変更      | モック配列 → `backendFetch` による実 API 呼び出し（非同期化） |
| `src/shared/api/getCategories.test.ts`                         | 新規      | 上記のテスト（fetch をモック化） |
| `src/shared/api/getStorageLocations.ts`                        | 変更      | 同上 |
| `src/shared/api/getStorageLocations.test.ts`                   | 新規      | 上記のテスト |
| `src/features/inventory/types/index.ts`                       | 変更      | `InventoryResponse` を実際の Go レスポンス形状に更新 |
| `src/features/inventory/utils/toInventory.ts`                 | 新規      | `InventoryResponse` → `Inventory` 変換 |
| `src/features/inventory/utils/toInventory.test.ts`             | 新規      | 上記のテスト |
| `src/features/inventory/api/getInventories.ts`                 | 変更      | モック配列 → `backendFetch` による一覧取得（非同期化） |
| `src/features/inventory/api/getInventories.test.ts`            | 新規      | 上記のテスト |
| `src/features/inventory/api/createInventory.ts`                | 変更      | モック採番 → BFF（`/api/inventories`）への POST |
| `src/features/inventory/api/createInventory.test.ts`           | 変更      | 非同期・fetch モックに書き換え |
| `src/features/inventory/api/updateInventory.ts`                | 変更      | モック → BFF（`/api/inventories/{id}`）への PATCH |
| `src/features/inventory/api/updateInventory.test.ts`           | 変更      | 同上 |
| `src/features/inventory/api/deleteInventory.ts`                 | 変更      | モック（何もしない） → BFF（`/api/inventories/{id}`）への DELETE |
| `src/features/inventory/api/deleteInventory.test.ts`            | 変更      | 同上 |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.tsx` | 変更 | 登録・更新・削除を `useMutation` による非同期処理にし、エラー表示を追加 |
| `src/features/inventory/components/InventoryListsView/InventoryListsView.module.scss` | 変更 | エラーメッセージ用 `.errorFlash` を追加（`.flash` を流用しつつ `color: var(--color-danger)` の差分のみ追加。役割ベースの名前のため既存 `.flash` はリネームしない） |
| `src/features/inventory/components/InventoryFormModal/InventoryFormModal.tsx` | 変更 | `onSubmit` の型を `(draft) => void` → `(draft) => void \| Promise<void>` に変更（`InventoryForm` 側の型と揃える） |
| `src/features/master/api/resourcePath.ts`                       | 新規      | `MasterResource` → BFF パスの対応表 |
| `src/features/master/api/createMasterItem.ts`                    | 変更      | 第一引数に `resource: MasterResource` を追加し、BFF への POST に変更 |
| `src/features/master/api/createMasterItem.test.ts`               | 変更      | 同上 |
| `src/features/master/api/updateMasterItem.ts`                    | 変更      | 第一引数に `resource` を追加し、BFF への PATCH に変更 |
| `src/features/master/api/updateMasterItem.test.ts`               | 変更      | 同上 |
| `src/features/master/api/deleteMasterItem.ts`                     | 変更      | 第一引数に `resource` を追加し、BFF への DELETE に変更 |
| `src/features/master/api/deleteMasterItem.test.ts`                | 変更      | 同上 |
| `src/features/master/components/MasterItemListView/MasterItemListView.tsx` | 変更 | `resource: MasterResource` Props を追加。追加・更新・削除を `useMutation` による非同期処理にし、エラー表示を追加 |
| `src/features/master/components/MasterItemListView/MasterItemListView.module.scss` | 変更 | `.errorFlash` を追加（InventoryListsView と同じ方針） |
| `src/features/master/components/MasterItemFormModal/MasterItemFormModal.tsx` | 変更 | `onSubmit` の型を `void` → `void \| Promise<void>` に変更 |
| `src/app/layout.tsx`                                            | 変更      | `QueryProvider` で `children` をラップ |
| `src/app/inventory/lists/page.tsx`                               | 変更      | `getInventories` / `getCategories` / `getStorageLocations` の呼び出しを `await` に変更 |
| `src/app/master/categories/page.tsx`                             | 変更      | `getCategories` を `await`、`MasterItemListView` に `resource="category"` を追加、`export const dynamic = 'force-dynamic'` を追加 |
| `src/app/master/storage-locations/page.tsx`                      | 変更      | 同上（`resource="storage"`） |
| `src/app/api/inventories/forwardInventoryRequest.ts`               | 新規      | 在庫登録（POST）・更新（PATCH）に共通する処理（カテゴリ名／保管場所名 → ID 解決、Go への中継、レスポンス変換）。POST・PATCH で内容がほぼ同一だったため実装時に共通関数へ切り出した（レビュー指摘） |
| `src/app/api/inventories/route.ts`                                | 新規      | 在庫登録（POST）。`forwardInventoryRequest` への委譲のみ |
| `src/app/api/inventories/route.test.ts`                           | 新規      | 上記のテスト（`fetch` をモック化） |
| `src/app/api/inventories/[id]/route.ts`                           | 新規      | 在庫更新（PATCH、`forwardInventoryRequest` への委譲）・削除（DELETE、`proxyToBackend` への委譲） |
| `src/app/api/inventories/[id]/route.test.ts`                      | 新規      | 上記のテスト |
| `src/app/api/categories/route.ts`                                  | 新規      | カテゴリ追加（POST）。`proxyToBackend` への委譲のみ |
| `src/app/api/categories/[id]/route.ts`                             | 新規      | カテゴリ更新（PATCH）・削除（DELETE） |
| `src/app/api/storages/route.ts`                                    | 新規      | 保管場所追加（POST） |
| `src/app/api/storages/[id]/route.ts`                                | 新規      | 保管場所更新（PATCH）・削除（DELETE） |

> ここに列挙されていないファイルを実装時に勝手に増やさない。必要になったら本設計書を先に更新する。
> `src/app/api/categories/**` ・ `src/app/api/storages/**` は `proxyToBackend` に処理を委譲するだけの
> 薄いファイルになる想定（`docs/coding-standards.md` の「`app` は薄く保つ」という方針は、
> ビジネスロジックを持つ在庫の Route Handler ではなく、これらカテゴリ・保管場所の Route Handler と
> `page.tsx` に適用されると解釈する）。

### 階層図

変更なし（既存の階層構成のまま）。参考として在庫一覧の呼び出し関係のみ再掲する:

```
InventoryLists（page.tsx, Server Component）
└── InventoryListsView（'use client'）
    ├── InventoryStorageTabs
    ├── InventoryFilterBar
    ├── InventoryTable
    └── InventoryFormModal
        └── InventoryForm
```

### Props

**`MasterItemListView`**（変更差分のみ。既存の `title` / `itemLabel` / `initialItems` は変更なし）:

```ts
type Props = {
  title: string;
  itemLabel: string;
  /** カテゴリ・保管場所のどちらを扱う画面か。BFF のエンドポイント選択に使う（新規） */
  resource: MasterResource;
  initialItems?: MasterItem[];
};
```

**`InventoryFormModal`**（`onSubmit` のみ変更）:

```ts
type Props = {
  open: boolean;
  onClose: () => void;
  categories?: Category[];
  storageLocations?: StorageLocation[];
  mode?: InventoryFormMode;
  initialValues?: InventoryFormValues;
  /** 登録・更新が成立したときに呼ぶ（変更: Promise を返せるようにする） */
  onSubmit: (draft: InventoryDraft) => void | Promise<void>;
};
```

**`MasterItemFormModal`**（`onSubmit` のみ変更）:

```ts
type Props = {
  open: boolean;
  onClose: () => void;
  itemLabel: string;
  mode?: MasterItemFormMode;
  initialValue?: string;
  existingNames: string[];
  /** 追加・更新が成立したときに呼ぶ（変更: Promise を返せるようにする） */
  onSubmit: (draft: MasterItemDraft) => void | Promise<void>;
};
```

`InventoryTable` の `onDelete?: (inventory: Inventory) => void` および `MasterItemList` の
`onDelete: (item: MasterItem) => void` は型変更しない。TypeScript は戻り値 `void` の関数型に対して
`Promise<void>` を返す実装を許容するため、`InventoryListsView` / `MasterItemListView` 側の
`handleDelete` を非同期関数に変えても、これらのコンポーネントへの props としてそのまま渡せる。

---

## 6. 状態管理・データフロー

- **Server / Client の分担**: 変更なし。`page.tsx`（Server Component）が一覧・マスタデータを取得し、
  `InventoryListsView` / `MasterItemListView`（`'use client'`）へ props で渡す既存の構成を維持する
- **サーバー状態**:
  - **読み取り**: TanStack Query は使わない。Server Component が `backendFetch` で Go バックエンドから
    直接取得し、props 経由でクライアントコンポーネントの `useState` 初期値として渡す（現行どおり）。
    ユーザー承認済み。理由: 一覧の絞り込みは既に `filterInventories`（クライアント側の名前ベース比較）
    が担っており、`useQuery` 化すると SSR/ハイドレーション構成の見直しが必要になり本タスクの範囲を
    超えるため
  - **書き込み**: `useMutation`（`@tanstack/react-query`）を使う。`mutationFn` が
    `features/*/api/` の関数（`createInventory` 等）を呼び、成功時の `onSuccess` でローカルの一覧
    `state`（`useState`）を直接更新する。クエリキャッシュの invalidate は行わない
    （読み取りが `useQuery` を使わないため、無効化する対象のキャッシュが存在しない）
- **クライアント状態**: 変更なし。`useInventoryFilterStore`（Zustand）はそのまま
- **レンダリング戦略**:
  - `app/inventory/lists/page.tsx` は既存どおり `export const dynamic = 'force-dynamic'`
  - `app/master/categories/page.tsx` ・ `app/master/storage-locations/page.tsx` は
    **新たに** `export const dynamic = 'force-dynamic'` を追加する。モック配列の直接埋め込みから
    実 API 呼び出しに変わるため、ビルド時に静的化されるとビルドマシンから到達できない
    Go バックエンドの呼び出しに失敗する（または古いデータが焼き込まれる）。実装後は
    `pnpm build` を実行し、Route 一覧で対象ルートが `○ (Static)` になっていないことを確認する
    （`CLAUDE.md` の既定の確認事項）
- **データの流れ（読み取り）**: `page.tsx` → `backendFetch`（Go 直接） → `InventoryResponse[]` →
  `toInventory` で `Inventory[]` に変換 → `InventoryListsView` の `initialInventories` prop
- **データの流れ（書き込み）**: `InventoryForm` の送信 → `InventoryListsView.handleSubmit` →
  `useMutation.mutateAsync` → `features/inventory/api/createInventory`（ブラウザ→BFF、`fetchJson`）→
  `src/app/api/inventories/route.ts`（Go への中継・ID解決） → Go バックエンド → レスポンスを
  `Inventory` に変換して返す → `onSuccess` でローカル `state` を更新

---

## 7. API 仕様

### 7.1 ブラウザ ⇄ BFF（Next.js Route Handler）

| メソッド | パス                        | 用途             |
| -------- | ---------------------------- | ---------------- |
| POST     | `/api/inventories`            | 在庫登録         |
| PATCH    | `/api/inventories/{id}`       | 在庫更新         |
| DELETE   | `/api/inventories/{id}`       | 在庫削除         |
| POST     | `/api/categories`              | カテゴリ追加     |
| PATCH    | `/api/categories/{id}`         | カテゴリ編集     |
| DELETE   | `/api/categories/{id}`         | カテゴリ削除     |
| POST     | `/api/storages`                 | 保管場所追加     |
| PATCH    | `/api/storages/{id}`            | 保管場所編集     |
| DELETE   | `/api/storages/{id}`            | 保管場所削除     |

在庫の GET（一覧）・カテゴリ／保管場所の GET（一覧）は BFF に用意しない。Server Component が
`backendFetch` で Go バックエンドへ直接アクセスするため、ブラウザから叩く経路が存在しない。

### 7.2 BFF ⇄ Go バックエンド

`../backend/docs/design/{inventory-list-api,inventory-create-api,inventory-update-delete-api,category-master-api,storage-master-api}.md` に定義済み。本設計書では変更しない。

### 7.3 実装

```ts
// src/shared/api/fetchJson.ts
const DEFAULT_ERROR_MESSAGE = '通信に失敗しました';

export const fetchJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, init);

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    const message =
      typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
        ? body.error
        : DEFAULT_ERROR_MESSAGE;
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  // 2xx でも本文が空・非JSONの場合に備え、パース失敗時は既定のエラーメッセージにフォールバックする
  // （レビュー指摘。Go の契約上は起きない想定だが、将来の実装変更に対する保険）
  try {
    return (await res.json()) as T;
  } catch {
    throw new Error(DEFAULT_ERROR_MESSAGE);
  }
};
```

```ts
// src/shared/api/backendApiUrl.ts

/** Go バックエンドのベース URL。未設定時は既定のポート（8080）を使う */
export const BACKEND_API_URL = process.env.BACKEND_API_URL ?? 'http://localhost:8080';
```

```ts
// src/shared/api/backendFetch.ts
import { BACKEND_API_URL } from './backendApiUrl';
import { fetchJson } from './fetchJson';

export const backendFetch = <T,>(path: string, init?: RequestInit): Promise<T> =>
  fetchJson<T>(`${BACKEND_API_URL}${path}`, { ...init, cache: 'no-store' });
```

```ts
// src/shared/api/proxyToBackend.ts
import { BACKEND_API_URL } from './backendApiUrl';

export const proxyToBackend = async (path: string, request: Request): Promise<Response> => {
  const hasBody = request.method !== 'GET' && request.method !== 'DELETE';
  const body = hasBody ? await request.text() : undefined;

  const backendResponse = await fetch(`${BACKEND_API_URL}${path}`, {
    method: request.method,
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
    body,
  });

  if (backendResponse.status === 204) {
    return new Response(null, { status: 204 });
  }

  const responseBody = await backendResponse.text();

  return new Response(responseBody, {
    status: backendResponse.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

```ts
// src/app/api/categories/route.ts
import { proxyToBackend } from '@/shared/api/proxyToBackend';

export const POST = (request: Request) => proxyToBackend('/api/categories', request);
```

```ts
// src/app/api/categories/[id]/route.ts
import { proxyToBackend } from '@/shared/api/proxyToBackend';

type Context = { params: Promise<{ id: string }> };

export const PATCH = async (request: Request, { params }: Context) => {
  const { id } = await params;
  return proxyToBackend(`/api/categories/${id}`, request);
};

export const DELETE = async (request: Request, { params }: Context) => {
  const { id } = await params;
  return proxyToBackend(`/api/categories/${id}`, request);
};
```

`src/app/api/storages/route.ts` ・ `src/app/api/storages/[id]/route.ts` は上記の `categories` を
`storages` に置き換えたのみの同型。

POST（在庫登録）と PATCH（在庫更新）は、カテゴリ名／保管場所名の解決・Go への中継・レスポンス変換が
ほぼ同一のため、実装時に共通関数 `forwardInventoryRequest` へ切り出した（コードレビュー指摘。
「実装時にコピーして id を差し込む」という当初案のままだと、解決ロジックや必須フィールドを変更した際に
片方だけ直し忘れるリスクがあったため）。Web 標準の `Response.json` を使い、`next/server` の
`NextResponse` は使わない。

```ts
// src/app/api/inventories/forwardInventoryRequest.ts
import { InventoryResponse } from '@/features/inventory/types';
import { toInventory } from '@/features/inventory/utils/toInventory';
import { BACKEND_API_URL } from '@/shared/api/backendApiUrl';
import { getCategories } from '@/shared/api/getCategories';
import { getStorageLocations } from '@/shared/api/getStorageLocations';

/** ブラウザから送られてくるボディ（InventoryDraft と同一形状） */
type InventoryRequestBody = {
  name: string;
  category: string;
  storage: string;
  quantity: number;
  expirationDate: string | null;
  purchaseDate: string;
  memo: string;
};

/** 在庫の登録（POST）・更新（PATCH）に共通する処理 */
export const forwardInventoryRequest = async (
  request: Request,
  backendPath: string,
): Promise<Response> => {
  let body: InventoryRequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'リクエストの形式が不正です' }, { status: 400 });
  }

  const [categories, storageLocations] = await Promise.all([getCategories(), getStorageLocations()]);

  const categoryId = categories.find((category) => category.name === body.category)?.id;
  if (!categoryId) {
    return Response.json({ error: '指定されたカテゴリが見つかりません' }, { status: 400 });
  }

  const storageId = storageLocations.find((storage) => storage.name === body.storage)?.id;
  if (!storageId) {
    return Response.json({ error: '指定された保管場所が見つかりません' }, { status: 400 });
  }

  const backendResponse = await fetch(`${BACKEND_API_URL}${backendPath}`, {
    method: request.method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: body.name,
      category_id: categoryId,
      storage_id: storageId,
      quantity: body.quantity,
      expiration_date: body.expirationDate,
      purchase_date: body.purchaseDate,
      memo: body.memo,
    }),
  });

  if (!backendResponse.ok) {
    const text = await backendResponse.text();
    return new Response(text, {
      status: backendResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST は Go が 201、PATCH は 200 を返すため、backendResponse.status をそのまま使う
  const result: InventoryResponse = await backendResponse.json();
  return Response.json(toInventory(result), { status: backendResponse.status });
};
```

```ts
// src/app/api/inventories/route.ts
import { forwardInventoryRequest } from './forwardInventoryRequest';

export const POST = (request: Request) => forwardInventoryRequest(request, '/api/inventories');
```

```ts
// src/app/api/inventories/[id]/route.ts
import { forwardInventoryRequest } from '../forwardInventoryRequest';

import { proxyToBackend } from '@/shared/api/proxyToBackend';

type Context = { params: Promise<{ id: string }> };

export const PATCH = async (request: Request, { params }: Context) => {
  const { id } = await params;
  return forwardInventoryRequest(request, `/api/inventories/${id}`);
};

// DELETE はボディの変換が不要なため proxyToBackend に委譲する
export const DELETE = async (request: Request, { params }: Context) => {
  const { id } = await params;
  return proxyToBackend(`/api/inventories/${id}`, request);
};
```

### 7.4 環境変数

- `BACKEND_API_URL`: Go バックエンドのベース URL。未設定時は `http://localhost:8080`
  （`backend/internal/config/config.go` の既定ポートと一致）。ローカル開発では設定不要。
  本番相当の環境を用意する場合はデプロイ設定側で上書きする（本タスクではホスティング未定のため、
  `.env` ファイルの新規作成はしない）
- 既定値付きの参照（`process.env.BACKEND_API_URL ?? 'http://localhost:8080'`）は
  `src/shared/api/backendApiUrl.ts` の `BACKEND_API_URL` に集約する（「4.3」参照）

### 7.5 クライアント側 API 関数

```ts
// src/features/inventory/api/createInventory.ts
import { fetchJson } from '@/shared/api/fetchJson';

import { Inventory, InventoryDraft } from '../types';

export const createInventory = (draft: InventoryDraft): Promise<Inventory> =>
  fetchJson<Inventory>('/api/inventories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  });
```

`updateInventory(id, draft)` は `PATCH /api/inventories/${id}`、
`deleteInventory(id)` は `DELETE /api/inventories/${id}`（戻り値 `Promise<void>`）で同様に実装する。

```ts
// src/features/master/api/resourcePath.ts
import { MasterResource } from '@/shared/types';

export const RESOURCE_PATHS: Record<MasterResource, string> = {
  category: '/api/categories',
  storage: '/api/storages',
};
```

```ts
// src/features/master/api/createMasterItem.ts
import { fetchJson } from '@/shared/api/fetchJson';
import { MasterItem, MasterItemDraft, MasterResource } from '@/shared/types';

import { RESOURCE_PATHS } from './resourcePath';

export const createMasterItem = (resource: MasterResource, draft: MasterItemDraft): Promise<MasterItem> =>
  fetchJson<MasterItem>(RESOURCE_PATHS[resource], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  });
```

`updateMasterItem(resource, id, draft)` は `PATCH ${RESOURCE_PATHS[resource]}/${id}`、
`deleteMasterItem(resource, id)` は `DELETE ${RESOURCE_PATHS[resource]}/${id}` で同様に実装する。

```ts
// src/features/inventory/api/getInventories.ts
import { backendFetch } from '@/shared/api/backendFetch';

import { InventoryResponse } from '../types';
import { toInventory } from '../utils/toInventory';

export const getInventories = async (): Promise<Inventory[]> => {
  const responses = await backendFetch<InventoryResponse[]>('/api/inventories');
  return responses.map(toInventory);
};
```

`getCategories` / `getStorageLocations`（`src/shared/api/`）は
`backendFetch<Category[]>('/api/categories')` ・ `backendFetch<StorageLocation[]>('/api/storages')`
を返すだけになる（レスポンス形状が `MasterItem` と一致するため変換不要）。

---

## 8. バリデーション・エラーハンドリング

| 対象                                   | ルール                                                       | エラーメッセージ（日本語） |
| ---------------------------------------- | ---------------------------------------------------------------- | ---------------------------- |
| 在庫登録・更新時の `category`（BFF）      | 渡された名前が現在のカテゴリマスタに存在すること                    | 指定されたカテゴリが見つかりません |
| 在庫登録・更新時の `storage`（BFF）       | 渡された名前が現在の保管場所マスタに存在すること                    | 指定された保管場所が見つかりません |
| BFF が受け取るリクエストボディ（在庫のみ） | JSON として解析できること                                        | リクエストの形式が不正です     |
| BFF → Go 呼び出しの失敗                   | Go が返すステータスコード・エラーメッセージをそのまま転送する      | （Go 側の日本語メッセージをそのまま使う） |
| ブラウザ側の `fetchJson` 呼び出し失敗      | レスポンスが `!res.ok` のとき、ボディの `error` を `Error` として投げる | （BFF/Go が返したメッセージをそのまま使う） |

- カテゴリ・保管場所の名前解決の失敗は、実運用では基本的に起こらない
  （フォームの選択肢自体がマスタ由来のため）。ただし他タブでの削除などによる競合状態を考慮し、
  BFF 側で明示的にエラーにする
- 在庫・マスタ項目の必須項目チェック・文字数上限チェックは Go バックエンド側の `service` 層が
  正とする（既存のフロントエンド側バリデーション `validateInventoryForm` / `validateMasterItemForm` は
  変更しない。フォーム入力時の早期フィードバックとして併存させる）
- `InventoryListsView` / `MasterItemListView` は、`useMutation` の `mutationFn` が投げた `Error` を
  `handleSubmit` / `handleDelete` 内の `try/catch` で捕捉し、`errorMessage`（新規 `useState`）に
  `error.message` をセットして画面に表示する。登録・編集時はモーダルを開いたままにし、
  一覧への反映（`state` の更新・モーダルを閉じる・成功メッセージの表示）は成功時のみ行う

---

## 9. テスト観点

> このセクションが `unit-test-writer` の入力になる。抽象的に書かず、
> 「入力 → 期待される結果」が読み取れる粒度で書くこと。

### `src/shared/api/fetchJson.ts`

#### 正常系

- [ ] `fetch` が `ok: true` のレスポンスを返すとき、レスポンスボディを JSON パースした値を返す
- [ ] `fetch` が `status: 204` のレスポンスを返すとき、`undefined` を返す

#### 異常系

- [ ] `fetch` が `ok: false` かつボディが `{ error: "メッセージ" }` のとき、
      そのメッセージを持つ `Error` を投げる
- [ ] `fetch` が `ok: false` かつボディが JSON として解析できない・`error` フィールドを持たないとき、
      既定のメッセージ（「通信に失敗しました」）を持つ `Error` を投げる
- [ ] `fetch` が `ok: true` だがボディが JSON として解析できないとき、既定のメッセージ
      （「通信に失敗しました」）を持つ `Error` を投げる（レビュー指摘で追加。204 以外の 2xx が
      空・非JSONボディを返す想定外のケースに対する保険）

### `src/shared/components/QueryProvider/QueryProvider.tsx`

#### 正常系

- [ ] `children` をそのままレンダリングする（レビュー指摘で追加。TDD原則に基づき、設計時点で
      抜けていたテスト観点を実装後に補った）

### `src/shared/api/backendFetch.ts`

#### 正常系

- [ ] `path` を渡すと、`BACKEND_API_URL`（環境変数未設定時は `http://localhost:8080`）を
      前置した URL で `fetch` が呼ばれる
- [ ] `init` に渡したオプション（`method` など）がそのまま `fetch` に渡り、
      加えて `cache: 'no-store'` が付与される

### `src/shared/api/proxyToBackend.ts`

#### 正常系

- [ ] `GET` 以外（例: `POST`）のリクエストのとき、リクエストボディを読み取り
      `Content-Type: application/json` を付けて Go バックエンドへ中継する
- [ ] `DELETE` のとき、リクエストボディを読み取らずに中継する
- [ ] Go バックエンドが `status: 204` を返したとき、ボディなしの `204` レスポンスを返す
- [ ] Go バックエンドが `status: 200` とJSONボディを返したとき、同じステータス・同じボディで返す

#### 異常系

- [ ] Go バックエンドが `status: 400` とエラーボディを返したとき、同じ `400` とそのボディをそのまま返す

### `src/features/inventory/utils/toInventory.ts`

#### 正常系

- [ ] `InventoryResponse`（`category_name`・`storage_name` を含む）を渡すと、
      `category`・`storage` にそれぞれの名前が入った `Inventory` を返す
- [ ] `expiration_date` が `null` のとき、`expirationDate` も `null` になる

### `src/features/inventory/api/getInventories.ts`

#### 正常系

- [ ] `backendFetch` が `InventoryResponse[]` を返すとき、`toInventory` で変換した `Inventory[]` を返す

#### 境界値

- [ ] `backendFetch` が空配列を返すとき、空配列を返す

### `src/features/inventory/api/createInventory.ts`

#### 正常系

- [ ] `draft` を渡すと `POST /api/inventories` に `JSON.stringify(draft)` をボディとして送り、
      レスポンスの JSON をそのまま返す

#### 異常系

- [ ] `fetch` がエラーレスポンスを返すとき、`fetchJson` が投げる `Error` がそのまま伝播する

`updateInventory` ・ `deleteInventory` も同様に「正しいパス・メソッドで呼ばれること」
「エラー時に `Error` が伝播すること」を検証する。

### `src/features/master/api/createMasterItem.ts`

#### 正常系

- [ ] `resource: 'category'` のとき `POST /api/categories` を呼ぶ
- [ ] `resource: 'storage'` のとき `POST /api/storages` を呼ぶ

`updateMasterItem` ・ `deleteMasterItem` も同様に `resource` ごとの宛先パスの出し分けを検証する。

### `src/app/api/inventories/route.ts`（POST）

#### 正常系

- [ ] 有効な `category`・`storage`（名前）を含むボディを送ると、カテゴリ・保管場所のIDを解決した上で
      Go バックエンドへ `category_id`・`storage_id` を含むリクエストを送り、
      Go のレスポンスを `Inventory` 形状に変換して `201` で返す

#### 異常系

- [ ] `category` が現在のカテゴリマスタに存在しない名前のとき、Go を呼び出さずに `400` と
      「指定されたカテゴリが見つかりません」を返す
- [ ] `storage` が現在の保管場所マスタに存在しない名前のとき、`400` と
      「指定された保管場所が見つかりません」を返す
- [ ] リクエストボディが不正な JSON のとき、`400` と「リクエストの形式が不正です」を返す
- [ ] Go バックエンドがエラーレスポンス（例: `500`）を返したとき、同じステータス・同じボディを返す

### `src/app/api/inventories/[id]/route.ts`

#### 正常系

- [ ] PATCH: 有効なボディを送ると更新後の `Inventory` を返す
- [ ] DELETE: 成功時に `204` を返す

#### 異常系

- [ ] PATCH: Go が `404` を返したとき、同じ `404` とボディを返す

### `InventoryListsView`（登録・更新・削除の非同期化）

#### 正常系

- [ ] フォーム送信が成功すると、一覧に新しい在庫が反映され成功メッセージが表示される
- [ ] 削除が成功すると、一覧から対象の在庫が消え成功メッセージが表示される

#### 異常系

- [ ] フォーム送信が失敗（`createInventory` が reject）すると、一覧は変化せず、
      `role="alert"` のエラーメッセージが表示され、モーダルは開いたままになる
- [ ] 削除が失敗（`deleteInventory` が reject）すると、一覧から対象の在庫は消えず、
      エラーメッセージが表示される

`MasterItemListView` も同様の正常系・異常系を検証する（対象は `MasterItem`）。

### 境界値（横断）

- [ ] 一覧が0件のとき、`getInventories` / `getCategories` / `getStorageLocations` はいずれも
      空配列を返し、画面は既存の0件表示のままになる

---

## 10. 未決事項・確認事項

以下はユーザー確認済み。

| 論点                                                       | 決定                                                                 |
| ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| 在庫のカテゴリ・保管場所をIDベースにするか名前ベースを維持するか | 名前ベースを維持し、BFF層（Route Handler）で名前⇄IDを変換する。理由・トレードオフは「4.1」参照 |
| 一覧取得にTanStack Queryの`useQuery`を導入するか               | 導入しない。Server Componentでの直接取得を維持し、TanStack Queryは書き込み（`useMutation`）にのみ使う。理由は「6. 状態管理・データフロー」参照 |
| 「登録日」をデータモデルに追加するか（`docs/tasks.md` T-08の記載） | 追加しない。Go バックエンドの `InventoryResponse` が `registered_at` を返さない方針で実装済みのため、本タスクの範囲では追加しない（「2. スコープ／やらないこと」参照）。必要になった場合はバックエンド側の設計変更を伴う別タスクとする |
| 通知設定APIへの接続                                          | 対象外。Go バックエンドに未実装のため、引き続きモックのまま |
