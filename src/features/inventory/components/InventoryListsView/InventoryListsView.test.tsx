import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useInventoryFilterStore } from '../../stores/useInventoryFilterStore';
import { Category, Inventory, InventoryFilterState, StorageLocation } from '../../types';

import { InventoryListsView } from './InventoryListsView';

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createInventory = (overrides: Partial<Inventory> = {}): Inventory => ({
  category: '野菜',
  expirationDate: null,
  id: '1',
  memo: '',
  name: '白菜',
  purchaseDate: '2026-08-03',
  quantity: 1,
  storage: '冷蔵庫',
  ...overrides,
});

const categories: Category[] = [
  { id: 'c1', name: '野菜' },
  { id: 'c2', name: '肉' },
];
const storageLocations: StorageLocation[] = [{ id: 's1', name: '冷蔵庫' }];

// InventoryFilterBar は useInventoryFilterStore を直接参照するため、テストごとに初期状態へ戻す
const initialFilterState: InventoryFilterState = {
  category: '',
  keyword: '',
  sortOrder: 'expirationAsc',
  storage: '',
};

beforeEach(() => {
  useInventoryFilterStore.setState(initialFilterState);
});

const openModalAndFillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: '在庫を登録' }));
  await user.type(screen.getByLabelText('食品名'), '牛乳');
  await user.selectOptions(screen.getByLabelText('カテゴリ'), '野菜');
  await user.selectOptions(screen.getByLabelText('保管場所'), '冷蔵庫');
};

