/** @vitest-environment node */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

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
  quantity: 1,
  expirationDate: null,
  purchaseDate: '2026-08-20',
  memo: '',
  ...overrides,
});

const createRequest = (body: unknown): Request =>
  new Request('http://localhost:3000/api/inventories', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const createBackendInventoryResponse = (overrides: Record<string, unknown> = {}) => ({
  id: 'inventory-1',
  name: '白菜',
  category_id: 'c1',
  category_name: '野菜',
  storage_id: 's1',
  storage_name: '冷蔵庫',
  quantity: 1,
  expiration_date: null,
  purchase_date: '2026-08-20',
  memo: '',
  ...overrides,
});

describe('POST /api/inventories', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    mockGetCategories.mockReset();
    mockGetStorageLocations.mockReset();
  });

  describe('正常系', () => {
    it('有効なcategory・storage名を含むボディを送るとID解決したリクエストをGoへ送りInventory形状に変換して201で返す', async () => {
      mockGetCategories.mockResolvedValue(categories);
      mockGetStorageLocations.mockResolvedValue(storageLocations);
      const fetchMock = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(createBackendInventoryResponse()), { status: 201 }),
        );
      vi.stubGlobal('fetch', fetchMock);

      const response = await POST(createRequest(createRequestBody()));
      const responseBody = await response.json();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [calledUrl, calledInit] = fetchMock.mock.calls[0];
      expect(calledUrl).toBe('http://localhost:8080/api/inventories');
      expect(JSON.parse(calledInit.body as string)).toEqual({
        name: '白菜',
        category_id: 'c1',
        storage_id: 's1',
        quantity: 1,
        expiration_date: null,
        purchase_date: '2026-08-20',
        memo: '',
      });

      expect(response.status).toBe(201);
      expect(responseBody).toEqual({
        id: 'inventory-1',
        name: '白菜',
        category: '野菜',
        storage: '冷蔵庫',
        quantity: 1,
        expirationDate: null,
        purchaseDate: '2026-08-20',
        memo: '',
      });
    });
  });

  describe('異常系', () => {
    it('categoryが現在のカテゴリマスタに存在しない名前のとき、Goを呼び出さずに400と指定されたカテゴリが見つかりませんを返す', async () => {
      mockGetCategories.mockResolvedValue(categories);
      mockGetStorageLocations.mockResolvedValue(storageLocations);
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      const response = await POST(
        createRequest(createRequestBody({ category: '存在しないカテゴリ' })),
      );
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody).toEqual({ error: '指定されたカテゴリが見つかりません' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('storageが現在の保管場所マスタに存在しない名前のとき、400と指定された保管場所が見つかりませんを返す', async () => {
      mockGetCategories.mockResolvedValue(categories);
      mockGetStorageLocations.mockResolvedValue(storageLocations);
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      const response = await POST(
        createRequest(createRequestBody({ storage: '存在しない保管場所' })),
      );
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody).toEqual({ error: '指定された保管場所が見つかりません' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('リクエストボディが不正なJSONのとき、400とリクエストの形式が不正ですを返す', async () => {
      const response = await POST(createRequest('{不正なJSON'));
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody).toEqual({ error: 'リクエストの形式が不正です' });
    });

    it('Goバックエンドがエラーレスポンス（500）を返したとき、同じステータス・同じボディを返す', async () => {
      mockGetCategories.mockResolvedValue(categories);
      mockGetStorageLocations.mockResolvedValue(storageLocations);
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ error: 'サーバーエラーが発生しました' }), {
            status: 500,
          }),
        ),
      );

      const response = await POST(createRequest(createRequestBody()));
      const responseBody = await response.json();

      expect(response.status).toBe(500);
      expect(responseBody).toEqual({ error: 'サーバーエラーが発生しました' });
    });
  });
});
