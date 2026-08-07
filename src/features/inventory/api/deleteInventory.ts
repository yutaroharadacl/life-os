/**
 * 在庫を削除する。
 * Go バックエンド（DELETE /api/inventories/:id）が未実装のためモック。
 * 一覧からの除去は呼び出し側（InventoryListsView）の state 操作で行うため、ここでは何もしない。
 * @param _id - 削除対象の在庫ID
 */
export const deleteInventory = (_id: string): void => {};
