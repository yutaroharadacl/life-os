import { describe, expect, it } from 'vitest';

import { Inventory } from '../types';

import { toInventoryFormValues } from './toInventoryFormValues';

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createInventory = (overrides: Partial<Inventory> = {}): Inventory => ({
  category: '野菜',
  expirationDate: '2026-08-20',
  id: '1',
  memo: '',
  name: '白菜',
  purchaseDate: '2026-08-03',
  quantity: 1,
  storage: '冷蔵庫',
  ...overrides,
});

describe('toInventoryFormValues', () => {
  describe('正常系', () => {
    it('数量の数値が文字列に変換される', () => {
      const inventory = createInventory({ quantity: 3 });

      const result = toInventoryFormValues(inventory);

      expect(result.quantity).toBe('3');
    });

    it('期限が2026-09-01のときexpirationDateがその文字列のまま入る', () => {
      const inventory = createInventory({ expirationDate: '2026-09-01' });

      const result = toInventoryFormValues(inventory);

      expect(result.expirationDate).toBe('2026-09-01');
    });

    it('食品名・カテゴリ・保管場所・購入日・メモがそのまま入る', () => {
      const inventory = createInventory({
        name: '牛乳',
        category: '乳製品',
        storage: '冷蔵庫',
        purchaseDate: '2026-08-05',
        memo: '賞味期限に注意',
      });

      const result = toInventoryFormValues(inventory);

      expect(result).toMatchObject({
        name: '牛乳',
        category: '乳製品',
        storage: '冷蔵庫',
        purchaseDate: '2026-08-05',
        memo: '賞味期限に注意',
      });
    });

    it('戻り値にidが含まれない', () => {
      const inventory = createInventory();

      const result = toInventoryFormValues(inventory);

      expect(result).not.toHaveProperty('id');
    });
  });

  describe('境界値', () => {
    it('expirationDateがnullのとき変換後の値が空文字になる', () => {
      const inventory = createInventory({ expirationDate: null });

      const result = toInventoryFormValues(inventory);

      expect(result.expirationDate).toBe('');
    });

    it('memoが空文字のときmemoが空文字のまま入る', () => {
      const inventory = createInventory({ memo: '' });

      const result = toInventoryFormValues(inventory);

      expect(result.memo).toBe('');
    });

    it('newCategoryNameが空文字で初期化される（編集時は常に空欄から始まる）', () => {
      const inventory = createInventory();

      const result = toInventoryFormValues(inventory);

      expect(result.newCategoryName).toBe('');
    });

    it('newStorageNameが空文字で初期化される（編集時は常に空欄から始まる）', () => {
      const inventory = createInventory();

      const result = toInventoryFormValues(inventory);

      expect(result.newStorageName).toBe('');
    });
  });
});
