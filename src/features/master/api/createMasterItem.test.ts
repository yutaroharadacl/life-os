import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMasterItem } from './createMasterItem';

import { MasterItem, MasterItemDraft } from '@/shared/types';

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createDraft = (overrides: Partial<MasterItemDraft> = {}): MasterItemDraft => ({
  name: '野菜',
  ...overrides,
});

describe('createMasterItem', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('正常系', () => {
    it("resourceが'category'のときPOST /api/categoriesを呼ぶ", async () => {
      const draft = createDraft({ name: '果物' });
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ ...draft, id: 'c1' }), { status: 201 }));
      vi.stubGlobal('fetch', fetchMock);

      await createMasterItem('category', draft);

      expect(fetchMock).toHaveBeenCalledWith('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
    });

    it("resourceが'storage'のときPOST /api/storagesを呼ぶ", async () => {
      const draft = createDraft({ name: '冷蔵庫' });
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ ...draft, id: 's1' }), { status: 201 }));
      vi.stubGlobal('fetch', fetchMock);

      await createMasterItem('storage', draft);

      expect(fetchMock).toHaveBeenCalledWith('/api/storages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
    });

    it('レスポンスのJSONをそのまま返す', async () => {
      const created: MasterItem = { id: 'c1', name: '果物' };
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(JSON.stringify(created), { status: 201 })),
      );

      const result = await createMasterItem('category', createDraft({ name: '果物' }));

      expect(result).toEqual(created);
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

      await expect(createMasterItem('category', createDraft())).rejects.toThrow(
        '同じ名前のカテゴリが既に登録されています',
      );
    });
  });
});
