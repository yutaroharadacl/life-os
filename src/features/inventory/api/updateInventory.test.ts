import { afterEach, describe, expect, it, vi } from 'vitest';

import { Inventory, InventoryDraft } from '../types';

import { updateInventory } from './updateInventory';

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createDraft = (overrides: Partial<InventoryDraft> = {}): InventoryDraft => ({
  category: '野菜',
  expirationDate: null,
  memo: '',
  name: '白菜',
  purchaseDate: '2026-08-06',
  quantity: 1,
  storage: '冷蔵庫',
  ...overrides,
});

describe('updateInventory', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('正常系', () => {
    it('PATCH /api/inventories/{id}にJSON.stringify(draft)をボディとして送る', async () => {
      const draft = createDraft({ name: '牛乳', quantity: 2 });
      const fetchMock = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ ...draft, id: 'inventory-1' }), { status: 200 }),
        );
      vi.stubGlobal('fetch', fetchMock);

      await updateInventory('inventory-1', draft);

      expect(fetchMock).toHaveBeenCalledWith('/api/inventories/inventory-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
    });

    it('レスポンスのJSONをそのまま返す', async () => {
      const draft = createDraft();
      const updated: Inventory = { ...draft, id: 'inventory-1' };
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(JSON.stringify(updated), { status: 200 })),
      );

      const result = await updateInventory('inventory-1', draft);

      expect(result).toEqual(updated);
    });
  });

  describe('異常系', () => {
    it('fetchがエラーレスポンスを返すとき、fetchJsonが投げるErrorがそのまま伝播する', async () => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            new Response(JSON.stringify({ error: '在庫が見つかりません' }), { status: 404 }),
          ),
      );

      await expect(updateInventory('inventory-1', createDraft())).rejects.toThrow(
        '在庫が見つかりません',
      );
    });
  });
});
