import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MasterItemList } from './MasterItemList';

import { MasterItem } from '@/shared/types';

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createMasterItem = (overrides: Partial<MasterItem> = {}): MasterItem => ({
  id: '1',
  name: '野菜',
  ...overrides,
});

// 名称から対象行（<tr>）を特定する。行内の編集・削除ボタンをスコープして操作するために使う
const getRowByName = (name: string): HTMLElement => {
  const cell = screen.getByRole('rowheader', { name });
  const row = cell.closest('tr');
  if (!row) {
    throw new Error(`行が見つかりません: ${name}`);
  }

  return row;
};

describe('MasterItemList', () => {
  describe('正常系', () => {
    it('itemsの各名称が一覧に表示される', () => {
      render(
        <MasterItemList
          items={[
            createMasterItem({ id: '1', name: '野菜' }),
            createMasterItem({ id: '2', name: '肉' }),
          ]}
          itemLabel="カテゴリ"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );

      expect(screen.getByText('野菜')).toBeInTheDocument();
      expect(screen.getByText('肉')).toBeInTheDocument();
    });

    it('各行に編集・削除ボタンが表示される', () => {
      render(
        <MasterItemList
          items={[createMasterItem({ name: '野菜' })]}
          itemLabel="カテゴリ"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );

      const row = getRowByName('野菜');
      expect(within(row).getByRole('button', { name: '編集' })).toBeInTheDocument();
      expect(within(row).getByRole('button', { name: '削除' })).toBeInTheDocument();
    });

    it('編集ボタンを押すとonEditが対象項目とともに呼ばれる', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      const item = createMasterItem({ name: '野菜' });
      render(
        <MasterItemList items={[item]} itemLabel="カテゴリ" onEdit={onEdit} onDelete={vi.fn()} />,
      );

      await user.click(within(getRowByName('野菜')).getByRole('button', { name: '編集' }));

      expect(onEdit).toHaveBeenCalledWith(item);
    });

    it('削除ボタンを押して削除するを押すとonDeleteが対象項目とともに呼ばれる', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      const item = createMasterItem({ name: '野菜' });
      render(
        <MasterItemList items={[item]} itemLabel="カテゴリ" onEdit={vi.fn()} onDelete={onDelete} />,
      );

      await user.click(within(getRowByName('野菜')).getByRole('button', { name: '削除' }));
      await user.click(screen.getByRole('button', { name: '削除する' }));

      expect(onDelete).toHaveBeenCalledWith(item);
    });
  });

  describe('境界値', () => {
    it('itemsが空配列のとき登録されている${itemLabel}はありません。が表示される', () => {
      render(
        <MasterItemList items={[]} itemLabel="カテゴリ" onEdit={vi.fn()} onDelete={vi.fn()} />,
      );

      expect(screen.getByText('登録されているカテゴリはありません。')).toBeInTheDocument();
    });

    it('itemsを省略したとき登録されている${itemLabel}はありません。が表示される', () => {
      render(<MasterItemList itemLabel="保管場所" onEdit={vi.fn()} onDelete={vi.fn()} />);

      expect(screen.getByText('登録されている保管場所はありません。')).toBeInTheDocument();
    });

    it('emptyMessageを渡すとそのメッセージが表示される', () => {
      render(
        <MasterItemList
          items={[]}
          itemLabel="カテゴリ"
          emptyMessage="カテゴリを追加してください"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );

      expect(screen.getByText('カテゴリを追加してください')).toBeInTheDocument();
      expect(screen.queryByText('登録されているカテゴリはありません。')).not.toBeInTheDocument();
    });
  });
});
