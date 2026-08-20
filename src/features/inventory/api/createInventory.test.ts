import { afterEach, describe, expect, it, vi } from 'vitest';

import { Inventory, InventoryDraft } from '../types';

import { createInventory } from './createInventory';

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

describe('createInventory', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('正常系', () => {
    it('POST /api/inventoriesにJSON.stringify(draft)をボディとして送る', async () => {
      const draft = createDraft({ name: '牛乳' });
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ ...draft, id: '1' }), { status: 201 }));
      vi.stubGlobal('fetch', fetchMock);

      await createInventory(draft);

      expect(fetchMock).toHaveBeenCalledWith('/api/inventories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
    });

    it('レスポンスのJSONをそのまま返す', async () => {
      const draft = createDraft();
      const created: Inventory = { ...draft, id: '1' };
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(JSON.stringify(created), { status: 201 })),
      );

      const result = await createInventory(draft);

      expect(result).toEqual(created);
    });
  });

  describe('異常系', () => {
    it('fetchがエラーレスポンスを返すとき、fetchJsonが投げるErrorがそのまま伝播する', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ error: '数量は1以上999以下で入力してください' }), {
            status: 400,
          }),
        ),
      );

      await expect(createInventory(createDraft())).rejects.toThrow(
        '数量は1以上999以下で入力してください',
      );
    });
  });
});