describe('InventoryListsView', () => {
  describe('正常系', () => {
    it('初期表示でinitialInventoriesの在庫が一覧に表示される', () => {
      render(
        <InventoryListsView
          initialInventories={[createInventory({ name: '白菜' })]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      expect(screen.getByText('白菜')).toBeInTheDocument();
    });

    it('在庫を登録ボタンが表示されている', () => {
      render(
        <InventoryListsView
          initialInventories={[]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      expect(screen.getByRole('button', { name: '在庫を登録' })).toBeInTheDocument();
    });

    it('ボタンを押すとダイアログが開く', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.click(screen.getByRole('button', { name: '在庫を登録' }));

      expect(screen.getByRole('dialog', { name: '在庫を登録' })).toBeInTheDocument();
    });

    it('フォームに入力して登録するとその食品名が一覧に表示される', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await openModalAndFillValidForm(user);
      await user.click(screen.getByRole('button', { name: '登録する' }));

      // 送信は useActionState の transition で走るため、反映は次の描画になる
      expect(await screen.findByText('牛乳')).toBeInTheDocument();
    });

    it('登録後にダイアログが閉じる', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await openModalAndFillValidForm(user);
      await user.click(screen.getByRole('button', { name: '登録する' }));

      // 送信は transition で走るため、閉じるのは次の描画になる
      await waitFor(() => {
        expect(screen.queryByLabelText('食品名')).not.toBeInTheDocument();
      });
    });

    it('登録後に完了メッセージが表示される', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await openModalAndFillValidForm(user);
      await user.click(screen.getByRole('button', { name: '登録する' }));

      expect(await screen.findByText('牛乳を登録しました')).toBeInTheDocument();
    });

    it('保管場所冷蔵庫で登録すると冷蔵庫セクションの表に行が増える', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[createInventory({ id: '1', name: '白菜', storage: '冷蔵庫' })]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await openModalAndFillValidForm(user);
      await user.click(screen.getByRole('button', { name: '登録する' }));

      const section = screen.getByRole('region', { name: '冷蔵庫' });
      expect(await within(section).findByText('牛乳')).toBeInTheDocument();
      expect(within(section).getByText('白菜')).toBeInTheDocument();
    });

    it('既存にない保管場所で登録すると新しい保管場所セクションが増える', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[createInventory({ id: '1', name: '白菜', storage: '冷蔵庫' })]}
          categories={categories}
          storageLocations={[...storageLocations, { id: 's2', name: 'パントリー' }]}
        />,
      );

      await user.click(screen.getByRole('button', { name: '在庫を登録' }));
      await user.type(screen.getByLabelText('食品名'), 'パスタ');
      await user.selectOptions(screen.getByLabelText('カテゴリ'), '野菜');
      await user.selectOptions(screen.getByLabelText('保管場所'), 'パントリー');
      await user.click(screen.getByRole('button', { name: '登録する' }));

      expect(await screen.findByRole('heading', { name: 'パントリー' })).toBeInTheDocument();
    });

    it('登録した在庫は保管場所セクション内で期限順の正しい位置に入る', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[
            createInventory({
              id: '1',
              name: '遠い期限',
              storage: '冷蔵庫',
              expirationDate: '2026-12-01',
            }),
          ]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.click(screen.getByRole('button', { name: '在庫を登録' }));
      await user.type(screen.getByLabelText('食品名'), '近い期限');
      await user.selectOptions(screen.getByLabelText('カテゴリ'), '野菜');
      await user.selectOptions(screen.getByLabelText('保管場所'), '冷蔵庫');
      await user.type(screen.getByLabelText('期限'), '2026-08-10');
      await user.click(screen.getByRole('button', { name: '登録する' }));

      await screen.findByText('近い期限');
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      // 1行目はヘッダ行なので、2行目が最も期限の近い在庫になる
      expect(within(rows[1]).getByText('近い期限')).toBeInTheDocument();
    });

    it('todayを渡すとその基準日で残り日数が計算される', () => {
      render(
        <InventoryListsView
          initialInventories={[createInventory({ expirationDate: '2026-08-16' })]}
          today={new Date(2026, 7, 6)}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      expect(screen.getByText('あと10日')).toBeInTheDocument();
    });

    it('全N件の件数が登録後に1増える', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[createInventory({ id: '1' })]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      expect(screen.getByText('全 1 件')).toBeInTheDocument();

      await openModalAndFillValidForm(user);
      await user.click(screen.getByRole('button', { name: '登録する' }));

      expect(await screen.findByText('全 2 件')).toBeInTheDocument();
    });

    it('絞り込みバーが表示されている', () => {
      render(
        <InventoryListsView
          initialInventories={[createInventory()]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      expect(screen.getByRole('search')).toBeInTheDocument();
    });

    it('キーワードを入力すると一致しない在庫が一覧から消える', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[
            createInventory({ id: '1', name: '白菜' }),
            createInventory({ id: '2', name: '豚肉' }),
          ]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.type(screen.getByLabelText('食品名で検索'), '白菜');

      expect(screen.getByText('白菜')).toBeInTheDocument();
      expect(screen.queryByText('豚肉')).not.toBeInTheDocument();
    });

    it('カテゴリを選択すると該当カテゴリの在庫だけが表示される', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[
            createInventory({ id: '1', name: '白菜', category: '野菜' }),
            createInventory({ id: '2', name: '豚肉', category: '肉' }),
          ]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.selectOptions(screen.getByLabelText('カテゴリで絞り込み'), '肉');

      expect(screen.getByText('豚肉')).toBeInTheDocument();
      expect(screen.queryByText('白菜')).not.toBeInTheDocument();
    });

    it('全N件が絞り込み後の件数を表示する', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[
            createInventory({ id: '1', name: '白菜' }),
            createInventory({ id: '2', name: '豚肉' }),
          ]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.type(screen.getByLabelText('食品名で検索'), '白菜');

      expect(screen.getByText('全 1 件')).toBeInTheDocument();
    });

    it('並び替えを変更すると表示順が変わる', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[
            createInventory({
              id: '1',
              name: 'う',
              storage: '冷蔵庫',
              expirationDate: '2026-08-06',
            }),
            createInventory({
              id: '2',
              name: 'あ',
              storage: '冷蔵庫',
              expirationDate: '2026-08-20',
            }),
          ]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.selectOptions(screen.getByLabelText('並び替え'), '食品名順');

      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      expect(within(rows[1]).getByText('あ')).toBeInTheDocument();
    });

    it('絞り込みをクリアを押すと全件表示に戻る', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[
            createInventory({ id: '1', name: '白菜' }),
            createInventory({ id: '2', name: '豚肉' }),
          ]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.type(screen.getByLabelText('食品名で検索'), '白菜');
      await user.click(screen.getByRole('button', { name: '絞り込みをクリア' }));

      expect(screen.getByText('全 2 件')).toBeInTheDocument();
      expect(screen.getByText('豚肉')).toBeInTheDocument();
    });

    it('絞り込み中に登録すると絞り込みがクリアされ新しい在庫と既存の在庫の両方が表示される', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[createInventory({ id: '1', name: '白菜', category: '野菜' })]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.selectOptions(screen.getByLabelText('カテゴリで絞り込み'), '肉');
      expect(screen.queryByText('白菜')).not.toBeInTheDocument();

      // openModalAndFillValidForm はカテゴリ「野菜」で登録するため、絞り込み条件「肉」とは一致しない
      await openModalAndFillValidForm(user);
      await user.click(screen.getByRole('button', { name: '登録する' }));

      expect(await screen.findByText('牛乳')).toBeInTheDocument();
      expect(screen.getByText('白菜')).toBeInTheDocument();
      expect(screen.getByLabelText('カテゴリで絞り込み')).toHaveValue('');
    });
  });

  describe('異常系', () => {
    it('入力エラーのまま登録するを押しても一覧の件数は変わらず入力欄も表示されたまま', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[createInventory({ id: '1' })]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.click(screen.getByRole('button', { name: '在庫を登録' }));
      await user.click(screen.getByRole('button', { name: '登録する' }));

      expect(screen.getByText('全 1 件')).toBeInTheDocument();
      expect(screen.getByLabelText('食品名')).toBeInTheDocument();
    });

    it('ダイアログを閉じてから開き直すと前回入力した内容が残っていない', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.click(screen.getByRole('button', { name: '在庫を登録' }));
      await user.type(screen.getByLabelText('食品名'), '牛乳');
      await user.click(screen.getByRole('button', { name: 'キャンセル' }));

      await user.click(screen.getByRole('button', { name: '在庫を登録' }));

      expect(screen.getByLabelText('食品名')).toHaveValue('');
    });
  });

  describe('境界値', () => {
    it('initialInventoriesを省略したとき空状態が表示され1件登録すると全1件になる', async () => {
      const user = userEvent.setup();
      render(<InventoryListsView categories={categories} storageLocations={storageLocations} />);

      expect(screen.getByText('登録されている在庫はありません。')).toBeInTheDocument();

      await openModalAndFillValidForm(user);
      await user.click(screen.getByRole('button', { name: '登録する' }));

      expect(await screen.findByText('全 1 件')).toBeInTheDocument();
    });

    it('絞り込み結果が0件のとき該当する在庫が見つかりませんが表示される', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[createInventory({ name: '白菜' })]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.type(screen.getByLabelText('食品名で検索'), '存在しない食品');

      expect(screen.getByText('該当する在庫が見つかりません。')).toBeInTheDocument();
      expect(screen.getByText('全 0 件')).toBeInTheDocument();
    });
  });
});
