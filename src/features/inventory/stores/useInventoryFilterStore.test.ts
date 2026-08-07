import { beforeEach, describe, expect, it } from 'vitest';

import { InventoryFilterState } from '../types';

import { useInventoryFilterStore } from './useInventoryFilterStore';

/** ストアの初期状態。テストごとにこの状態へリセットする */
const initialFilterState: InventoryFilterState = {
  category: '',
  keyword: '',
  sortOrder: 'expirationAsc',
  storage: '',
};

beforeEach(() => {
  useInventoryFilterStore.setState(initialFilterState);
});

describe('useInventoryFilterStore', () => {
  describe('正常系', () => {
    it('初期状態はキーワード・カテゴリ・保管場所が空文字、並び替えが期限が近い順になる', () => {
      const state = useInventoryFilterStore.getState();

      expect(state.keyword).toBe('');
      expect(state.category).toBe('');
      expect(state.storage).toBe('');
      expect(state.sortOrder).toBe('expirationAsc');
    });

    it('setKeywordを呼ぶとkeywordだけが更新される', () => {
      useInventoryFilterStore.getState().setKeyword('牛乳');

      const state = useInventoryFilterStore.getState();
      expect(state.keyword).toBe('牛乳');
      expect(state.category).toBe('');
      expect(state.storage).toBe('');
      expect(state.sortOrder).toBe('expirationAsc');
    });

    it('setCategoryを呼ぶとcategoryだけが更新される', () => {
      useInventoryFilterStore.getState().setCategory('野菜');

      const state = useInventoryFilterStore.getState();
      expect(state.category).toBe('野菜');
      expect(state.keyword).toBe('');
      expect(state.storage).toBe('');
    });

    it('setStorageを呼ぶとstorageだけが更新される', () => {
      useInventoryFilterStore.getState().setStorage('冷蔵庫');

      const state = useInventoryFilterStore.getState();
      expect(state.storage).toBe('冷蔵庫');
      expect(state.keyword).toBe('');
      expect(state.category).toBe('');
    });

    it('setSortOrderを呼ぶとsortOrderだけが更新される', () => {
      useInventoryFilterStore.getState().setSortOrder('nameAsc');

      const state = useInventoryFilterStore.getState();
      expect(state.sortOrder).toBe('nameAsc');
      expect(state.keyword).toBe('');
    });

    it('resetFiltersを呼ぶとkeyword・category・storageが初期値に戻る', () => {
      const { setCategory, setKeyword, setStorage } = useInventoryFilterStore.getState();
      setKeyword('牛乳');
      setCategory('乳製品');
      setStorage('冷蔵庫');

      useInventoryFilterStore.getState().resetFilters();

      const state = useInventoryFilterStore.getState();
      expect(state.keyword).toBe('');
      expect(state.category).toBe('');
      expect(state.storage).toBe('');
    });

    it('resetFiltersを呼んでもsortOrderは変わらない', () => {
      useInventoryFilterStore.getState().setSortOrder('nameAsc');

      useInventoryFilterStore.getState().resetFilters();

      expect(useInventoryFilterStore.getState().sortOrder).toBe('nameAsc');
    });
  });
});
