import { Inventory, InventoryResponse } from '../types';

/** Go バックエンドのレスポンスをフロントエンドのドメイン型（名前ベース）に変換する */
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
