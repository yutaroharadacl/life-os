import { Inventory, InventoryDraft } from '../types';

/**
 * 在庫を更新する。
 * Go バックエンド（PATCH /api/inventories/:id）が未実装のためモック。
 * 更新後の内容を組み立てて返すだけで永続化はしない。
 * @param id - 更新対象の在庫ID
 * @param draft - 更新後の在庫データ
 * @returns 更新後の在庫
 */
export const updateInventory = (id: string, draft: InventoryDraft): Inventory => ({
  ...draft,
  id,
});
