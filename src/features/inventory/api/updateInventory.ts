import { Inventory, InventoryDraft } from '../types';

import { fetchJson } from '@/shared/api/fetchJson';

/**
 * 在庫を更新する。
 * ブラウザから BFF（PATCH /api/inventories/{id}）を叩く。
 * @param id - 更新対象の在庫ID
 * @param draft - 更新後の在庫データ
 * @returns 更新後の在庫
 */
export const updateInventory = (id: string, draft: InventoryDraft): Promise<Inventory> =>
  fetchJson<Inventory>(`/api/inventories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  });
