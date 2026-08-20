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

/** 新規登録の入力値。ID はサーバーが採番するため持たない */
export type InventoryDraft = Omit<Inventory, 'id'>;

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

/** 在庫フォームの動作モード。ラベル・初期値の出し分けに使う */
export type InventoryFormMode = 'create' | 'edit';

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

/** 並び替えの選択肢。expirationAsc: 期限が近い順（既定） / nameAsc: 食品名順 */
export type SortOrder = 'expirationAsc' | 'nameAsc';

/** 一覧の絞り込み・並び替え条件 */
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

/** filterInventories の絞り込み条件。並び替え順は絞り込みに関係しないため対象外 */
export type InventoryFilters = Pick<InventoryFilterState, 'keyword' | 'category' | 'storage'>;

/** useInventoryFilterStore（Zustand）が公開する状態と操作 */
export type InventoryFilterStore = InventoryFilterState & {
  setKeyword: (keyword: string) => void;
  setCategory: (category: string) => void;
  setStorage: (storage: string) => void;
  setSortOrder: (sortOrder: SortOrder) => void;
  /** キーワード・カテゴリ・保管場所を初期値に戻す。並び替えは表示の見せ方であり絞り込み条件とは性質が異なるため変更しない */
  resetFilters: () => void;
};

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
