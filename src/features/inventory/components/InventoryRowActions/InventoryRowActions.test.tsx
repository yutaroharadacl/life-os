import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Inventory } from '../../types';

import { InventoryRowActions } from './InventoryRowActions';

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

describe('InventoryRowActions', () => {
  describe('正常系', () => {
    it('編集・削除ボタンが表示される', () => {
      render(
        <InventoryRowActions inventory={createInventory()} onEdit={vi.fn()} onDelete={vi.fn()} />,
      );

      expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
    });

    it('編集ボタンを押すとonEditが対象の在庫とともに呼ばれる', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      const inventory = createInventory({ id: '2', name: '牛乳' });
      render(<InventoryRowActions inventory={inventory} onEdit={onEdit} onDelete={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: '編集' }));

      expect(onEdit).toHaveBeenCalledWith(inventory);
    });

    it('削除ボタンを押すと削除しますか？削除する・キャンセルが表示される', async () => {
      const user = userEvent.setup();
      render(
        <InventoryRowActions inventory={createInventory()} onEdit={vi.fn()} onDelete={vi.fn()} />,
      );

      await user.click(screen.getByRole('button', { name: '削除' }));

      expect(screen.getByText('削除しますか？')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '削除する' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });

    it('確認表示で削除するを押すとonDeleteが対象の在庫とともに呼ばれる', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      const inventory = createInventory({ id: '3', name: '豚肉' });
      render(<InventoryRowActions inventory={inventory} onEdit={vi.fn()} onDelete={onDelete} />);

      await user.click(screen.getByRole('button', { name: '削除' }));
      await user.click(screen.getByRole('button', { name: '削除する' }));

      expect(onDelete).toHaveBeenCalledWith(inventory);
    });

    it('確認表示でキャンセルを押すと確認表示が閉じ削除ボタン表示に戻る', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(
        <InventoryRowActions inventory={createInventory()} onEdit={vi.fn()} onDelete={onDelete} />,
      );

      await user.click(screen.getByRole('button', { name: '削除' }));
      await user.click(screen.getByRole('button', { name: 'キャンセル' }));

      expect(screen.queryByText('削除しますか？')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
      expect(onDelete).not.toHaveBeenCalled();
    });
  });

  describe('境界値', () => {
    it('確認表示中は削除するを押すまでonDeleteが呼ばれない', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(
        <InventoryRowActions inventory={createInventory()} onEdit={vi.fn()} onDelete={onDelete} />,
      );

      await user.click(screen.getByRole('button', { name: '削除' }));

      expect(onDelete).not.toHaveBeenCalled();
    });
  });
});
