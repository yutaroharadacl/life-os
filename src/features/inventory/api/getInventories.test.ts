import { afterEach, describe, expect, it, vi } from 'vitest';

import { InventoryResponse } from '../types';

import { getInventories } from './getInventories';

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createResponse = (overrides: Partial<InventoryResponse> = {}): InventoryResponse => ({
  category_id: 'c1',
  category_name: '野菜',
  expiration_date: null,
  id: '1',
  memo: '',
  name: '白菜',
  purchase_date: '2026-08-20',
  quantity: 1,
  storage_id: 's1',
  storage_name: '冷蔵庫',
  ...overrides,
});

describe('getInventories', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('正常系', () => {
    it('backendFetchが返したInventoryResponse[]をtoInventoryで変換したInventory[]で返す', async () => {
      const responses = [
        createResponse({ id: '1', name: '白菜' }),
        createResponse({ id: '2', name: '牛乳' }),
      ];
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(JSON.stringify(responses), { status: 200 })),
      );

      const result = await getInventories();

      expect(result).toEqual([
        {
          id: '1',
          name: '白菜',
          category: '野菜',
          storage: '冷蔵庫',
          quantity: 1,
          expirationDate: null,
          purchaseDate: '2026-08-20',
          memo: '',
        },
        {
          id: '2',
          name: '牛乳',
          category: '野菜',
          storage: '冷蔵庫',
          quantity: 1,
          expirationDate: null,
          purchaseDate: '2026-08-20',
          memo: '',
        },
      ]);
    });
  });

  describe('境界値', () => {
    it('backendFetchが空配列を返すとき、空配列を返す', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 })),
      );

      const result = await getInventories();

      expect(result).toEqual([]);
    });
  });
});
