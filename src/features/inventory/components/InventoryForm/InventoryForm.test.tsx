import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { InventoryFormValues } from '../../types';

import { InventoryForm } from './InventoryForm';

import { Category, StorageLocation } from '@/shared/types';

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createCategories = (overrides: Category[] = []): Category[] =>
  overrides.length > 0
    ? overrides
    : [
        { id: 'c1', name: '野菜' },
        { id: 'c2', name: '肉' },
      ];

const createStorageLocations = (overrides: StorageLocation[] = []): StorageLocation[] =>
  overrides.length > 0
    ? overrides
    : [
        { id: 's1', name: '冷蔵庫' },
        { id: 's2', name: '冷凍庫' },
      ];

// テストでは基準日を固定し、システム日付に依存させない。
// 実装はローカルタイムの年月日で判定するため、基準日もローカル日付で作る
const today = new Date(2026, 7, 6);

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('食品名'), '牛乳');
  await user.selectOptions(screen.getByLabelText('カテゴリ'), '野菜');
  await user.selectOptions(screen.getByLabelText('保管場所'), '冷蔵庫');
};

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createFormValues = (overrides: Partial<InventoryFormValues> = {}): InventoryFormValues => ({
  category: '野菜',
  expirationDate: '2026-08-20',
  memo: '半分使用済み',
  name: '白菜',
  purchaseDate: '2026-08-03',
  quantity: '2',
  storage: '冷蔵庫',
  ...overrides,
});

