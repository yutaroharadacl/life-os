import { Inventory, InventoryResponse } from '../types';
import { toInventory } from '../utils/toInventory';

import { backendFetch } from '@/shared/api/backendFetch';

/**
 * 在庫一覧を取得する。
 * Server Component 専用。Go バックエンド（GET /api/inventories）へ直接 fetch する。
 */
export const getInventories = async (): Promise<Inventory[]> => {
  const responses = await backendFetch<InventoryResponse[]>('/api/inventories');
  return responses.map(toInventory);
};
