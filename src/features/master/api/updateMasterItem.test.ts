import { afterEach, describe, expect, it, vi } from 'vitest';

import { updateMasterItem } from './updateMasterItem';

import { MasterItem, MasterItemDraft } from '@/shared/types';

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createDraft = (overrides: Partial<MasterItemDraft> = {}): MasterItemDraft => ({
  name: '野菜',
  ...overrides,
});

describe('updateMasterItem', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('正常系', () => {
    it("resourceが'category'のときPATCH /api/categories/{id}を呼ぶ", async () => {
      const draft = createDraft({ name: '果物' });
      const fetchMock = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ ...draft, id: 'category-1' }), { status: 200 }),
        );
      vi.stubGlobal('fetch', fetchMock);

      await updateMasterItem('category', 'category-1', draft);

      expect(fetchMock).toHaveBeenCalledWith('/api/categories/category-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
    });

    it("resourceが'storage'のときPATCH /api/storages/{id}を呼ぶ", async () => {
      const draft = createDraft({ name: '冷凍庫' });
      const fetchMock = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ ...draft, id: 'storage-1' }), { status: 200 }),
        );
      vi.stubGlobal('fetch', fetchMock);

      await updateMasterItem('storage', 'storage-1', draft);

      expect(fetchMock).toHaveBeenCalledWith('/api/storages/storage-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
    });

    it('レスポンスのJSONをそのまま返す', async () => {
      const updated: MasterItem = { id: 'category-1', name: '果物' };
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(JSON.stringify(updated), { status: 200 })),
      );

      const result = await updateMasterItem(
        'category',
        'category-1',
        createDraft({ name: '果物' }),
      );

      expect(result).toEqual(updated);
    });
  });

  describe('異常系', () => {
    it('fetchがエラーレスポンスを返すとき、fetchJsonが投げるErrorがそのまま伝播する', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ error: '同じ名前のカテゴリが既に登録されています' }), {
            status: 409,
          }),
        ),
      );

      await expect(updateMasterItem('category', 'category-1', createDraft())).rejects.toThrow(
        '同じ名前のカテゴリが既に登録されています',
      );
    });
  });
});
