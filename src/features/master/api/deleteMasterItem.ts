/**
 * マスタ項目（カテゴリ・保管場所）を削除する。
 * Go バックエンド（DELETE /api/categories/:id, /api/storages/:id）が未実装のためモック。
 * 一覧からの除去は呼び出し側（MasterItemListView）の state 操作で行うため、ここでは何もしない。
 * @param _id - 削除対象の項目ID
 */
export const deleteMasterItem = (_id: string): void => {};
