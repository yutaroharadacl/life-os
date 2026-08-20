import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render as rtlRender, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MasterItemListView } from './MasterItemListView';

import { MasterItem, MasterItemDraft, MasterResource } from '@/shared/types';

// useMutation は QueryClientProvider 配下でしか呼び出せないため、テストごとに新しい QueryClient で包む
const render = (ui: ReactElement) => {
  const queryClient = new QueryClient();
  return rtlRender(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

// createMasterItem・updateMasterItem・deleteMasterItem は BFF（fetch）を叩く非同期関数のため、
// 正常系はテストごとの状態変化のみに関心があるモック実装で代替し、異常系は個別に reject させる
const { mockCreateMasterItem, mockUpdateMasterItem, mockDeleteMasterItem } = vi.hoisted(() => ({
  mockCreateMasterItem: vi.fn(),
  mockUpdateMasterItem: vi.fn(),
  mockDeleteMasterItem: vi.fn(),
}));

vi.mock('../../api/createMasterItem', () => ({ createMasterItem: mockCreateMasterItem }));
vi.mock('../../api/updateMasterItem', () => ({ updateMasterItem: mockUpdateMasterItem }));
vi.mock('../../api/deleteMasterItem', () => ({ deleteMasterItem: mockDeleteMasterItem }));

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

// 採番の連番。テストごとに作成された項目の id が重複しないようにする
let idSequence = 0;

beforeEach(() => {
  idSequence = 0;

  // 既定では旧モック実装と同じく「渡された draft をそのまま採番して返す」動作にしておき、
  // 異常系のテストだけ個別に mockRejectedValue で上書きする
  mockCreateMasterItem
    .mockReset()
    .mockImplementation((_resource: MasterResource, draft: MasterItemDraft) => {
      idSequence += 1;
      return Promise.resolve({ ...draft, id: `created-${idSequence}` });
    });
  mockUpdateMasterItem
    .mockReset()
    .mockImplementation((_resource: MasterResource, id: string, draft: MasterItemDraft) =>
      Promise.resolve({ ...draft, id }),
    );
  mockDeleteMasterItem.mockReset().mockResolvedValue(undefined);
});

describe('MasterItemListView', () => {
  describe('正常系', () => {
    it('初期表示でinitialItemsの項目が一覧に表示される', () => {
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[
            createMasterItem({ name: '野菜' }),
            createMasterItem({ id: '2', name: '肉' }),
          ]}
        />,
      );

      expect(screen.getByText('野菜')).toBeInTheDocument();
      expect(screen.getByText('肉')).toBeInTheDocument();
    });

    it('保管場所管理画面でもitemLabelが保管場所のとき初期保管場所一覧が表示される', () => {
      render(
        <MasterItemListView
          title="保管場所管理"
          itemLabel="保管場所"
          resource="storage"
          initialItems={[
            createMasterItem({ id: '1', name: '冷蔵庫' }),
            createMasterItem({ id: '2', name: '冷凍庫' }),
          ]}
        />,
      );

      expect(screen.getByText('冷蔵庫')).toBeInTheDocument();
      expect(screen.getByText('冷凍庫')).toBeInTheDocument();
    });

    it('titleが見出しとして表示される', () => {
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[]}
        />,
      );

      expect(screen.getByRole('heading', { name: 'カテゴリ管理' })).toBeInTheDocument();
    });

    it('${itemLabel}を追加ボタンが表示されている', () => {
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[]}
        />,
      );

      expect(screen.getByRole('button', { name: 'カテゴリを追加' })).toBeInTheDocument();
    });

    it('追加ボタンを押すとモーダルが開きタイトルがカテゴリを追加になる', async () => {
      const user = userEvent.setup();
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[]}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'カテゴリを追加' }));

      expect(screen.getByRole('dialog', { name: 'カテゴリを追加' })).toBeInTheDocument();
    });

    it('itemLabelが保管場所のとき追加ボタンを押すとモーダルタイトルが保管場所を追加になる', async () => {
      const user = userEvent.setup();
      render(
        <MasterItemListView
          title="保管場所管理"
          itemLabel="保管場所"
          resource="storage"
          initialItems={[]}
        />,
      );

      await user.click(screen.getByRole('button', { name: '保管場所を追加' }));

      expect(screen.getByRole('dialog', { name: '保管場所を追加' })).toBeInTheDocument();
    });

    it('名称を入力して追加するを押すと一覧に新しい項目が増え追加完了メッセージが表示されモーダルが閉じる', async () => {
      const user = userEvent.setup();
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[]}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'カテゴリを追加' }));
      await user.type(screen.getByLabelText('カテゴリ名'), '果物');
      await user.click(screen.getByRole('button', { name: '追加する' }));

      // 送信は useActionState の transition で走るため、反映は次の描画になる
      expect(await screen.findByText('果物')).toBeInTheDocument();
      expect(screen.getByText('果物を追加しました')).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('行の編集を押すとモーダルがカテゴリを編集で開き名称欄に対象の現在値が初期表示される', async () => {
      const user = userEvent.setup();
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[createMasterItem({ name: '野菜' })]}
        />,
      );

      await user.click(within(getRowByName('野菜')).getByRole('button', { name: '編集' }));

      expect(screen.getByRole('dialog', { name: 'カテゴリを編集' })).toBeInTheDocument();
      expect(screen.getByLabelText('カテゴリ名')).toHaveValue('野菜');
    });

    it('名称を変更して更新するを押すと一覧の当該行の名称が変わり更新完了メッセージが表示される', async () => {
      const user = userEvent.setup();
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[createMasterItem({ name: '野菜' })]}
        />,
      );

      await user.click(within(getRowByName('野菜')).getByRole('button', { name: '編集' }));
      await user.clear(screen.getByLabelText('カテゴリ名'));
      await user.type(screen.getByLabelText('カテゴリ名'), '果物');
      await user.click(screen.getByRole('button', { name: '更新する' }));

      expect(await screen.findByText('果物を更新しました')).toBeInTheDocument();
      expect(screen.queryByText('野菜')).not.toBeInTheDocument();
      expect(screen.getByText('果物')).toBeInTheDocument();
    });

    it('削除を押すとその行に削除しますか？削除する・キャンセルが表示される', async () => {
      const user = userEvent.setup();
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[createMasterItem({ name: '野菜' })]}
        />,
      );

      await user.click(within(getRowByName('野菜')).getByRole('button', { name: '削除' }));

      const row = getRowByName('野菜');
      expect(within(row).getByText('削除しますか？')).toBeInTheDocument();
      expect(within(row).getByRole('button', { name: '削除する' })).toBeInTheDocument();
      expect(within(row).getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });

    it('確認表示で削除するを押すと対象行が消え削除完了メッセージが表示される', async () => {
      const user = userEvent.setup();
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[
            createMasterItem({ id: '1', name: '野菜' }),
            createMasterItem({ id: '2', name: '肉' }),
          ]}
        />,
      );

      await user.click(within(getRowByName('野菜')).getByRole('button', { name: '削除' }));
      await user.click(screen.getByRole('button', { name: '削除する' }));

      await waitFor(() => {
        expect(screen.queryByText('野菜')).not.toBeInTheDocument();
      });
      expect(screen.getByText('野菜を削除しました')).toBeInTheDocument();
      expect(screen.getByText('肉')).toBeInTheDocument();
    });

    it('確認表示でキャンセルを押すと削除されずボタン表示に戻る', async () => {
      const user = userEvent.setup();
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[createMasterItem({ name: '野菜' })]}
        />,
      );

      await user.click(within(getRowByName('野菜')).getByRole('button', { name: '削除' }));
      await user.click(within(getRowByName('野菜')).getByRole('button', { name: 'キャンセル' }));

      const row = getRowByName('野菜');
      expect(within(row).queryByText('削除しますか？')).not.toBeInTheDocument();
      expect(within(row).getByRole('button', { name: '削除' })).toBeInTheDocument();
      expect(screen.getByText('野菜')).toBeInTheDocument();
    });
  });

  describe('異常系', () => {
    it('名称を空のまま追加するを押すとカテゴリ名を入力してくださいが表示され追加されない', async () => {
      const user = userEvent.setup();
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[createMasterItem({ name: '野菜' })]}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'カテゴリを追加' }));
      await user.click(screen.getByRole('button', { name: '追加する' }));

      expect(await screen.findByText('カテゴリ名を入力してください')).toBeInTheDocument();
      expect(screen.getAllByText('野菜')).toHaveLength(1);
    });

    it('21文字の名称で追加するとカテゴリ名は20文字以内で入力してくださいが表示され追加されない', async () => {
      const user = userEvent.setup();
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[]}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'カテゴリを追加' }));
      await user.type(screen.getByLabelText('カテゴリ名'), 'あ'.repeat(21));
      await user.click(screen.getByRole('button', { name: '追加する' }));

      expect(
        await screen.findByText('カテゴリ名は20文字以内で入力してください'),
      ).toBeInTheDocument();
    });

    it('既存と同じ名称（野菜）で追加すると同じ名前のカテゴリが既に登録されていますが表示され追加されない', async () => {
      const user = userEvent.setup();
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[createMasterItem({ name: '野菜' })]}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'カテゴリを追加' }));
      await user.type(screen.getByLabelText('カテゴリ名'), '野菜');
      await user.click(screen.getByRole('button', { name: '追加する' }));

      expect(
        await screen.findByText('同じ名前のカテゴリが既に登録されています'),
      ).toBeInTheDocument();
      expect(screen.getAllByText('野菜')).toHaveLength(1);
    });

    it('編集で他の既存項目と同じ名称に変更しようとするとエラーが表示され更新されない', async () => {
      const user = userEvent.setup();
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[
            createMasterItem({ id: '1', name: '野菜' }),
            createMasterItem({ id: '2', name: '肉' }),
          ]}
        />,
      );

      await user.click(within(getRowByName('野菜')).getByRole('button', { name: '編集' }));
      await user.clear(screen.getByLabelText('カテゴリ名'));
      await user.type(screen.getByLabelText('カテゴリ名'), '肉');
      await user.click(screen.getByRole('button', { name: '更新する' }));

      expect(
        await screen.findByText('同じ名前のカテゴリが既に登録されています'),
      ).toBeInTheDocument();
      expect(getRowByName('野菜')).toBeInTheDocument();
    });

    it('編集で名称を変更せずそのまま更新するとエラーにならず成功する（自分自身との重複は除外される）', async () => {
      const user = userEvent.setup();
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[createMasterItem({ name: '野菜' })]}
        />,
      );

      await user.click(within(getRowByName('野菜')).getByRole('button', { name: '編集' }));
      await user.click(screen.getByRole('button', { name: '更新する' }));

      expect(await screen.findByText('野菜を更新しました')).toBeInTheDocument();
      expect(
        screen.queryByText('同じ名前のカテゴリが既に登録されています'),
      ).not.toBeInTheDocument();
    });
  });

  describe('境界値', () => {
    it('項目が1件もない状態で登録されているカテゴリはありません。が表示される', () => {
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[]}
        />,
      );

      expect(screen.getByText('登録されているカテゴリはありません。')).toBeInTheDocument();
    });

    it('initialItemsを省略したとき登録されているカテゴリはありません。が表示される', () => {
      render(<MasterItemListView title="カテゴリ管理" itemLabel="カテゴリ" resource="category" />);

      expect(screen.getByText('登録されているカテゴリはありません。')).toBeInTheDocument();
    });

    it('項目が1件だけの状態でその1件を削除すると0件表示に戻る', async () => {
      const user = userEvent.setup();
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[createMasterItem({ name: '野菜' })]}
        />,
      );

      await user.click(within(getRowByName('野菜')).getByRole('button', { name: '削除' }));
      await user.click(screen.getByRole('button', { name: '削除する' }));

      expect(await screen.findByText('登録されているカテゴリはありません。')).toBeInTheDocument();
    });

    it('前後に空白を含む名称（ 野菜 ）を追加するとtrim後の野菜として既存の野菜と重複エラーになる', async () => {
      const user = userEvent.setup();
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[createMasterItem({ name: '野菜' })]}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'カテゴリを追加' }));
      await user.type(screen.getByLabelText('カテゴリ名'), ' 野菜 ');
      await user.click(screen.getByRole('button', { name: '追加する' }));

      expect(
        await screen.findByText('同じ名前のカテゴリが既に登録されています'),
      ).toBeInTheDocument();
      expect(screen.getAllByText('野菜')).toHaveLength(1);
    });
  });

  describe('異常系（追加・更新・削除の通信失敗）', () => {
    it('追加が失敗（createMasterItemがreject）すると一覧は変化せずrole="alert"のエラーメッセージが表示されモーダルは開いたままになる', async () => {
      const user = userEvent.setup();
      mockCreateMasterItem.mockRejectedValue(new Error('通信に失敗しました'));
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[createMasterItem({ name: '野菜' })]}
        />,
      );

      await user.click(screen.getByRole('button', { name: 'カテゴリを追加' }));
      await user.type(screen.getByLabelText('カテゴリ名'), '果物');
      await user.click(screen.getByRole('button', { name: '追加する' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('通信に失敗しました');
      expect(screen.queryByText('果物')).not.toBeInTheDocument();
      expect(screen.getByRole('dialog', { name: 'カテゴリを追加' })).toBeInTheDocument();
    });

    it('更新が失敗（updateMasterItemがreject）すると一覧は変化せずエラーメッセージが表示されモーダルは開いたままになる', async () => {
      const user = userEvent.setup();
      mockUpdateMasterItem.mockRejectedValue(new Error('通信に失敗しました'));
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[createMasterItem({ name: '野菜' })]}
        />,
      );

      await user.click(within(getRowByName('野菜')).getByRole('button', { name: '編集' }));
      await user.clear(screen.getByLabelText('カテゴリ名'));
      await user.type(screen.getByLabelText('カテゴリ名'), '果物');
      await user.click(screen.getByRole('button', { name: '更新する' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('通信に失敗しました');
      expect(screen.getByText('野菜')).toBeInTheDocument();
      expect(screen.getByRole('dialog', { name: 'カテゴリを編集' })).toBeInTheDocument();
    });

    it('削除が失敗（deleteMasterItemがreject）すると一覧から対象の項目は消えずエラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      mockDeleteMasterItem.mockRejectedValue(new Error('通信に失敗しました'));
      render(
        <MasterItemListView
          title="カテゴリ管理"
          itemLabel="カテゴリ"
          resource="category"
          initialItems={[createMasterItem({ name: '野菜' })]}
        />,
      );

      await user.click(within(getRowByName('野菜')).getByRole('button', { name: '削除' }));
      await user.click(screen.getByRole('button', { name: '削除する' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('通信に失敗しました');
      expect(screen.getByText('野菜')).toBeInTheDocument();
    });
  });
});
