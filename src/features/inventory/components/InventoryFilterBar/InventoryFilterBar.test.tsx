import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useInventoryFilterStore } from '../../stores/useInventoryFilterStore';
import { Category, InventoryFilterState, StorageLocation } from '../../types';

import { InventoryFilterBar } from './InventoryFilterBar';

const categories: Category[] = [
  { id: 'c1', name: '野菜' },
  { id: 'c2', name: '肉' },
];
const storageLocations: StorageLocation[] = [
  { id: 's1', name: '冷蔵庫' },
  { id: 's2', name: '冷凍庫' },
];

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

describe('InventoryFilterBar', () => {
  describe('正常系', () => {
    it('キーワード欄・カテゴリ選択・保管場所選択・並び替え選択がラベルで取得できる', () => {
      render(<InventoryFilterBar categories={categories} storageLocations={storageLocations} />);

      expect(screen.getByLabelText('食品名で検索')).toBeInTheDocument();
      expect(screen.getByLabelText('カテゴリで絞り込み')).toBeInTheDocument();
      expect(screen.getByLabelText('保管場所で絞り込み')).toBeInTheDocument();
      expect(screen.getByLabelText('並び替え')).toBeInTheDocument();
    });

    it('categoriesの各名称がすべてに続いてoptionとして表示される', () => {
      render(<InventoryFilterBar categories={categories} storageLocations={storageLocations} />);

      const select = screen.getByLabelText('カテゴリで絞り込み');
      const options = within(select).getAllByRole('option');
      expect(options.map((option) => option.textContent)).toEqual(['すべて', '野菜', '肉']);
    });

    it('storageLocationsの各名称がすべてに続いてoptionとして表示される', () => {
      render(<InventoryFilterBar categories={categories} storageLocations={storageLocations} />);

      const select = screen.getByLabelText('保管場所で絞り込み');
      const options = within(select).getAllByRole('option');
      expect(options.map((option) => option.textContent)).toEqual(['すべて', '冷蔵庫', '冷凍庫']);
    });

    it('キーワード欄に入力するとuseInventoryFilterStoreのkeywordが更新される', async () => {
      const user = userEvent.setup();
      render(<InventoryFilterBar categories={categories} storageLocations={storageLocations} />);

      await user.type(screen.getByLabelText('食品名で検索'), '牛乳');

      expect(useInventoryFilterStore.getState().keyword).toBe('牛乳');
    });

    it('カテゴリを選択するとuseInventoryFilterStoreのcategoryが更新される', async () => {
      const user = userEvent.setup();
      render(<InventoryFilterBar categories={categories} storageLocations={storageLocations} />);

      await user.selectOptions(screen.getByLabelText('カテゴリで絞り込み'), '野菜');

      expect(useInventoryFilterStore.getState().category).toBe('野菜');
    });

    it('絞り込みをクリアを押すとキーワード・カテゴリ・保管場所が初期値に戻る', async () => {
      const user = userEvent.setup();
      render(<InventoryFilterBar categories={categories} storageLocations={storageLocations} />);

      await user.type(screen.getByLabelText('食品名で検索'), '牛乳');
      await user.selectOptions(screen.getByLabelText('カテゴリで絞り込み'), '野菜');
      await user.selectOptions(screen.getByLabelText('保管場所で絞り込み'), '冷蔵庫');

      await user.click(screen.getByRole('button', { name: '絞り込みをクリア' }));

      const state = useInventoryFilterStore.getState();
      expect(state.keyword).toBe('');
      expect(state.category).toBe('');
      expect(state.storage).toBe('');
    });
  });

  describe('境界値', () => {
    it('categories・storageLocationsを省略しても選択肢がすべてのみでクラッシュしない', () => {
      render(<InventoryFilterBar />);

      const categorySelect = screen.getByLabelText('カテゴリで絞り込み');
      const storageSelect = screen.getByLabelText('保管場所で絞り込み');
      expect(
        within(categorySelect)
          .getAllByRole('option')
          .map((option) => option.textContent),
      ).toEqual(['すべて']);
      expect(
        within(storageSelect)
          .getAllByRole('option')
          .map((option) => option.textContent),
      ).toEqual(['すべて']);
    });
  });
});
