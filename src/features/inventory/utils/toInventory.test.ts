import { describe, expect, it } from 'vitest';

import { InventoryResponse } from '../types';

import { toInventory } from './toInventory';

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createResponse = (overrides: Partial<InventoryResponse> = {}): InventoryResponse => ({
  category_id: 'c1',
  category_name: '野菜',
  expiration_date: '2026-08-25',
  id: '1',
  memo: '',
  name: '白菜',
  purchase_date: '2026-08-20',
  quantity: 1,
  storage_id: 's1',
  storage_name: '冷蔵庫',
  ...overrides,
});

describe('toInventory', () => {
  describe('正常系', () => {
    it('category_name・storage_nameがそれぞれcategory・storageに入ったInventoryを返す', () => {
      const response = createResponse({ category_name: '野菜', storage_name: '冷蔵庫' });

      const result = toInventory(response);

      expect(result.category).toBe('野菜');
      expect(result.storage).toBe('冷蔵庫');
    });

    it('id・name・quantity・memoがそのまま変換される', () => {
      const response = createResponse({
        id: 'inventory-1',
        name: '牛乳',
        quantity: 2,
        memo: '開封済み',
      });

      const result = toInventory(response);

      expect(result).toMatchObject({
        id: 'inventory-1',
        name: '牛乳',
        quantity: 2,
        memo: '開封済み',
      });
    });

    it('purchase_dateがpurchaseDateに変換される', () => {
      const response = createResponse({ purchase_date: '2026-08-01' });

      const result = toInventory(response);

      expect(result.purchaseDate).toBe('2026-08-01');
    });
  });

  describe('境界値', () => {
    it('expiration_dateがnullのとき、expirationDateもnullになる', () => {
      const response = createResponse({ expiration_date: null });

      const result = toInventory(response);

      expect(result.expirationDate).toBeNull();
    });
  });
});
