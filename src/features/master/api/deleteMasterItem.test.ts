import { afterEach, describe, expect, it, vi } from 'vitest';

import { deleteMasterItem } from './deleteMasterItem';

describe('deleteMasterItem', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('正常系', () => {
    it("resourceが'category'のときDELETE /api/categories/{id}を呼ぶ", async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
      vi.stubGlobal('fetch', fetchMock);

      await deleteMasterItem('category', 'category-1');

      expect(fetchMock).toHaveBeenCalledWith('/api/categories/category-1', { method: 'DELETE' });
    });

    it("resourceが'storage'のときDELETE /api/storages/{id}を呼ぶ", async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
      vi.stubGlobal('fetch', fetchMock);

      await deleteMasterItem('storage', 'storage-1');

      expect(fetchMock).toHaveBeenCalledWith('/api/storages/storage-1', { method: 'DELETE' });
    });
  });

  describe('異常系', () => {
    it('fetchがエラーレスポンスを返すとき、fetchJsonが投げるErrorがそのまま伝播する', async () => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            new Response(JSON.stringify({ error: 'カテゴリが見つかりません' }), { status: 404 }),
          ),
      );

      await expect(deleteMasterItem('category', 'category-1')).rejects.toThrow(
        'カテゴリが見つかりません',
      );
    });
  });
});
