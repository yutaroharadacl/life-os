import { describe, expect, it } from 'vitest';

import { Inventory } from '../types';

import { groupByStorage } from './groupeInventories';

const createInventory = (overrides: Partial<Inventory> = {}): Inventory => ({
  category: '野菜',
  expirationDate: null,
  name: '白菜',
  purchaseDate: '2026/08/03',
  quantity: 1,
  storage: '冷蔵庫',
  ...overrides,
});

describe('groupByStorage', () => {
  it('保管場所ごとに在庫をグループ化する', () => {
    // Arrange
    const inventories = [
      createInventory({ name: '白菜', storage: '冷蔵庫' }),
      createInventory({ name: '牛乳', storage: '冷蔵庫' }),
      createInventory({ name: '小麦粉', storage: 'パントリー' }),
    ];

    // Act
    const result = groupByStorage(inventories);

    // Assert
    expect(Object.keys(result)).toEqual(['冷蔵庫', 'パントリー']);
    expect(result['冷蔵庫'].map((item) => item.name)).toEqual(['白菜', '牛乳']);
    expect(result['パントリー'].map((item) => item.name)).toEqual(['小麦粉']);
  });

  it('保管場所が空文字の在庫は「未指定」にまとめる', () => {
    const inventories = [createInventory({ name: '謎の食材', storage: '' })];

    const result = groupByStorage(inventories);

    expect(result['未指定'].map((item) => item.name)).toEqual(['謎の食材']);
  });

  it('空配列を渡すと空オブジェクトを返す', () => {
    expect(groupByStorage([])).toEqual({});
  });

  it('引数を省略すると空オブジェクトを返す', () => {
    expect(groupByStorage()).toEqual({});
  });
});
