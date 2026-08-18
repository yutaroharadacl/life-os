import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MasterItemFormModal } from './MasterItemFormModal';

describe('MasterItemFormModal', () => {
  describe('正常系', () => {
    it('open={true}のとき入力欄が描画されダイアログのアクセシブル名がカテゴリを追加になる', () => {
      render(
        <MasterItemFormModal
          open
          itemLabel="カテゴリ"
          existingNames={[]}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />,
      );

      expect(screen.getByLabelText('カテゴリ名')).toBeInTheDocument();
      expect(screen.getByRole('dialog', { name: 'カテゴリを追加' })).toBeInTheDocument();
    });

    it('itemLabelが保管場所のときダイアログのアクセシブル名が保管場所を追加になる', () => {
      render(
        <MasterItemFormModal
          open
          itemLabel="保管場所"
          existingNames={[]}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />,
      );

      expect(screen.getByRole('dialog', { name: '保管場所を追加' })).toBeInTheDocument();
    });

    it('閉じるボタンを押すとonCloseが呼ばれる', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <MasterItemFormModal
          open
          itemLabel="カテゴリ"
          existingNames={[]}
          onClose={onClose}
          onSubmit={vi.fn()}
        />,
      );

      await user.click(screen.getByRole('button', { name: '閉じる' }));

      expect(onClose).toHaveBeenCalled();
    });

    it('キャンセルボタンを押すとonCloseが呼ばれる', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <MasterItemFormModal
          open
          itemLabel="カテゴリ"
          existingNames={[]}
          onClose={onClose}
          onSubmit={vi.fn()}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'キャンセル' }));

      expect(onClose).toHaveBeenCalled();
    });

    it('dialogにcancelイベントが発火するとonCloseが呼ばれる', () => {
      const onClose = vi.fn();
      render(
        <MasterItemFormModal
          open
          itemLabel="カテゴリ"
          existingNames={[]}
          onClose={onClose}
          onSubmit={vi.fn()}
        />,
      );

      fireEvent(screen.getByRole('dialog'), new Event('cancel'));

      expect(onClose).toHaveBeenCalled();
    });

    it('フォーム送信が成立するとonSubmitがdraft付きで呼ばれる', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <MasterItemFormModal
          open
          itemLabel="カテゴリ"
          existingNames={[]}
          onClose={vi.fn()}
          onSubmit={onSubmit}
        />,
      );

      await user.type(screen.getByLabelText('カテゴリ名'), '果物');
      await user.click(screen.getByRole('button', { name: '追加する' }));

      // 送信は useActionState の transition で走るため、呼び出しは次の描画になる
      await vi.waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ name: '果物' });
      });
    });

    it('openをtrue→false→trueと変えると入力欄の値が初期状態に戻っている', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <MasterItemFormModal
          open
          itemLabel="カテゴリ"
          existingNames={[]}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />,
      );

      await user.type(screen.getByLabelText('カテゴリ名'), '果物');
      expect(screen.getByLabelText('カテゴリ名')).toHaveValue('果物');

      rerender(
        <MasterItemFormModal
          open={false}
          itemLabel="カテゴリ"
          existingNames={[]}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />,
      );
      rerender(
        <MasterItemFormModal
          open
          itemLabel="カテゴリ"
          existingNames={[]}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />,
      );

      expect(screen.getByLabelText('カテゴリ名')).toHaveValue('');
    });
  });

  describe('異常系', () => {
    // jsdom は座標を持たないため、背景かどうかの判定に使う矩形を明示的に与える
    const stubDialogRect = (dialog: HTMLElement) => {
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
    };

    it('ダイアログの外側（背景）をクリックするとonCloseが呼ばれる', () => {
      const onClose = vi.fn();
      render(
        <MasterItemFormModal
          open
          itemLabel="カテゴリ"
          existingNames={[]}
          onClose={onClose}
          onSubmit={vi.fn()}
        />,
      );
      const dialog = screen.getByRole('dialog');
      stubDialogRect(dialog);

      // 背景（ダイアログの上の余白）で押して離す
      fireEvent.mouseDown(dialog, { clientX: 150, clientY: 20 });
      fireEvent.click(dialog, { clientX: 150, clientY: 20 });

      expect(onClose).toHaveBeenCalled();
    });

    it('フォーム内で押して背景で離したとき（文字列選択のドラッグ）は閉じない', () => {
      const onClose = vi.fn();
      render(
        <MasterItemFormModal
          open
          itemLabel="カテゴリ"
          existingNames={[]}
          onClose={onClose}
          onSubmit={vi.fn()}
        />,
      );
      const dialog = screen.getByRole('dialog');
      stubDialogRect(dialog);

      // 入力欄で押し、背景まで drag して離すと click は <dialog> に届く
      fireEvent.mouseDown(screen.getByLabelText('カテゴリ名'), { clientX: 150, clientY: 300 });
      fireEvent.click(dialog, { clientX: 150, clientY: 20 });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('境界値', () => {
    it('open={false}のとき入力欄が描画されない', () => {
      render(
        <MasterItemFormModal
          open={false}
          itemLabel="カテゴリ"
          existingNames={[]}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />,
      );

      expect(screen.queryByLabelText('カテゴリ名')).not.toBeInTheDocument();
    });
  });

  describe('編集モード', () => {
    it('mode省略時はダイアログのアクセシブル名がカテゴリを追加のままになる', () => {
      render(
        <MasterItemFormModal
          open
          itemLabel="カテゴリ"
          existingNames={[]}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />,
      );

      expect(screen.getByRole('dialog', { name: 'カテゴリを追加' })).toBeInTheDocument();
    });

    it('mode=editのときダイアログのアクセシブル名がカテゴリを編集になり送信ボタンが更新するになる', () => {
      render(
        <MasterItemFormModal
          open
          mode="edit"
          itemLabel="カテゴリ"
          existingNames={[]}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />,
      );

      expect(screen.getByRole('dialog', { name: 'カテゴリを編集' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '更新する' })).toBeInTheDocument();
    });

    it('mode=editでinitialValueを渡すと入力欄にその値が反映される', () => {
      render(
        <MasterItemFormModal
          open
          mode="edit"
          initialValue="野菜"
          itemLabel="カテゴリ"
          existingNames={[]}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />,
      );

      expect(screen.getByLabelText('カテゴリ名')).toHaveValue('野菜');
    });

    it('mode=editでフォーム送信が成立するとonSubmitがdraft付きで呼ばれる', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <MasterItemFormModal
          open
          mode="edit"
          initialValue="野菜"
          itemLabel="カテゴリ"
          existingNames={[]}
          onClose={vi.fn()}
          onSubmit={onSubmit}
        />,
      );

      await user.click(screen.getByRole('button', { name: '更新する' }));

      await vi.waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ name: '野菜' });
      });
    });
  });
});
