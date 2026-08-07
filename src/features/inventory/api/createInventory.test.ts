import { afterEach, describe, expect, it, vi } from 'vitest';

import { InventoryDraft } from '../types';

import { createInventory } from './createInventory';

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

describe('createInventory', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('正常系', () => {
    it('draftの各フィールドが戻り値にそのまま入る', () => {
      const draft = createDraft({ name: '牛乳', quantity: 2 });

      const result = createInventory(draft);

      expect(result).toMatchObject(draft);
    });

    it('idが空でない文字列として採番される', () => {
      const result = createInventory(createDraft());

      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
    });

    it('2回呼ぶと異なるidが採番される', () => {
      const first = createInventory(createDraft());
      const second = createInventory(createDraft());

      expect(first.id).not.toBe(second.id);
    });
  });

  describe('異常系', () => {
    // crypto.randomUUID は secure context 限定。
    // スマホから http://<LAN-IP>:3000 で開いた場合などは存在しない
    it('crypto.randomUUIDが使えない環境でも例外を投げずにidを採番する', () => {
      vi.stubGlobal('crypto', {});

      const result = createInventory(createDraft());

      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
    });

    it('crypto.randomUUIDが使えない環境でも2回呼ぶと異なるidになる', () => {
      vi.stubGlobal('crypto', {});

      const first = createInventory(createDraft());
      const second = createInventory(createDraft());

      expect(first.id).not.toBe(second.id);
    });
  });
});
