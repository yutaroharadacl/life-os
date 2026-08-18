import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMasterItem } from './createMasterItem';

import { MasterItemDraft } from '@/shared/types';

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createDraft = (overrides: Partial<MasterItemDraft> = {}): MasterItemDraft => ({
  name: '野菜',
  ...overrides,
});

describe('createMasterItem', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('正常系', () => {
    it('draftのnameが戻り値にそのまま入る', () => {
      const draft = createDraft({ name: '果物' });

      const result = createMasterItem(draft);

      expect(result).toMatchObject(draft);
    });

    it('idが空でない文字列として採番される', () => {
      const result = createMasterItem(createDraft());

      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
    });

    it('2回呼ぶと異なるidが採番される', () => {
      const first = createMasterItem(createDraft());
      const second = createMasterItem(createDraft());

      expect(first.id).not.toBe(second.id);
    });
  });

  describe('異常系', () => {
    // crypto.randomUUID は secure context 限定。
    // スマホから http://<LAN-IP>:3000 で開いた場合などは存在しない
    it('crypto.randomUUIDが使えない環境でも例外を投げずにidを採番する', () => {
      vi.stubGlobal('crypto', {});

      const result = createMasterItem(createDraft());

      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
    });

    it('crypto.randomUUIDが使えない環境でも2回呼ぶと異なるidになる', () => {
      vi.stubGlobal('crypto', {});

      const first = createMasterItem(createDraft());
      const second = createMasterItem(createDraft());

      expect(first.id).not.toBe(second.id);
    });
  });
});
