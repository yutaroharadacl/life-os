import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { InventoryFormValues } from '../../types';

import { InventoryFormModal } from './InventoryFormModal';

import { Category, StorageLocation } from '@/shared/types';

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const categories: Category[] = [{ id: 'c1', name: '野菜' }];
const storageLocations: StorageLocation[] = [{ id: 's1', name: '冷蔵庫' }];

const createFormValues = (overrides: Partial<InventoryFormValues> = {}): InventoryFormValues => ({
  category: '野菜',
  expirationDate: '2026-08-20',
  memo: '',
  name: '白菜',
  newCategoryName: '',
  newStorageName: '',
  purchaseDate: '2026-08-03',
  quantity: '2',
  storage: '冷蔵庫',
  ...overrides,
});

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('食品名'), '牛乳');
  await user.selectOptions(screen.getByLabelText('カテゴリ'), '野菜');
  await user.selectOptions(screen.getByLabelText('保管場所'), '冷蔵庫');
};

describe('InventoryFormModal', () => {
  describe('正常系', () => {
    it('open={true}のとき入力欄が描画されダイアログのアクセシブル名が在庫を登録になる', () => {
      render(
        <InventoryFormModal
          open
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      expect(screen.getByLabelText('食品名')).toBeInTheDocument();
      expect(screen.getByRole('dialog', { name: '在庫を登録' })).toBeInTheDocument();
    });

    it('閉じるボタンを押すとonCloseが呼ばれる', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <InventoryFormModal
          open
          onClose={onClose}
          onSubmit={vi.fn()}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.click(screen.getByRole('button', { name: '閉じる' }));

      expect(onClose).toHaveBeenCalled();
    });

    it('キャンセルボタンを押すとonCloseが呼ばれる', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <InventoryFormModal
          open
          onClose={onClose}
          onSubmit={vi.fn()}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'キャンセル' }));

      expect(onClose).toHaveBeenCalled();
    });

    it('dialogにcancelイベントが発火するとonCloseが呼ばれる', () => {
      const onClose = vi.fn();
      render(
        <InventoryFormModal
          open
          onClose={onClose}
          onSubmit={vi.fn()}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      fireEvent(screen.getByRole('dialog'), new Event('cancel'));

      expect(onClose).toHaveBeenCalled();
    });

    it('フォーム送信が成立するとonSubmitがdraft付きで呼ばれる', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <InventoryFormModal
          open
          onClose={vi.fn()}
          onSubmit={onSubmit}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: '登録する' }));

      // 送信は useActionState の transition で走るため、呼び出しは次の描画になる
      await vi.waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ name: '牛乳', category: '野菜', storage: '冷蔵庫' }),
        );
      });
    });

    it('openをtrue→false→trueと変えると入力欄の値が初期状態に戻っている', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <InventoryFormModal
          open
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.type(screen.getByLabelText('食品名'), '牛乳');
      expect(screen.getByLabelText('食品名')).toHaveValue('牛乳');

      rerender(
        <InventoryFormModal
          open={false}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );
      rerender(
        <InventoryFormModal
          open
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      expect(screen.getByLabelText('食品名')).toHaveValue('');
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
        <InventoryFormModal
          open
          onClose={onClose}
          onSubmit={vi.fn()}
          categories={categories}
          storageLocations={storageLocations}
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
        <InventoryFormModal
          open
          onClose={onClose}
          onSubmit={vi.fn()}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );
      const dialog = screen.getByRole('dialog');
      stubDialogRect(dialog);

      // 入力欄で押し、背景まで drag して離すと click は <dialog> に届く
      fireEvent.mouseDown(screen.getByLabelText('メモ'), { clientX: 150, clientY: 300 });
      fireEvent.click(dialog, { clientX: 150, clientY: 20 });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('境界値', () => {
    it('open={false}のとき入力欄が描画されない', () => {
      render(
        <InventoryFormModal
          open={false}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      expect(screen.queryByLabelText('食品名')).not.toBeInTheDocument();
    });
  });

  describe('編集モード', () => {
    it('mode省略時はダイアログのアクセシブル名が在庫を登録のままになる', () => {
      render(
        <InventoryFormModal
          open
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      expect(screen.getByRole('dialog', { name: '在庫を登録' })).toBeInTheDocument();
    });

    it('mode=editのときダイアログのアクセシブル名が在庫を編集になり送信ボタンが更新するになる', () => {
      render(
        <InventoryFormModal
          open
          mode="edit"
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      expect(screen.getByRole('dialog', { name: '在庫を編集' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '更新する' })).toBeInTheDocument();
    });

    it('mode=editでinitialValuesを渡すと入力欄にその値が反映される', () => {
      render(
        <InventoryFormModal
          open
          mode="edit"
          initialValues={createFormValues({ name: '白菜' })}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      expect(screen.getByLabelText('食品名')).toHaveValue('白菜');
      expect(screen.getByLabelText('数量')).toHaveValue(2);
    });

    it('mode=editでフォーム送信が成立するとonSubmitがdraft付きで呼ばれる', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <InventoryFormModal
          open
          mode="edit"
          initialValues={createFormValues({ name: '白菜' })}
          onClose={vi.fn()}
          onSubmit={onSubmit}
          categories={categories}
          storageLocations={storageLocations}
        />,
      );

      await user.click(screen.getByRole('button', { name: '更新する' }));

      await vi.waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: '白菜' }));
      });
    });
  });

  describe('新規登録（カテゴリ・保管場所の＋新規登録）', () => {
    describe('正常系', () => {
      it('onCreateCategory・onCreateStorageLocationを渡すとInventoryFormにそのまま渡り＋新規登録の選択肢が表示される', () => {
        render(
          <InventoryFormModal
            open
            onClose={vi.fn()}
            onSubmit={vi.fn()}
            categories={categories}
            storageLocations={storageLocations}
            onCreateCategory={vi.fn()}
            onCreateStorageLocation={vi.fn()}
          />,
        );

        expect(screen.getAllByRole('option', { name: '＋ 新規登録' })).toHaveLength(2);
      });

      it('onCreateCategory・onCreateStorageLocationを渡さないときInventoryForm側に＋新規登録の選択肢が表示されない（回帰確認）', () => {
        render(
          <InventoryFormModal
            open
            onClose={vi.fn()}
            onSubmit={vi.fn()}
            categories={categories}
            storageLocations={storageLocations}
          />,
        );

        expect(screen.queryByRole('option', { name: '＋ 新規登録' })).not.toBeInTheDocument();
      });
    });
  });
});
