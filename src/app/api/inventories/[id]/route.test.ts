/** @vitest-environment node */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DELETE, PATCH } from './route';

const { mockGetCategories, mockGetStorageLocations } = vi.hoisted(() => ({
  mockGetCategories: vi.fn(),
  mockGetStorageLocations: vi.fn(),
}));

vi.mock('@/shared/api/getCategories', () => ({ getCategories: mockGetCategories }));
vi.mock('@/shared/api/getStorageLocations', () => ({
  getStorageLocations: mockGetStorageLocations,
}));

const categories = [{ id: 'c1', name: '野菜' }];
const storageLocations = [{ id: 's1', name: '冷蔵庫' }];

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createRequestBody = (overrides: Record<string, unknown> = {}) => ({
  name: '白菜',
  category: '野菜',
  storage: '冷蔵庫',
  quantity: 2,
  expirationDate: null,
  purchaseDate: '2026-08-20',
  memo: '',
  ...overrides,
});

const createContext = (id: string) => ({ params: Promise.resolve({ id }) });

describe('PATCH /api/inventories/[id]', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    mockGetCategories.mockReset();
    mockGetStorageLocations.mockReset();
  });

  describe('正常系', () => {
    it('有効なボディを送ると更新後のInventoryを返す', async () => {
      mockGetCategories.mockResolvedValue(categories);
      mockGetStorageLocations.mockResolvedValue(storageLocations);
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              id: 'inventory-1',
              name: '白菜',
              category_id: 'c1',
              category_name: '野菜',
              storage_id: 's1',
              storage_name: '冷蔵庫',
              quantity: 2,
              expiration_date: null,
              purchase_date: '2026-08-20',
              memo: '',
            }),
            { status: 200 },
          ),
        ),
      );
      const request = new Request('http://localhost:3000/api/inventories/inventory-1', {
        method: 'PATCH',
        body: JSON.stringify(createRequestBody()),
      });

      const response = await PATCH(request, createContext('inventory-1'));
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        id: 'inventory-1',
        name: '白菜',
        category: '野菜',
        storage: '冷蔵庫',
        quantity: 2,
        expirationDate: null,
        purchaseDate: '2026-08-20',
        memo: '',
      });
    });
  });

  describe('異常系', () => {
    it('Goが404を返したとき、同じ404とボディを返す', async () => {
      mockGetCategories.mockResolvedValue(categories);
      mockGetStorageLocations.mockResolvedValue(storageLocations);
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            new Response(JSON.stringify({ error: '在庫が見つかりません' }), { status: 404 }),
          ),
      );
      const request = new Request('http://localhost:3000/api/inventories/inventory-404', {
        method: 'PATCH',
        body: JSON.stringify(createRequestBody()),
      });

      const response = await PATCH(request, createContext('inventory-404'));
      const responseBody = await response.json();

      expect(response.status).toBe(404);
      expect(responseBody).toEqual({ error: '在庫が見つかりません' });
    });
  });
});

describe('DELETE /api/inventories/[id]', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('正常系', () => {
    it('成功時に204を返す', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
      const request = new Request('http://localhost:3000/api/inventories/inventory-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, createContext('inventory-1'));

      expect(response.status).toBe(204);
    });
  });
});
