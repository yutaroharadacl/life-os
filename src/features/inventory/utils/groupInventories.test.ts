import { describe, expect, it } from 'vitest';

import { Inventory } from '../types';

import { groupByStorage } from './groupInventories';

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createInventory = (overrides: Partial<Inventory> = {}): Inventory => ({
  category: '野菜',
  expirationDate: null,
  id: '1',
  name: '白菜',
  purchaseDate: '2026-08-03',
  quantity: 1,
  storage: '冷蔵庫',
  ...overrides,
});

describe('groupByStorage', () => {
  describe('正常系', () => {
    it('保管場所ごとにグループ化され、グループの順序は初出順になる', () => {
      const inventories = [
        createInventory({ name: '白菜', storage: '冷蔵庫' }),
        createInventory({ name: '小麦粉', storage: 'パントリー' }),
        createInventory({ name: '牛乳', storage: '冷蔵庫' }),
      ];

      const result = groupByStorage(inventories);

      expect(result.map((group) => group.storage)).toEqual(['冷蔵庫', 'パントリー']);
    });

    it('同じ保管場所の在庫が1つのグループにまとまる', () => {
      const inventories = [
        createInventory({ name: '白菜', storage: '冷蔵庫' }),
        createInventory({ name: '牛乳', storage: '冷蔵庫' }),
      ];

      const result = groupByStorage(inventories);

      expect(result).toHaveLength(1);
      expect(result[0].inventories.map((item) => item.name)).toEqual(['白菜', '牛乳']);
    });
  });

  describe('異常系', () => {
    it('引数を省略すると空配列を返す', () => {
      const result = groupByStorage();

      expect(result).toEqual([]);
    });

    it('storageが空文字の在庫はstorage: 未指定のグループに入る', () => {
      const inventories = [createInventory({ name: '謎の食材', storage: '' })];

      const result = groupByStorage(inventories);

      expect(result).toEqual([{ storage: '未指定', inventories: [inventories[0]] }]);
    });
  });

  describe('境界値', () => {
    it('空配列を渡すと空配列を返す', () => {
      const result = groupByStorage([]);

      expect(result).toEqual([]);
    });

    it('全件が同じ保管場所のときグループは1つになる', () => {
      const inventories = [
        createInventory({ name: '白菜', storage: '冷蔵庫' }),
        createInventory({ name: '牛乳', storage: '冷蔵庫' }),
        createInventory({ name: '豚肉', storage: '冷蔵庫' }),
      ];

      const result = groupByStorage(inventories);

      expect(result).toHaveLength(1);
      expect(result[0].storage).toBe('冷蔵庫');
    });

    it('元の配列を破壊しない', () => {
      const inventories = [
        createInventory({ name: '白菜', storage: '冷蔵庫' }),
        createInventory({ name: '小麦粉', storage: 'パントリー' }),
      ];

      groupByStorage(inventories);

      expect(inventories.map((item) => item.storage)).toEqual(['冷蔵庫', 'パントリー']);
    });
  });
});
