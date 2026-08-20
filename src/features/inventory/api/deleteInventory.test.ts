import { afterEach, describe, expect, it, vi } from 'vitest';

import { deleteInventory } from './deleteInventory';

describe('deleteInventory', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('正常系', () => {
    it('DELETE /api/inventories/{id}を呼ぶ', async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
      vi.stubGlobal('fetch', fetchMock);

      await deleteInventory('inventory-1');

      expect(fetchMock).toHaveBeenCalledWith('/api/inventories/inventory-1', { method: 'DELETE' });
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

      await expect(deleteInventory('inventory-1')).rejects.toThrow('在庫が見つかりません');
    });
  });
});
