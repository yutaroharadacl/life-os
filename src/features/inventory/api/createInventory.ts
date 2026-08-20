import { Inventory, InventoryDraft } from '../types';

import { fetchJson } from '@/shared/api/fetchJson';

/**
 * 在庫を登録する。
 * ブラウザから BFF（POST /api/inventories）を叩く。カテゴリ名・保管場所名からIDへの変換は
 * BFF（Route Handler）が行う。
 * @param draft - 登録する在庫データ
 * @returns 登録された在庫（IDが採番された状態）
 */
export const createInventory = (draft: InventoryDraft): Promise<Inventory> =>
  fetchJson<Inventory>('/api/inventories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  });
