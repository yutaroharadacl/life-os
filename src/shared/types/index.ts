/**
 * 名称のみを持つマスタ項目の共通の形。カテゴリ・保管場所はどちらもこの形に一致する。
 * inventory feature（登録・絞り込みの選択肢として）・master feature（管理対象データそのものとして）
 * の両方から参照されるため shared に置く。
 */
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
