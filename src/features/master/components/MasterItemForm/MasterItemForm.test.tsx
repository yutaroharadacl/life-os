import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MasterItemForm } from './MasterItemForm';

const fillValidName = async (user: ReturnType<typeof userEvent.setup>, itemLabel = 'カテゴリ') => {
  await user.type(screen.getByLabelText(`${itemLabel}名`), '果物');
};

describe('MasterItemForm', () => {
  describe('正常系', () => {
    it('itemLabel名の入力欄が取得できる', () => {
      render(
        <MasterItemForm
          itemLabel="カテゴリ"
          existingNames={[]}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />,
      );

      expect(screen.getByLabelText('カテゴリ名')).toBeInTheDocument();
    });

    it('itemLabelが保管場所のとき保管場所名の入力欄が取得できる', () => {
      render(
        <MasterItemForm
          itemLabel="保管場所"
          existingNames={[]}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />,
      );

      expect(screen.getByLabelText('保管場所名')).toBeInTheDocument();
    });

    it('mode省略時は送信ボタンが追加するになる', () => {
      render(
        <MasterItemForm
          itemLabel="カテゴリ"
          existingNames={[]}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />,
      );

      expect(screen.getByRole('button', { name: '追加する' })).toBeInTheDocument();
    });

    it('mode=editのとき送信ボタンが更新するになる', () => {
      render(
        <MasterItemForm
          itemLabel="カテゴリ"
          mode="edit"
          existingNames={[]}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />,
      );

      expect(screen.getByRole('button', { name: '更新する' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '追加する' })).not.toBeInTheDocument();
    });

    it('initialValueを渡すと入力欄にその値が反映される', () => {
      render(
        <MasterItemForm
          itemLabel="カテゴリ"
          mode="edit"
          initialValue="野菜"
          existingNames={[]}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />,
      );

      expect(screen.getByLabelText('カテゴリ名')).toHaveValue('野菜');
    });

    it('妥当な名称を入力して追加するを押すとonSubmitが入力値で呼ばれる', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <MasterItemForm
          itemLabel="カテゴリ"
          existingNames={[]}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />,
      );

      await fillValidName(user);
      await user.click(screen.getByRole('button', { name: '追加する' }));

      // 送信は useActionState の transition で走るため、呼び出しは次の描画になる
      await vi.waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ name: '果物' });
      });
    });

    it('追加中はボタンが追加中…に変わり二重送信できない', async () => {
      const user = userEvent.setup();
      let finishSubmit = () => {};
      const onSubmit = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            finishSubmit = resolve;
          }),
      );
      render(
        <MasterItemForm
          itemLabel="カテゴリ"
          existingNames={[]}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />,
      );

      await fillValidName(user);
      await user.click(screen.getByRole('button', { name: '追加する' }));

      const submitButton = await screen.findByRole('button', { name: '追加中…' });
      expect(submitButton).toBeDisabled();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled();

      await act(async () => {
        finishSubmit();
      });

      expect(await screen.findByRole('button', { name: '追加する' })).toBeEnabled();
      expect(onSubmit).toHaveBeenCalledTimes(1);
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
        <MasterItemForm
          itemLabel="カテゴリ"
          mode="edit"
          initialValue="野菜"
          existingNames={[]}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />,
      );

      await user.click(screen.getByRole('button', { name: '更新する' }));

      expect(await screen.findByRole('button', { name: '更新中…' })).toBeDisabled();

      await act(async () => {
        finishSubmit();
      });
    });

    it('mode=editで名称を変更して更新するを押すとonSubmitに変更後の値で呼ばれる', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <MasterItemForm
          itemLabel="カテゴリ"
          mode="edit"
          initialValue="野菜"
          existingNames={[]}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />,
      );

      await user.clear(screen.getByLabelText('カテゴリ名'));
      await user.type(screen.getByLabelText('カテゴリ名'), '果物');
      await user.click(screen.getByRole('button', { name: '更新する' }));

      await vi.waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ name: '果物' });
      });
    });

    it('キャンセルを押すとonCancelが呼ばれonSubmitは呼ばれない', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      const onCancel = vi.fn();
      render(
        <MasterItemForm
          itemLabel="カテゴリ"
          existingNames={[]}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'キャンセル' }));

      expect(onCancel).toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('mode=editで名称を変更せずそのまま更新するを押すとonSubmitが呼ばれる（自分自身との重複は除外される）', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <MasterItemForm
          itemLabel="カテゴリ"
          mode="edit"
          initialValue="野菜"
          existingNames={['肉', '魚']}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />,
      );

      await user.click(screen.getByRole('button', { name: '更新する' }));

      await vi.waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ name: '野菜' });
      });
    });
  });

  describe('異常系', () => {
    it('名称を空のまま追加するを押すとカテゴリ名を入力してくださいが表示されonSubmitは呼ばれない', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <MasterItemForm
          itemLabel="カテゴリ"
          existingNames={[]}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />,
      );

      await user.click(screen.getByRole('button', { name: '追加する' }));

      expect(await screen.findByText('カテゴリ名を入力してください')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('21文字の名称で追加するとカテゴリ名は20文字以内で入力してくださいが表示されonSubmitは呼ばれない', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <MasterItemForm
          itemLabel="カテゴリ"
          existingNames={[]}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />,
      );

      await user.type(screen.getByLabelText('カテゴリ名'), 'あ'.repeat(21));
      await user.click(screen.getByRole('button', { name: '追加する' }));

      expect(
        await screen.findByText('カテゴリ名は20文字以内で入力してください'),
      ).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('既存と同じ名称で追加すると同じ名前のカテゴリが既に登録されていますが表示されonSubmitは呼ばれない', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <MasterItemForm
          itemLabel="カテゴリ"
          existingNames={['野菜']}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />,
      );

      await user.type(screen.getByLabelText('カテゴリ名'), '野菜');
      await user.click(screen.getByRole('button', { name: '追加する' }));

      expect(
        await screen.findByText('同じ名前のカテゴリが既に登録されています'),
      ).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('編集で他の既存項目と同じ名称に変更しようとするとエラーが表示され更新されない', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <MasterItemForm
          itemLabel="カテゴリ"
          mode="edit"
          initialValue="野菜"
          existingNames={['肉']}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />,
      );

      await user.clear(screen.getByLabelText('カテゴリ名'));
      await user.type(screen.getByLabelText('カテゴリ名'), '肉');
      await user.click(screen.getByRole('button', { name: '更新する' }));

      expect(
        await screen.findByText('同じ名前のカテゴリが既に登録されています'),
      ).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('エラー表示後に名称を入力し直すとエラーメッセージが消える', async () => {
      const user = userEvent.setup();
      render(
        <MasterItemForm
          itemLabel="カテゴリ"
          existingNames={[]}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />,
      );

      await user.click(screen.getByRole('button', { name: '追加する' }));
      expect(await screen.findByText('カテゴリ名を入力してください')).toBeInTheDocument();

      await user.type(screen.getByLabelText('カテゴリ名'), '野菜');

      expect(screen.queryByText('カテゴリ名を入力してください')).not.toBeInTheDocument();
    });
  });

  describe('境界値', () => {
    it('20文字の名称はエラーにならず追加できる', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <MasterItemForm
          itemLabel="カテゴリ"
          existingNames={[]}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />,
      );

      await user.type(screen.getByLabelText('カテゴリ名'), 'あ'.repeat(20));
      await user.click(screen.getByRole('button', { name: '追加する' }));

      await vi.waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ name: 'あ'.repeat(20) });
      });
    });

    it('existingNamesが空配列でもクラッシュしない', () => {
      render(
        <MasterItemForm
          itemLabel="カテゴリ"
          existingNames={[]}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />,
      );

      expect(screen.getByLabelText('カテゴリ名')).toBeInTheDocument();
    });
  });
});
