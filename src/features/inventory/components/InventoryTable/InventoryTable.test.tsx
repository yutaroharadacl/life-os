import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Inventory } from '../../types';

import { InventoryTable } from './InventoryTable';

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

// テストでは基準日を固定し、システム日付に依存させない。
// 実装はローカルタイムの年月日で判定するため、基準日もローカル日付で作る
// （new Date('2026-08-06') は UTC 深夜のため、UTC より遅れたタイムゾーンでは前日になる）
const today = new Date(2026, 7, 6);

describe('InventoryTable', () => {
  describe('正常系', () => {
    it('保管場所が2種類の在庫を渡すと表が2つ表示される', () => {
      const inventories = [
        createInventory({ id: '1', storage: '冷蔵庫' }),
        createInventory({ id: '2', storage: 'パントリー' }),
      ];

      render(<InventoryTable inventories={inventories} today={today} />);

      expect(screen.getAllByRole('table')).toHaveLength(2);
    });

    it('保管場所名が見出しとして表示される', () => {
      const inventories = [createInventory({ storage: '冷蔵庫' })];

      render(<InventoryTable inventories={inventories} today={today} />);

      expect(screen.getByRole('heading', { name: '冷蔵庫' })).toBeInTheDocument();
    });

    it('保管場所名に空白が含まれてもセクションのアクセシブル名になる', () => {
      const inventories = [createInventory({ storage: '冷蔵庫 上段' })];

      render(<InventoryTable inventories={inventories} today={today} />);

      expect(screen.getByRole('region', { name: '冷蔵庫 上段' })).toBeInTheDocument();
    });

    it('同じ保管場所の在庫3件を渡すと行がヘッダ行を含め4行になる', () => {
      const inventories = [
        createInventory({ id: '1', name: '白菜', storage: '冷蔵庫' }),
        createInventory({ id: '2', name: '牛乳', storage: '冷蔵庫' }),
        createInventory({ id: '3', name: '豚肉', storage: '冷蔵庫' }),
      ];

      render(<InventoryTable inventories={inventories} today={today} />);

      const table = screen.getByRole('table');
      expect(within(table).getAllByRole('row')).toHaveLength(4);
    });

    it('食品名・カテゴリ・数量・期限がテキストとして表示される', () => {
      const inventories = [
        createInventory({
          category: '肉',
          expirationDate: '2026-08-09',
          name: '豚こま肉',
          quantity: 2,
        }),
      ];

      render(<InventoryTable inventories={inventories} today={today} />);

      expect(screen.getByText('豚こま肉')).toBeInTheDocument();
      expect(screen.getByText('肉')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('2026/08/09')).toBeInTheDocument();
    });

    it('全3件が表示される', () => {
      const inventories = [
        createInventory({ id: '1', storage: '冷蔵庫' }),
        createInventory({ id: '2', storage: '冷蔵庫' }),
        createInventory({ id: '3', storage: 'パントリー' }),
      ];

      render(<InventoryTable inventories={inventories} today={today} />);

      expect(screen.getByText('全 3 件')).toBeInTheDocument();
    });

    it('期限切れの在庫の行にN日超過が表示される', () => {
      const inventories = [createInventory({ expirationDate: '2026-08-03' })];

      render(<InventoryTable inventories={inventories} today={today} />);

      expect(screen.getByText('3日超過')).toBeInTheDocument();
    });

    it('期限なしの在庫の行になしと購入からN日が表示される', () => {
      const inventories = [createInventory({ expirationDate: null, purchaseDate: '2026-08-01' })];

      render(<InventoryTable inventories={inventories} today={today} />);

      expect(screen.getByText('なし')).toBeInTheDocument();
      expect(screen.getByText('購入から5日')).toBeInTheDocument();
    });

    it('todayを固定して渡すとその基準日で残り日数が計算される', () => {
      const inventories = [createInventory({ expirationDate: '2026-08-16' })];

      render(<InventoryTable inventories={inventories} today={new Date(2026, 7, 6)} />);

      expect(screen.getByText('あと10日')).toBeInTheDocument();
    });

    it('各表の中で期限が近い順に行が並ぶ', () => {
      const inventories = [
        createInventory({ id: '1', name: '遠い', expirationDate: '2026-08-20' }),
        createInventory({ id: '2', name: '近い', expirationDate: '2026-08-08' }),
      ];

      render(<InventoryTable inventories={inventories} today={today} />);

      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      // 1行目はヘッダ行なので、2行目が最も期限の近い在庫になる
      expect(within(rows[1]).getByText('近い')).toBeInTheDocument();
    });

    it('sortOrderにnameAscを渡すとグループ内の行が食品名の昇順に並ぶ', () => {
      const inventories = [
        createInventory({ id: '1', name: 'う', expirationDate: '2026-08-06' }),
        createInventory({ id: '2', name: 'あ', expirationDate: '2026-08-20' }),
        createInventory({ id: '3', name: 'い', expirationDate: '2026-08-10' }),
      ];

      render(<InventoryTable inventories={inventories} today={today} sortOrder="nameAsc" />);

      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      expect(within(rows[1]).getByText('あ')).toBeInTheDocument();
      expect(within(rows[2]).getByText('い')).toBeInTheDocument();
      expect(within(rows[3]).getByText('う')).toBeInTheDocument();
    });
  });

  describe('異常系', () => {
    it('storageが空文字の在庫は未指定という見出しのセクションに入る', () => {
      const inventories = [createInventory({ storage: '' })];

      render(<InventoryTable inventories={inventories} today={today} />);

      expect(screen.getByRole('heading', { name: '未指定' })).toBeInTheDocument();
    });

    it('categoryが空文字の在庫は未指定と表示される', () => {
      const inventories = [createInventory({ category: '' })];

      render(<InventoryTable inventories={inventories} today={today} />);

      expect(screen.getByText('未指定')).toBeInTheDocument();
    });
  });

  describe('境界値', () => {
    it('0件のとき登録されている在庫はありませんが表示され、tableロールが存在しない', () => {
      render(<InventoryTable inventories={[]} today={today} />);

      expect(screen.getByText('登録されている在庫はありません。')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('inventoriesを省略したとき0件と同じ表示になる', () => {
      render(<InventoryTable today={today} />);

      expect(screen.getByText('登録されている在庫はありません。')).toBeInTheDocument();
      expect(screen.getByText('全 0 件')).toBeInTheDocument();
    });

    it('1件のとき全1件と表示され、表が1つだけ描画される', () => {
      const inventories = [createInventory()];

      render(<InventoryTable inventories={inventories} today={today} />);

      expect(screen.getByText('全 1 件')).toBeInTheDocument();
      expect(screen.getAllByRole('table')).toHaveLength(1);
    });

    it('actionに要素を渡すとヘッダ内に描画される', () => {
      render(
        <InventoryTable
          inventories={[createInventory()]}
          today={today}
          action={<button type="button">在庫を登録</button>}
        />,
      );

      expect(screen.getByRole('button', { name: '在庫を登録' })).toBeInTheDocument();
    });

    it('actionを省略しても既存の表示が壊れない', () => {
      render(<InventoryTable inventories={[createInventory()]} today={today} />);

      expect(screen.getByRole('heading', { name: '在庫一覧' })).toBeInTheDocument();
      expect(screen.getByText('全 1 件')).toBeInTheDocument();
    });

    it('emptyMessageを渡すと0件のときその文言が表示される', () => {
      render(
        <InventoryTable
          inventories={[]}
          today={today}
          emptyMessage="該当する在庫が見つかりません。"
        />,
      );

      expect(screen.getByText('該当する在庫が見つかりません。')).toBeInTheDocument();
      expect(screen.queryByText('登録されている在庫はありません。')).not.toBeInTheDocument();
    });

    it('sortOrderとemptyMessageを省略しても既存の表示が壊れない', () => {
      const inventories = [createInventory({ expirationDate: '2026-08-10' })];

      render(<InventoryTable inventories={inventories} today={today} />);

      expect(screen.getByText('全 1 件')).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('onEdit・onDeleteを省略しても表がクラッシュせず描画される', () => {
      render(<InventoryTable inventories={[createInventory()]} today={today} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('操作列', () => {
    it('操作列の見出しが表示される', () => {
      render(
        <InventoryTable
          inventories={[createInventory()]}
          today={today}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );

      expect(screen.getByRole('columnheader', { name: '操作' })).toBeInTheDocument();
    });

    it('各行に編集・削除ボタンが表示される', () => {
      render(
        <InventoryTable
          inventories={[createInventory()]}
          today={today}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );

      expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
    });

    it('編集ボタンを押すとonEditが対象の在庫とともに呼ばれる', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      const inventory = createInventory({ id: '1', name: '白菜' });
      render(
        <InventoryTable
          inventories={[inventory]}
          today={today}
          onEdit={onEdit}
          onDelete={vi.fn()}
        />,
      );

      await user.click(screen.getByRole('button', { name: '編集' }));

      expect(onEdit).toHaveBeenCalledWith(inventory);
    });

    it('削除ボタンを押して削除するを押すとonDeleteが対象の在庫とともに呼ばれる', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      const inventory = createInventory({ id: '1', name: '白菜' });
      render(
        <InventoryTable
          inventories={[inventory]}
          today={today}
          onEdit={vi.fn()}
          onDelete={onDelete}
        />,
      );

      await user.click(screen.getByRole('button', { name: '削除' }));
      await user.click(screen.getByRole('button', { name: '削除する' }));

      expect(onDelete).toHaveBeenCalledWith(inventory);
    });
  });
});
