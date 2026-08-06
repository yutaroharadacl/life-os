import { describe, expect, it } from 'vitest';

import { Inventory } from '../types';

import { sortByExpiration } from './sortInventories';

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

describe('sortByExpiration', () => {
  describe('正常系', () => {
    it('期限ありの在庫が期限の昇順に並ぶ', () => {
      const inventories = [
        createInventory({ name: 'B', expirationDate: '2026-08-10' }),
        createInventory({ name: 'A', expirationDate: '2026-08-06' }),
        createInventory({ name: 'C', expirationDate: '2026-08-20' }),
      ];

      const result = sortByExpiration(inventories);

      expect(result.map((item) => item.name)).toEqual(['A', 'B', 'C']);
    });

    it('期限ありがすべて期限なしより前に並ぶ', () => {
      const inventories = [
        createInventory({ name: '期限なし', expirationDate: null, purchaseDate: '2026-08-01' }),
        createInventory({ name: '期限あり', expirationDate: '2026-08-10' }),
      ];

      const result = sortByExpiration(inventories);

      expect(result.map((item) => item.name)).toEqual(['期限あり', '期限なし']);
    });

    it('期限なしどうしは購入日の昇順に並ぶ', () => {
      const inventories = [
        createInventory({ name: '新しい', expirationDate: null, purchaseDate: '2026-08-05' }),
        createInventory({ name: '古い', expirationDate: null, purchaseDate: '2026-08-01' }),
      ];

      const result = sortByExpiration(inventories);

      expect(result.map((item) => item.name)).toEqual(['古い', '新しい']);
    });
  });

  describe('異常系', () => {
    it('引数を省略すると空配列を返す', () => {
      const result = sortByExpiration();

      expect(result).toEqual([]);
    });
  });

  describe('境界値', () => {
    it('空配列を渡すと空配列を返す', () => {
      const result = sortByExpiration([]);

      expect(result).toEqual([]);
    });

    it('1件のときはそのまま1件を返す', () => {
      const inventories = [createInventory({ name: '白菜' })];

      const result = sortByExpiration(inventories);

      expect(result.map((item) => item.name)).toEqual(['白菜']);
    });

    it('期限が同じ2件は元の順序が保たれる（安定ソート）', () => {
      const inventories = [
        createInventory({ name: '先', expirationDate: '2026-08-10' }),
        createInventory({ name: '後', expirationDate: '2026-08-10' }),
      ];

      const result = sortByExpiration(inventories);

      expect(result.map((item) => item.name)).toEqual(['先', '後']);
    });

    it('元の配列を破壊しない', () => {
      const inventories = [
        createInventory({ name: 'B', expirationDate: '2026-08-10' }),
        createInventory({ name: 'A', expirationDate: '2026-08-06' }),
      ];

      sortByExpiration(inventories);

      expect(inventories.map((item) => item.name)).toEqual(['B', 'A']);
    });
  });
});
