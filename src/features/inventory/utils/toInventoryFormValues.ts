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
  // 編集モードでは「＋ 新規登録」自体を表示しないため、新規名称欄は常に空欄から始まる
  newCategoryName: '',
  storage: inventory.storage,
  newStorageName: '',
  quantity: String(inventory.quantity),
  expirationDate: inventory.expirationDate ?? '',
  purchaseDate: inventory.purchaseDate,
  memo: inventory.memo,
});
