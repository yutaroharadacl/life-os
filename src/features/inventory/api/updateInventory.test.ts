import { describe, expect, it } from 'vitest';

import { InventoryDraft } from '../types';

import { updateInventory } from './updateInventory';

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createDraft = (overrides: Partial<InventoryDraft> = {}): InventoryDraft => ({
  category: '野菜',
  expirationDate: null,
  memo: '',
  name: '白菜',
  purchaseDate: '2026-08-06',
  quantity: 1,
  storage: '冷蔵庫',
  ...overrides,
});

describe('updateInventory', () => {
  describe('正常系', () => {
    it('draftの各フィールドが戻り値にそのまま入る', () => {
      const draft = createDraft({ name: '牛乳', quantity: 2 });

      const result = updateInventory('1', draft);

      expect(result).toMatchObject(draft);
    });

    it('指定したidが戻り値のidになる', () => {
      const result = updateInventory('inventory-42', createDraft());

      expect(result.id).toBe('inventory-42');
    });

    it('数量・保管場所を変更したdraftを渡すと戻り値に変更後の値が反映される', () => {
      const draft = createDraft({ quantity: 5, storage: '冷凍庫' });

      const result = updateInventory('1', draft);

      expect(result.quantity).toBe(5);
      expect(result.storage).toBe('冷凍庫');
    });
  });

  describe('境界値', () => {
    it('idが空文字でも例外を投げずそのままidに入る', () => {
      const result = updateInventory('', createDraft());

      expect(result.id).toBe('');
    });
  });
});
