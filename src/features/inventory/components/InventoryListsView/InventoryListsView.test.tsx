import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useInventoryFilterStore } from '../../stores/useInventoryFilterStore';
import { Inventory, InventoryFilterState } from '../../types';

import { InventoryListsView } from './InventoryListsView';

import { Category, StorageLocation } from '@/shared/types';

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

// InventoryFilterBar・InventoryStorageTabs は useInventoryFilterStore を直接参照するため、テストごとに初期状態へ戻す
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

/** 絞り込みパネルは初期状態で閉じているため、フィールドを操作する前に開く */
const openFilterPanel = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: '絞り込み・並び替え' }));
};

// 食品名から対象行（<tr>）を特定する。行内の編集・削除ボタンをスコープして操作するために使う
const getRowByName = (name: string): HTMLElement => {
  const cell = screen.getByRole('rowheader', { name });
  const row = cell.closest('tr');
  if (!row) {
    throw new Error(`行が見つかりません: ${name}`);
  }

  return row;
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

      await openFilterPanel(user);
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

      await openFilterPanel(user);
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

      await openFilterPanel(user);
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

      await openFilterPanel(user);
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

      await openFilterPanel(user);
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

      await openFilterPanel(user);
      await user.selectOptions(screen.getByLabelText('カテゴリで絞り込み'), '肉');
      expect(screen.queryByText('白菜')).not.toBeInTheDocument();

      // openModalAndFillValidForm はカテゴリ「野菜」で登録するため、絞り込み条件「肉」とは一致しない
      await openModalAndFillValidForm(user);
      await user.click(screen.getByRole('button', { name: '登録する' }));

      expect(await screen.findByText('牛乳')).toBeInTheDocument();
      expect(screen.getByText('白菜')).toBeInTheDocument();
      expect(screen.getByLabelText('カテゴリで絞り込み')).toHaveValue('');
    });

    it('保管場所タブが表示されている', () => {
      render(
        <InventoryListsView
          initialInventories={[createInventory()]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      expect(screen.getByRole('tab', { name: 'すべて' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: '冷蔵庫' })).toBeInTheDocument();
    });

    it('保管場所タブで特定の保管場所を選ぶとその保管場所の在庫のみが表示される', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[
            createInventory({ id: '1', name: '白菜', storage: '冷蔵庫' }),
            createInventory({ id: '2', name: '冷凍餃子', storage: '冷凍庫' }),
          ]}
          categories={categories}
          storageLocations={[...storageLocations, { id: 's2', name: '冷凍庫' }]}
        />,
      );

      await user.click(screen.getByRole('tab', { name: '冷蔵庫' }));

      expect(screen.getByText('白菜')).toBeInTheDocument();
      expect(screen.queryByText('冷凍餃子')).not.toBeInTheDocument();
    });

    it('すべてタブに戻すと全保管場所の在庫が再びグルーピング表示される', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[
            createInventory({ id: '1', name: '白菜', storage: '冷蔵庫' }),
            createInventory({ id: '2', name: '冷凍餃子', storage: '冷凍庫' }),
          ]}
          categories={categories}
          storageLocations={[...storageLocations, { id: 's2', name: '冷凍庫' }]}
        />,
      );

      await user.click(screen.getByRole('tab', { name: '冷蔵庫' }));
      await user.click(screen.getByRole('tab', { name: 'すべて' }));

      expect(screen.getByText('白菜')).toBeInTheDocument();
      expect(screen.getByText('冷凍餃子')).toBeInTheDocument();
    });

    it('一覧の各行に編集・削除ボタンが表示される', () => {
      render(
        <InventoryListsView
          initialInventories={[createInventory({ name: '白菜' })]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      const row = getRowByName('白菜');
      expect(within(row).getByRole('button', { name: '編集' })).toBeInTheDocument();
      expect(within(row).getByRole('button', { name: '削除' })).toBeInTheDocument();
    });

    it('編集ボタンを押すと編集モーダルが開きタイトルが在庫を編集、送信ボタンが更新するになる', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[createInventory({ name: '白菜' })]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.click(within(getRowByName('白菜')).getByRole('button', { name: '編集' }));

      expect(screen.getByRole('dialog', { name: '在庫を編集' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '更新する' })).toBeInTheDocument();
    });

    it('編集モーダルの各入力欄に対象在庫の現在値が初期表示される', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[
            createInventory({
              name: '白菜',
              category: '野菜',
              storage: '冷蔵庫',
              quantity: 2,
              expirationDate: '2026-08-20',
              purchaseDate: '2026-08-03',
              memo: '半分使用済み',
            }),
          ]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.click(within(getRowByName('白菜')).getByRole('button', { name: '編集' }));

      expect(screen.getByLabelText('食品名')).toHaveValue('白菜');
      expect(screen.getByLabelText('カテゴリ')).toHaveValue('野菜');
      expect(screen.getByLabelText('保管場所')).toHaveValue('冷蔵庫');
      expect(screen.getByLabelText('数量')).toHaveValue(2);
      expect(screen.getByLabelText('期限')).toHaveValue('2026-08-20');
      expect(screen.getByLabelText('購入日')).toHaveValue('2026-08-03');
      expect(screen.getByLabelText('メモ')).toHaveValue('半分使用済み');
    });

    it('数量だけを変更して更新するを押すと一覧の当該行の数量が更新される', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[createInventory({ name: '白菜', quantity: 1 })]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.click(within(getRowByName('白菜')).getByRole('button', { name: '編集' }));
      await user.clear(screen.getByLabelText('数量'));
      await user.type(screen.getByLabelText('数量'), '5');
      await user.click(screen.getByRole('button', { name: '更新する' }));

      await waitFor(() => {
        expect(within(getRowByName('白菜')).getByText('5')).toBeInTheDocument();
      });
    });

    it('保管場所を冷蔵庫から冷凍庫に変更して更新すると対象の行が冷蔵庫グループから消え冷凍庫グループに表示される', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[
            createInventory({ id: '1', name: '白菜', storage: '冷蔵庫' }),
            createInventory({ id: '2', name: '牛乳', storage: '冷蔵庫' }),
          ]}
          categories={categories}
          storageLocations={[...storageLocations, { id: 's2', name: '冷凍庫' }]}
        />,
      );

      await user.click(within(getRowByName('白菜')).getByRole('button', { name: '編集' }));
      await user.selectOptions(screen.getByLabelText('保管場所'), '冷凍庫');
      await user.click(screen.getByRole('button', { name: '更新する' }));

      const frozenSection = await screen.findByRole('region', { name: '冷凍庫' });
      expect(within(frozenSection).getByText('白菜')).toBeInTheDocument();

      const fridgeSection = screen.getByRole('region', { name: '冷蔵庫' });
      expect(within(fridgeSection).queryByText('白菜')).not.toBeInTheDocument();
      expect(within(fridgeSection).getByText('牛乳')).toBeInTheDocument();
    });

    it('期限を今日から3日後に変更して更新すると残り日数列があと3日に変わる', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[createInventory({ name: '白菜', expirationDate: null })]}
          today={new Date(2026, 7, 6)}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.click(within(getRowByName('白菜')).getByRole('button', { name: '編集' }));
      await user.type(screen.getByLabelText('期限'), '2026-08-09');
      await user.click(screen.getByRole('button', { name: '更新する' }));

      expect(await screen.findByText('あと3日')).toBeInTheDocument();
    });

    it('更新が成功するとモーダルが閉じ一覧上部に更新完了メッセージが表示される', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[createInventory({ name: '白菜' })]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.click(within(getRowByName('白菜')).getByRole('button', { name: '編集' }));
      await user.click(screen.getByRole('button', { name: '更新する' }));

      expect(await screen.findByText('白菜を更新しました')).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('削除ボタンを押すとその行に削除しますか？削除する・キャンセルが表示される', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[createInventory({ name: '白菜' })]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.click(within(getRowByName('白菜')).getByRole('button', { name: '削除' }));

      const row = getRowByName('白菜');
      expect(within(row).getByText('削除しますか？')).toBeInTheDocument();
      expect(within(row).getByRole('button', { name: '削除する' })).toBeInTheDocument();
      expect(within(row).getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });

    it('確認表示で削除するを押すと対象の行が消え全N件の件数表示が1件減る', async () => {
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

      await user.click(within(getRowByName('白菜')).getByRole('button', { name: '削除' }));
      await user.click(screen.getByRole('button', { name: '削除する' }));

      await waitFor(() => {
        expect(screen.queryByText('白菜')).not.toBeInTheDocument();
      });
      expect(screen.getByText('全 1 件')).toBeInTheDocument();
      expect(screen.getByText('豚肉')).toBeInTheDocument();
    });

    it('削除が成功すると一覧上部に削除完了メッセージが表示される', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[createInventory({ name: '白菜' })]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.click(within(getRowByName('白菜')).getByRole('button', { name: '削除' }));
      await user.click(screen.getByRole('button', { name: '削除する' }));

      expect(await screen.findByText('白菜を削除しました')).toBeInTheDocument();
    });

    it('確認表示でキャンセルを押すと在庫は削除されず確認表示だけが閉じてボタン表示に戻る', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[createInventory({ name: '白菜' })]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.click(within(getRowByName('白菜')).getByRole('button', { name: '削除' }));
      await user.click(within(getRowByName('白菜')).getByRole('button', { name: 'キャンセル' }));

      const row = getRowByName('白菜');
      expect(within(row).queryByText('削除しますか？')).not.toBeInTheDocument();
      expect(within(row).getByRole('button', { name: '削除' })).toBeInTheDocument();
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

    it('編集フォームで数量欄を空にして更新するを押すと数量を入力してくださいが表示され一覧は更新されない', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[createInventory({ name: '白菜', quantity: 3 })]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.click(within(getRowByName('白菜')).getByRole('button', { name: '編集' }));
      await user.clear(screen.getByLabelText('数量'));
      await user.click(screen.getByRole('button', { name: '更新する' }));

      expect(await screen.findByText('数量を入力してください')).toBeInTheDocument();
      expect(within(getRowByName('白菜')).getByText('3')).toBeInTheDocument();
    });

    it('編集フォームで数量に0を入れて送信すると数量は1以上999以下で入力してくださいが表示され更新されない', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[createInventory({ name: '白菜', quantity: 3 })]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.click(within(getRowByName('白菜')).getByRole('button', { name: '編集' }));
      await user.clear(screen.getByLabelText('数量'));
      await user.type(screen.getByLabelText('数量'), '0');
      await user.click(screen.getByRole('button', { name: '更新する' }));

      expect(await screen.findByText('数量は1以上999以下で入力してください')).toBeInTheDocument();
      expect(within(getRowByName('白菜')).getByText('3')).toBeInTheDocument();
    });

    it('編集フォームで食品名を空にして送信すると食品名を入力してくださいが表示され更新されない', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[createInventory({ name: '白菜' })]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.click(within(getRowByName('白菜')).getByRole('button', { name: '編集' }));
      await user.clear(screen.getByLabelText('食品名'));
      await user.click(screen.getByRole('button', { name: '更新する' }));

      expect(await screen.findByText('食品名を入力してください')).toBeInTheDocument();
      expect(getRowByName('白菜')).toBeInTheDocument();
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

      await openFilterPanel(user);
      await user.type(screen.getByLabelText('食品名で検索'), '存在しない食品');

      expect(screen.getByText('該当する在庫が見つかりません。')).toBeInTheDocument();
      expect(screen.getByText('全 0 件')).toBeInTheDocument();
    });

    it('在庫が1件のみの状態でその1件を削除すると一覧が登録されている在庫はありません。表示に戻る', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[createInventory({ name: '白菜' })]}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.click(within(getRowByName('白菜')).getByRole('button', { name: '削除' }));
      await user.click(screen.getByRole('button', { name: '削除する' }));

      expect(await screen.findByText('登録されている在庫はありません。')).toBeInTheDocument();
    });

    it('保管場所グループ内に1件しかない在庫を別の保管場所に編集で移動すると元のグループの見出しごと表示から消える', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[createInventory({ name: '白菜', storage: '冷蔵庫' })]}
          categories={categories}
          storageLocations={[...storageLocations, { id: 's2', name: '冷凍庫' }]}
        />,
      );

      await user.click(within(getRowByName('白菜')).getByRole('button', { name: '編集' }));
      await user.selectOptions(screen.getByLabelText('保管場所'), '冷凍庫');
      await user.click(screen.getByRole('button', { name: '更新する' }));

      await screen.findByRole('heading', { name: '冷凍庫' });
      expect(screen.queryByRole('heading', { name: '冷蔵庫' })).not.toBeInTheDocument();
    });

    it('絞り込み中に対象の在庫を削除しても条件に一致しない他の在庫には影響しない', async () => {
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

      await openFilterPanel(user);
      await user.type(screen.getByLabelText('食品名で検索'), '白菜');
      await user.click(within(getRowByName('白菜')).getByRole('button', { name: '削除' }));
      await user.click(screen.getByRole('button', { name: '削除する' }));

      await waitFor(() => {
        expect(screen.queryByText('白菜')).not.toBeInTheDocument();
      });

      await user.clear(screen.getByLabelText('食品名で検索'));

      expect(screen.getByText('豚肉')).toBeInTheDocument();
      expect(screen.getByText('全 1 件')).toBeInTheDocument();
    });

    it('保管場所タブで特定の保管場所を選択中に別の保管場所で在庫を新規登録すると保管場所タブがすべてへ自動的に戻り登録した在庫が一覧に表示される', async () => {
      const user = userEvent.setup();
      render(
        <InventoryListsView
          initialInventories={[createInventory({ id: '1', name: '白菜', storage: '冷蔵庫' })]}
          categories={categories}
          storageLocations={[...storageLocations, { id: 's2', name: '冷凍庫' }]}
        />,
      );

      await user.click(screen.getByRole('tab', { name: '冷蔵庫' }));
      expect(useInventoryFilterStore.getState().storage).toBe('冷蔵庫');

      await user.click(screen.getByRole('button', { name: '在庫を登録' }));
      await user.type(screen.getByLabelText('食品名'), '鶏肉');
      await user.selectOptions(screen.getByLabelText('カテゴリ'), '肉');
      await user.selectOptions(screen.getByLabelText('保管場所'), '冷凍庫');
      await user.click(screen.getByRole('button', { name: '登録する' }));

      expect(await screen.findByText('鶏肉')).toBeInTheDocument();
      expect(useInventoryFilterStore.getState().storage).toBe('');
    });
  });
});
