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
  memo: string;
};
