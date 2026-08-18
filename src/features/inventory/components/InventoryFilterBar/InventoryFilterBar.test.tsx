import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useInventoryFilterStore } from '../../stores/useInventoryFilterStore';
import { InventoryFilterState } from '../../types';

import { InventoryFilterBar } from './InventoryFilterBar';

import { Category } from '@/shared/types';

const categories: Category[] = [
  { id: 'c1', name: '野菜' },
  { id: 'c2', name: '肉' },
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

/** パネルは初期状態で閉じているため、フィールドを操作する前に開く */
const openPanel = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: '絞り込み・並び替え' }));
};

describe('InventoryFilterBar', () => {
  describe('正常系', () => {
    it('初期状態ではキーワード欄・カテゴリ選択・並び替え選択が表示されていない', () => {
      render(<InventoryFilterBar categories={categories} />);

      expect(screen.queryByLabelText('食品名で検索')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('カテゴリで絞り込み')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('並び替え')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '絞り込みをクリア' })).not.toBeInTheDocument();
    });

    it('保管場所のselectは表示されない', async () => {
      const user = userEvent.setup();
      render(<InventoryFilterBar categories={categories} />);

      await openPanel(user);

      expect(screen.queryByLabelText('保管場所で絞り込み')).not.toBeInTheDocument();
    });

    it('開閉トグルボタンを押すとキーワード欄・カテゴリ選択・並び替え選択・クリアボタンが表示される', async () => {
      const user = userEvent.setup();
      render(<InventoryFilterBar categories={categories} />);

      await openPanel(user);

      expect(screen.getByLabelText('食品名で検索')).toBeInTheDocument();
      expect(screen.getByLabelText('カテゴリで絞り込み')).toBeInTheDocument();
      expect(screen.getByLabelText('並び替え')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '絞り込みをクリア' })).toBeInTheDocument();
    });

    it('開いている状態でトグルボタンを押すと閉じる', async () => {
      const user = userEvent.setup();
      render(<InventoryFilterBar categories={categories} />);

      await openPanel(user);
      expect(screen.getByLabelText('食品名で検索')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '絞り込み・並び替え' }));

      expect(screen.queryByLabelText('食品名で検索')).not.toBeInTheDocument();
    });

    it('categoriesの各名称がすべてに続いてoptionとして表示される', async () => {
      const user = userEvent.setup();
      render(<InventoryFilterBar categories={categories} />);

      await openPanel(user);

      const select = screen.getByLabelText('カテゴリで絞り込み');
      const options = within(select).getAllByRole('option');
      expect(options.map((option) => option.textContent)).toEqual(['すべて', '野菜', '肉']);
    });

    it('キーワード欄に入力するとuseInventoryFilterStoreのkeywordが更新される', async () => {
      const user = userEvent.setup();
      render(<InventoryFilterBar categories={categories} />);

      await openPanel(user);
      await user.type(screen.getByLabelText('食品名で検索'), '牛乳');

      expect(useInventoryFilterStore.getState().keyword).toBe('牛乳');
    });

    it('カテゴリを選択するとuseInventoryFilterStoreのcategoryが更新される', async () => {
      const user = userEvent.setup();
      render(<InventoryFilterBar categories={categories} />);

      await openPanel(user);
      await user.selectOptions(screen.getByLabelText('カテゴリで絞り込み'), '野菜');

      expect(useInventoryFilterStore.getState().category).toBe('野菜');
    });

    it('並び替えを選択するとuseInventoryFilterStoreのsortOrderが更新される', async () => {
      const user = userEvent.setup();
      render(<InventoryFilterBar categories={categories} />);

      await openPanel(user);
      await user.selectOptions(screen.getByLabelText('並び替え'), '食品名順');

      expect(useInventoryFilterStore.getState().sortOrder).toBe('nameAsc');
    });

    it('絞り込みをクリアを押すとキーワード・カテゴリが初期値に戻る', async () => {
      const user = userEvent.setup();
      render(<InventoryFilterBar categories={categories} />);

      await openPanel(user);
      await user.type(screen.getByLabelText('食品名で検索'), '牛乳');
      await user.selectOptions(screen.getByLabelText('カテゴリで絞り込み'), '野菜');

      await user.click(screen.getByRole('button', { name: '絞り込みをクリア' }));

      const state = useInventoryFilterStore.getState();
      expect(state.keyword).toBe('');
      expect(state.category).toBe('');
    });
  });

  describe('境界値', () => {
    it('categoriesを省略しても選択肢がすべてのみでクラッシュしない', async () => {
      const user = userEvent.setup();
      render(<InventoryFilterBar />);

      await openPanel(user);

      const categorySelect = screen.getByLabelText('カテゴリで絞り込み');
      expect(
        within(categorySelect)
          .getAllByRole('option')
          .map((option) => option.textContent),
      ).toEqual(['すべて']);
    });
  });
});
