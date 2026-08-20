import { describe, expect, it } from 'vitest';

import { InventoryFormValues } from '../types';

import { toInventoryDraft } from './toInventoryDraft';

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createFormValues = (overrides: Partial<InventoryFormValues> = {}): InventoryFormValues => ({
  category: '野菜',
  expirationDate: '',
  memo: '',
  name: '白菜',
  newCategoryName: '',
  newStorageName: '',
  purchaseDate: '2026-08-06',
  quantity: '1',
  storage: '冷蔵庫',
  ...overrides,
});

describe('toInventoryDraft', () => {
  describe('正常系', () => {
    it('数量の文字列が数値に変換される', () => {
      const values = createFormValues({ quantity: '3' });

      const result = toInventoryDraft(values);

      expect(result.quantity).toBe(3);
    });

    it('期限が2026-09-01のときexpirationDateがその文字列のまま入る', () => {
      const values = createFormValues({ expirationDate: '2026-09-01' });

      const result = toInventoryDraft(values);

      expect(result.expirationDate).toBe('2026-09-01');
    });

    it('食品名の前後の空白が除去される', () => {
      const values = createFormValues({ name: '  牛乳  ' });

      const result = toInventoryDraft(values);

      expect(result.name).toBe('牛乳');
    });

    it('戻り値にidが含まれない', () => {
      const values = createFormValues();

      const result = toInventoryDraft(values);

      expect(result).not.toHaveProperty('id');
    });
  });

  describe('境界値', () => {
    it('期限が空文字のときexpirationDateがnullになる', () => {
      const values = createFormValues({ expirationDate: '' });

      const result = toInventoryDraft(values);

      expect(result.expirationDate).toBeNull();
    });

    it('メモが空文字のときmemoが空文字のまま入る', () => {
      const values = createFormValues({ memo: '' });

      const result = toInventoryDraft(values);

      expect(result.memo).toBe('');
    });
  });
});
