import { describe, expect, it } from 'vitest';

import { Inventory, InventoryFilters } from '../types';

import { filterInventories } from './filterInventories';

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createInventory = (overrides: Partial<Inventory> = {}): Inventory => ({
  category: '野菜',
  expirationDate: null,
  id: '1',
  memo: '',
  name: '白菜',
  purchaseDate: '2026-08-03',
  quantity: 1,
  storage: '冷蔵庫',
  ...overrides,
});

const createFilters = (overrides: Partial<InventoryFilters> = {}): InventoryFilters => ({
  category: '',
  keyword: '',
  storage: '',
  ...overrides,
});

describe('filterInventories', () => {
  describe('正常系', () => {
    it('キーワードが食品名に部分一致する在庫だけが残る', () => {
      const inventories = [
        createInventory({ id: '1', name: '牛乳' }),
        createInventory({ id: '2', name: '豚肉' }),
      ];

      const result = filterInventories(inventories, createFilters({ keyword: '牛' }));

      expect(result.map((item) => item.name)).toEqual(['牛乳']);
    });

    it('カテゴリを指定すると、そのカテゴリの在庫だけが残る', () => {
      const inventories = [
        createInventory({ id: '1', name: '白菜', category: '野菜' }),
        createInventory({ id: '2', name: '豚肉', category: '肉' }),
      ];

      const result = filterInventories(inventories, createFilters({ category: '野菜' }));

      expect(result.map((item) => item.name)).toEqual(['白菜']);
    });

    it('保管場所を指定すると、その保管場所の在庫だけが残る', () => {
      const inventories = [
        createInventory({ id: '1', name: '白菜', storage: '冷蔵庫' }),
        createInventory({ id: '2', name: '冷凍餃子', storage: '冷凍庫' }),
      ];

      const result = filterInventories(inventories, createFilters({ storage: '冷蔵庫' }));

      expect(result.map((item) => item.name)).toEqual(['白菜']);
    });

    it('キーワード・カテゴリ・保管場所を同時に指定すると、すべてを満たす在庫だけが残る（AND）', () => {
      const inventories = [
        createInventory({ id: '1', name: '牛乳', category: '乳製品', storage: '冷蔵庫' }),
        createInventory({ id: '2', name: '牛肉', category: '肉', storage: '冷蔵庫' }),
        createInventory({ id: '3', name: '牛乳', category: '乳製品', storage: '冷凍庫' }),
      ];

      const result = filterInventories(
        inventories,
        createFilters({ category: '乳製品', keyword: '牛乳', storage: '冷蔵庫' }),
      );

      expect(result.map((item) => item.id)).toEqual(['1']);
    });

    it('キーワードが空文字、カテゴリが空文字、保管場所が空文字のとき、全件がそのまま返る', () => {
      const inventories = [
        createInventory({ id: '1', name: '白菜' }),
        createInventory({ id: '2', name: '豚肉', category: '肉', storage: '冷凍庫' }),
      ];

      const result = filterInventories(inventories, createFilters());

      expect(result).toHaveLength(2);
    });
  });

  describe('異常系', () => {
    it('inventoriesを省略すると空配列を返す', () => {
      const result = filterInventories(undefined, createFilters());

      expect(result).toEqual([]);
    });

    it('キーワードの前後に空白があっても除去して比較する', () => {
      const inventories = [createInventory({ name: '牛乳' })];

      const result = filterInventories(inventories, createFilters({ keyword: '  牛乳  ' }));

      expect(result).toHaveLength(1);
    });

    it('大文字小文字を区別しない', () => {
      const inventories = [createInventory({ name: 'Milk' })];

      const result = filterInventories(inventories, createFilters({ keyword: 'milk' }));

      expect(result).toHaveLength(1);
    });
  });

  describe('境界値', () => {
    it('空配列を渡すと空配列を返す', () => {
      const result = filterInventories([], createFilters());

      expect(result).toEqual([]);
    });

    it('一致する在庫が0件のとき空配列を返す', () => {
      const inventories = [createInventory({ name: '白菜' })];

      const result = filterInventories(inventories, createFilters({ keyword: '存在しない食品' }));

      expect(result).toEqual([]);
    });

    it('元の配列を破壊しない', () => {
      const inventories = [
        createInventory({ id: '1', name: '白菜' }),
        createInventory({ id: '2', name: '豚肉' }),
      ];

      filterInventories(inventories, createFilters({ keyword: '白菜' }));

      expect(inventories).toHaveLength(2);
    });
  });
});
