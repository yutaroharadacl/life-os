import { fetchJson } from '@/shared/api/fetchJson';

/**
 * 在庫を削除する。
 * ブラウザから BFF（DELETE /api/inventories/{id}）を叩く。
 * @param id - 削除対象の在庫ID
 */
export const deleteInventory = (id: string): Promise<void> =>
  fetchJson<void>(`/api/inventories/${id}`, { method: 'DELETE' });
