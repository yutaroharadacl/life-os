import { Inventory, InventoryFormValues } from '../types';

/**
 * 在庫データを編集フォームの初期値へ変換する（`toInventoryDraft` の逆変換）。
 * 期限が未設定（null）の場合は、入力欄が空欄になるよう空文字にする。
 * @param inventory - 編集対象の在庫
 * @returns フォームの初期値
 */
export const toInventoryFormValues = (inventory: Inventory): InventoryFormValues => ({
  name: inventory.name,
  category: inventory.category,
  storage: inventory.storage,
  quantity: String(inventory.quantity),
  expirationDate: inventory.expirationDate ?? '',
  purchaseDate: inventory.purchaseDate,
  memo: inventory.memo,
});
