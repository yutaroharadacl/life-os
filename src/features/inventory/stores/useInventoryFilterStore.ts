import { create } from 'zustand';

import { InventoryFilterState, InventoryFilterStore } from '../types';

const initialFilterState: InventoryFilterState = {
  keyword: '',
  category: '',
  storage: '',
  sortOrder: 'expirationAsc',
};

/** 在庫一覧の絞り込み・並び替え条件を保持するストア */
export const useInventoryFilterStore = create<InventoryFilterStore>((set) => ({
  ...initialFilterState,
  setKeyword: (keyword) => set({ keyword }),
  setCategory: (category) => set({ category }),
  setStorage: (storage) => set({ storage }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  resetFilters: () =>
    set({
      keyword: initialFilterState.keyword,
      category: initialFilterState.category,
      storage: initialFilterState.storage,
    }),
}));
