import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
  describe('正常系', () => {
    it('アプリ名がリンクとして表示され/inventory/listsを指す', () => {
      render(<AppHeader />);

      const brandLink = screen.getByRole('link', { name: '在庫管理' });
      expect(brandLink).toBeInTheDocument();
      expect(brandLink).toHaveAttribute('href', '/inventory/lists');
    });

    it('ハンバーガーボタンがアクセシブルネーム付きのbuttonとして取得できる', () => {
      render(<AppHeader />);

      expect(screen.getByRole('button', { name: 'メニューを開く' })).toBeInTheDocument();
    });

    it('初期状態ではメニューのリンクが表示されていない', () => {
      render(<AppHeader />);

      expect(screen.queryByRole('link', { name: '在庫一覧' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'マスタ管理' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: '通知設定' })).not.toBeInTheDocument();
    });

    it('ハンバーガーボタンを押すとメニューが開き在庫一覧・マスタ管理・通知設定のリンクが表示される', async () => {
      const user = userEvent.setup();
      render(<AppHeader />);

      await user.click(screen.getByRole('button', { name: 'メニューを開く' }));

      expect(screen.getByRole('dialog', { name: 'メニュー' })).toBeInTheDocument();

      const inventoryLink = screen.getByRole('link', { name: '在庫一覧' });
      expect(inventoryLink).toHaveAttribute('href', '/inventory/lists');

      const masterLink = screen.getByRole('link', { name: 'マスタ管理' });
      expect(masterLink).toHaveAttribute('href', '/master');

      const notificationLink = screen.getByRole('link', { name: '通知設定' });
      expect(notificationLink).toHaveAttribute('href', '/notifications');
    });

    it('メニュー内のマスタ管理リンクを押すとメニューが閉じる', async () => {
      const user = userEvent.setup();
      render(<AppHeader />);

      await user.click(screen.getByRole('button', { name: 'メニューを開く' }));
      await user.click(screen.getByRole('link', { name: 'マスタ管理' }));

      expect(screen.queryByRole('link', { name: 'マスタ管理' })).not.toBeInTheDocument();
    });

    it('dialogにcancelイベントが発火するとメニューが閉じる', async () => {
      const user = userEvent.setup();
      render(<AppHeader />);

      await user.click(screen.getByRole('button', { name: 'メニューを開く' }));
      fireEvent(screen.getByRole('dialog'), new Event('cancel'));

      expect(screen.queryByRole('link', { name: 'マスタ管理' })).not.toBeInTheDocument();
    });

    it('メニューの背景（背景余白）をクリックすると閉じる', async () => {
      const user = userEvent.setup();
      render(<AppHeader />);

      await user.click(screen.getByRole('button', { name: 'メニューを開く' }));
      const dialog = screen.getByRole('dialog');
      // jsdom は座標を持たないため、背景かどうかの判定に使う矩形を明示的に与える（InventoryFormModal と同じ方針）
      vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        bottom: 500,
        left: 0,
        right: 300,
        width: 300,
        height: 400,
        x: 0,
        y: 100,
        toJSON: () => ({}),
      });

      // 背景（ダイアログの上の余白）で押して離す
      fireEvent.mouseDown(dialog, { clientX: 150, clientY: 20 });
      fireEvent.click(dialog, { clientX: 150, clientY: 20 });

      expect(screen.queryByRole('link', { name: 'マスタ管理' })).not.toBeInTheDocument();
    });
  });

  describe('境界値', () => {
    it('メニューを開いた状態で再度ハンバーガーボタンを押すと閉じる', async () => {
      const user = userEvent.setup();
      render(<AppHeader />);

      await user.click(screen.getByRole('button', { name: 'メニューを開く' }));
      expect(screen.getByRole('link', { name: 'マスタ管理' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'メニューを開く' }));

      expect(screen.queryByRole('link', { name: 'マスタ管理' })).not.toBeInTheDocument();
    });
  });
});
