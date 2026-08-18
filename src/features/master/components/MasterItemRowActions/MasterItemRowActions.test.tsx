import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MasterItemRowActions } from './MasterItemRowActions';

import { MasterItem } from '@/shared/types';

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createMasterItem = (overrides: Partial<MasterItem> = {}): MasterItem => ({
  id: '1',
  name: '野菜',
  ...overrides,
});

describe('MasterItemRowActions', () => {
  describe('正常系', () => {
    it('編集・削除ボタンが表示される', () => {
      render(
        <MasterItemRowActions item={createMasterItem()} onEdit={vi.fn()} onDelete={vi.fn()} />,
      );

      expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
    });

    it('編集ボタンを押すとonEditが対象の項目とともに呼ばれる', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      const item = createMasterItem({ id: '2', name: '肉' });
      render(<MasterItemRowActions item={item} onEdit={onEdit} onDelete={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: '編集' }));

      expect(onEdit).toHaveBeenCalledWith(item);
    });

    it('削除ボタンを押すと削除しますか？削除する・キャンセルが表示される', async () => {
      const user = userEvent.setup();
      render(
        <MasterItemRowActions item={createMasterItem()} onEdit={vi.fn()} onDelete={vi.fn()} />,
      );

      await user.click(screen.getByRole('button', { name: '削除' }));

      expect(screen.getByText('削除しますか？')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '削除する' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });

    it('確認表示で削除するを押すとonDeleteが対象の項目とともに呼ばれる', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      const item = createMasterItem({ id: '3', name: '魚' });
      render(<MasterItemRowActions item={item} onEdit={vi.fn()} onDelete={onDelete} />);

      await user.click(screen.getByRole('button', { name: '削除' }));
      await user.click(screen.getByRole('button', { name: '削除する' }));

      expect(onDelete).toHaveBeenCalledWith(item);
    });

    it('確認表示でキャンセルを押すと確認表示が閉じ削除ボタン表示に戻る', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(
        <MasterItemRowActions item={createMasterItem()} onEdit={vi.fn()} onDelete={onDelete} />,
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
        <MasterItemRowActions item={createMasterItem()} onEdit={vi.fn()} onDelete={onDelete} />,
      );

      await user.click(screen.getByRole('button', { name: '削除' }));

      expect(onDelete).not.toHaveBeenCalled();
    });
  });
});
