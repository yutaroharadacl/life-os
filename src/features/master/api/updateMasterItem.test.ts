import { describe, expect, it } from 'vitest';

import { updateMasterItem } from './updateMasterItem';

import { MasterItemDraft } from '@/shared/types';

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createDraft = (overrides: Partial<MasterItemDraft> = {}): MasterItemDraft => ({
  name: '野菜',
  ...overrides,
});

describe('updateMasterItem', () => {
  describe('正常系', () => {
    it('draftのnameが戻り値にそのまま入る', () => {
      const draft = createDraft({ name: '果物' });

      const result = updateMasterItem('1', draft);

      expect(result).toMatchObject(draft);
    });

    it('指定したidが戻り値のidになる', () => {
      const result = updateMasterItem('category-42', createDraft());

      expect(result.id).toBe('category-42');
    });

    it('名称を変更したdraftを渡すと戻り値に変更後の値が反映される', () => {
      const draft = createDraft({ name: '冷凍食品' });

      const result = updateMasterItem('1', draft);

      expect(result.name).toBe('冷凍食品');
    });
  });

  describe('境界値', () => {
    it('idが空文字でも例外を投げずそのままidに入る', () => {
      const result = updateMasterItem('', createDraft());

      expect(result.id).toBe('');
    });
  });
});
