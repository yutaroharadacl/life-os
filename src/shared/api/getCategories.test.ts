import { afterEach, describe, expect, it, vi } from 'vitest';

import { Category } from '../types';

import { getCategories } from './getCategories';

describe('getCategories', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('正常系', () => {
    it('backendFetchが返したカテゴリ一覧をそのまま返す', async () => {
      const categories: Category[] = [
        { id: 'c1', name: '野菜' },
        { id: 'c2', name: '肉' },
      ];
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(JSON.stringify(categories), { status: 200 })),
      );

      const result = await getCategories();

      expect(result).toEqual(categories);
    });
  });

  describe('境界値', () => {
    it('backendFetchが空配列を返すとき、空配列を返す', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 })),
      );

      const result = await getCategories();

      expect(result).toEqual([]);
    });
  });
});