describe('InventoryForm', () => {
  describe('正常系', () => {
    it('食品名・カテゴリ・保管場所・数量・期限・購入日・メモの各入力欄が取得できる', () => {
      render(
        <InventoryForm
          categories={createCategories()}
          storageLocations={createStorageLocations()}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          today={today}
        />,
      );

      expect(screen.getByLabelText('食品名')).toBeInTheDocument();
      expect(screen.getByLabelText('カテゴリ')).toBeInTheDocument();
      expect(screen.getByLabelText('保管場所')).toBeInTheDocument();
      expect(screen.getByLabelText('数量')).toBeInTheDocument();
      expect(screen.getByLabelText('期限')).toBeInTheDocument();
      expect(screen.getByLabelText('購入日')).toBeInTheDocument();
      expect(screen.getByLabelText('メモ')).toBeInTheDocument();
    });

    it('categoriesの各名称がoptionとして表示される', () => {
      render(
        <InventoryForm
          categories={[
            { id: 'c1', name: '野菜' },
            { id: 'c2', name: '肉' },
            { id: 'c3', name: '魚' },
          ]}
          storageLocations={createStorageLocations()}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          today={today}
        />,
      );

      const select = screen.getByLabelText('カテゴリ');
      expect(screen.getByRole('option', { name: '野菜' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '肉' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '魚' })).toBeInTheDocument();
      expect(select).toBeInTheDocument();
    });

    it('storageLocationsの各名称がoptionとして表示される', () => {
      render(
        <InventoryForm
          categories={createCategories()}
          storageLocations={[
            { id: 's1', name: '冷蔵庫' },
            { id: 's2', name: '冷凍庫' },
            { id: 's3', name: 'パントリー' },
          ]}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          today={today}
        />,
      );

      expect(screen.getByRole('option', { name: '冷蔵庫' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '冷凍庫' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'パントリー' })).toBeInTheDocument();
    });

    it('todayに固定日を渡すと購入日の初期値がその日付になる', () => {
      render(
        <InventoryForm
          categories={createCategories()}
          storageLocations={createStorageLocations()}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          today={today}
        />,
      );

      expect(screen.getByLabelText('購入日')).toHaveValue('2026-08-06');
    });

    it('数量の初期値が1である', () => {
      render(
        <InventoryForm
          categories={createCategories()}
          storageLocations={createStorageLocations()}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          today={today}
        />,
      );

      expect(screen.getByLabelText('数量')).toHaveValue(1);
    });

    it('すべて入力して登録するを押すとonSubmitが入力値で呼ばれる', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <InventoryForm
          categories={createCategories()}
          storageLocations={createStorageLocations()}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
          today={today}
        />,
      );

      await fillValidForm(user);
      await user.clear(screen.getByLabelText('数量'));
      await user.type(screen.getByLabelText('数量'), '2');
      await user.type(screen.getByLabelText('期限'), '2026-08-20');
      await user.type(screen.getByLabelText('メモ'), '賞味期限に注意');
      await user.click(screen.getByRole('button', { name: '登録する' }));

      // 送信は useActionState の transition で走るため、呼び出しは次の描画になる
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          name: '牛乳',
          category: '野菜',
          storage: '冷蔵庫',
          quantity: 2,
          expirationDate: '2026-08-20',
          purchaseDate: '2026-08-06',
          memo: '賞味期限に注意',
        });
      });
    });

    it('期限を未入力のまま送信するとonSubmitのexpirationDateがnullになる', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <InventoryForm
          categories={createCategories()}
          storageLocations={createStorageLocations()}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
          today={today}
        />,
      );

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: '登録する' }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ expirationDate: null }));
      });
    });

    it('登録中はボタンが登録中…に変わり、二重送信できない', async () => {
      const user = userEvent.setup();
      // onSubmit の完了タイミングをテスト側で握り、送信中の状態を観測する
      let finishSubmit = () => {};
      const onSubmit = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            finishSubmit = resolve;
          }),
      );
      render(
        <InventoryForm
          categories={createCategories()}
          storageLocations={createStorageLocations()}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
          today={today}
        />,
      );

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: '登録する' }));

      const submitButton = await screen.findByRole('button', { name: '登録中…' });
      expect(submitButton).toBeDisabled();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled();

      await act(async () => {
        finishSubmit();
      });

      expect(await screen.findByRole('button', { name: '登録する' })).toBeEnabled();
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('キャンセルを押すとonCancelが呼ばれonSubmitは呼ばれない', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      const onCancel = vi.fn();
      render(
        <InventoryForm
          categories={createCategories()}
          storageLocations={createStorageLocations()}
          onSubmit={onSubmit}
          onCancel={onCancel}
          today={today}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'キャンセル' }));

      expect(onCancel).toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('異常系', () => {
    it('食品名を空のまま登録するを押すとエラーが表示されonSubmitは呼ばれない', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <InventoryForm
          categories={createCategories()}
          storageLocations={createStorageLocations()}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
          today={today}
        />,
      );

      await user.selectOptions(screen.getByLabelText('カテゴリ'), '野菜');
      await user.selectOptions(screen.getByLabelText('保管場所'), '冷蔵庫');
      await user.click(screen.getByRole('button', { name: '登録する' }));

      expect(await screen.findByText('食品名を入力してください')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('数量に0を入れて送信するとエラーメッセージが表示されonSubmitは呼ばれない', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <InventoryForm
          categories={createCategories()}
          storageLocations={createStorageLocations()}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
          today={today}
        />,
      );

      await fillValidForm(user);
      await user.clear(screen.getByLabelText('数量'));
      await user.type(screen.getByLabelText('数量'), '0');
      await user.click(screen.getByRole('button', { name: '登録する' }));

      expect(await screen.findByText('数量は1以上999以下で入力してください')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('エラー表示後に食品名を入力し直すとそのフィールドのエラーメッセージが消える', async () => {
      const user = userEvent.setup();
      render(
        <InventoryForm
          categories={createCategories()}
          storageLocations={createStorageLocations()}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          today={today}
        />,
      );

      await user.selectOptions(screen.getByLabelText('カテゴリ'), '野菜');
      await user.selectOptions(screen.getByLabelText('保管場所'), '冷蔵庫');
      await user.click(screen.getByRole('button', { name: '登録する' }));
      expect(await screen.findByText('食品名を入力してください')).toBeInTheDocument();

      await user.type(screen.getByLabelText('食品名'), '牛乳');

      expect(screen.queryByText('食品名を入力してください')).not.toBeInTheDocument();
    });

    it('送信時にエラーがあると最初のエラーフィールドにフォーカスが当たる', async () => {
      const user = userEvent.setup();
      render(
        <InventoryForm
          categories={createCategories()}
          storageLocations={createStorageLocations()}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          today={today}
        />,
      );

      await user.click(screen.getByRole('button', { name: '登録する' }));

      await screen.findByText('食品名を入力してください');
      expect(screen.getByLabelText('食品名')).toHaveFocus();
    });
  });

  describe('境界値', () => {
    it('categories・storageLocationsを省略したとき選択肢は選択してくださいのみになりクラッシュしない', () => {
      render(<InventoryForm onSubmit={vi.fn()} onCancel={vi.fn()} today={today} />);

      const categorySelect = screen.getByLabelText('カテゴリ');
      const storageSelect = screen.getByLabelText('保管場所');

      expect(categorySelect).toBeInTheDocument();
      expect(storageSelect).toBeInTheDocument();
      expect(screen.getAllByRole('option', { name: '選択してください' })).toHaveLength(2);
    });

    it('メモ・期限だけ未入力でも登録できる', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <InventoryForm
          categories={createCategories()}
          storageLocations={createStorageLocations()}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
          today={today}
        />,
      );

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: '登録する' }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ expirationDate: null, memo: '' }),
        );
      });
    });
  });

  describe('編集モード', () => {
    it('mode省略時は送信ボタンが登録するになる', () => {
      render(
        <InventoryForm
          categories={createCategories()}
          storageLocations={createStorageLocations()}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          today={today}
        />,
      );

      expect(screen.getByRole('button', { name: '登録する' })).toBeInTheDocument();
    });

    it('mode=editのとき送信ボタンが更新するになる', () => {
      render(
        <InventoryForm
          mode="edit"
          categories={createCategories()}
          storageLocations={createStorageLocations()}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          today={today}
        />,
      );

      expect(screen.getByRole('button', { name: '更新する' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '登録する' })).not.toBeInTheDocument();
    });

    it('initialValuesを渡すと各入力欄にその値が反映される', () => {
      render(
        <InventoryForm
          mode="edit"
          initialValues={createFormValues()}
          categories={createCategories()}
          storageLocations={createStorageLocations()}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          today={today}
        />,
      );

      expect(screen.getByLabelText('食品名')).toHaveValue('白菜');
      expect(screen.getByLabelText('カテゴリ')).toHaveValue('野菜');
      expect(screen.getByLabelText('保管場所')).toHaveValue('冷蔵庫');
      expect(screen.getByLabelText('数量')).toHaveValue(2);
      expect(screen.getByLabelText('期限')).toHaveValue('2026-08-20');
      expect(screen.getByLabelText('購入日')).toHaveValue('2026-08-03');
      expect(screen.getByLabelText('メモ')).toHaveValue('半分使用済み');
    });

    it('mode=editで更新するを押すと送信中は更新中…と表示される', async () => {
      const user = userEvent.setup();
      let finishSubmit = () => {};
      const onSubmit = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            finishSubmit = resolve;
          }),
      );
      render(
        <InventoryForm
          mode="edit"
          initialValues={createFormValues()}
          categories={createCategories()}
          storageLocations={createStorageLocations()}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
          today={today}
        />,
      );

      await user.click(screen.getByRole('button', { name: '更新する' }));

      expect(await screen.findByRole('button', { name: '更新中…' })).toBeDisabled();

      await act(async () => {
        finishSubmit();
      });
    });

    it('mode=editで数量だけ変更して更新するを押すとonSubmitに変更後の数量で呼ばれる', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <InventoryForm
          mode="edit"
          initialValues={createFormValues()}
          categories={createCategories()}
          storageLocations={createStorageLocations()}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
          today={today}
        />,
      );

      await user.clear(screen.getByLabelText('数量'));
      await user.type(screen.getByLabelText('数量'), '9');
      await user.click(screen.getByRole('button', { name: '更新する' }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ quantity: 9 }));
      });
    });

    it('mode=editで食品名を空にして更新するを押すとエラーが表示されonSubmitは呼ばれない', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <InventoryForm
          mode="edit"
          initialValues={createFormValues()}
          categories={createCategories()}
          storageLocations={createStorageLocations()}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
          today={today}
        />,
      );

      await user.clear(screen.getByLabelText('食品名'));
      await user.click(screen.getByRole('button', { name: '更新する' }));

      expect(await screen.findByText('食品名を入力してください')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
