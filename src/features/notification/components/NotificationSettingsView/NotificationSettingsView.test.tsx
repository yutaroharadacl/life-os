import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationSettingsView } from './NotificationSettingsView';

/** モックの入出力に使う最小限の形。実際の NotificationSettings 型と一致させる */
type MockedSettings = { warningThresholdDays: number };

// NotificationSettingsView は内部で updateNotificationSettings（モックAPI）を呼ぶため、
// 「保存中…」表示を検証するには解決タイミングを制御できるモックに差し替える必要がある。
// vi.hoisted で作った参照を vi.mock のファクトリから使い、テスト側からも直接操作できるようにする。
// 戻り値の型を「値 or Promise」の union にしておくことで、即時解決のテストと
// 保存中を検証する遅延解決のテストの両方に同じモックを使い回せる。
const { updateNotificationSettingsMock } = vi.hoisted(() => ({
  updateNotificationSettingsMock: vi.fn(
    (settings: MockedSettings): MockedSettings | Promise<MockedSettings> => settings,
  ),
}));

vi.mock('../../api/updateNotificationSettings', () => ({
  updateNotificationSettings: updateNotificationSettingsMock,
}));

beforeEach(() => {
  updateNotificationSettingsMock.mockClear();
  updateNotificationSettingsMock.mockImplementation((settings: MockedSettings) => settings);
});

const changeThreshold = async (user: ReturnType<typeof userEvent.setup>, value: string) => {
  const input = screen.getByLabelText('通知タイミング');
  await user.clear(input);
  if (value !== '') {
    await user.type(input, value);
  }
};

describe('NotificationSettingsView', () => {
  describe('正常系', () => {
    it('見出し「通知設定」が表示される', () => {
      render(<NotificationSettingsView />);

      expect(screen.getByRole('heading', { name: '通知設定', level: 1 })).toBeInTheDocument();
    });

    it('initialWarningThresholdDaysを省略したとき入力欄に既定値の3が表示される', () => {
      render(<NotificationSettingsView />);

      expect(screen.getByLabelText('通知タイミング')).toHaveValue(3);
    });

    it('initialWarningThresholdDaysを渡すとその値が入力欄に表示される', () => {
      render(<NotificationSettingsView initialWarningThresholdDays={5} />);

      expect(screen.getByLabelText('通知タイミング')).toHaveValue(5);
    });

    it('保存するボタンが表示されている', () => {
      render(<NotificationSettingsView />);

      expect(screen.getByRole('button', { name: '保存する' })).toBeInTheDocument();
    });

    it('入力欄の値を5に変更して保存するを押すと通知設定を保存しましたが表示される', async () => {
      const user = userEvent.setup();
      render(<NotificationSettingsView />);

      await changeThreshold(user, '5');
      await user.click(screen.getByRole('button', { name: '保存する' }));

      expect(await screen.findByText('通知設定を保存しました')).toBeInTheDocument();
    });

    it('保存するを押すと入力値でupdateNotificationSettingsが呼ばれる', async () => {
      const user = userEvent.setup();
      render(<NotificationSettingsView />);

      await changeThreshold(user, '7');
      await user.click(screen.getByRole('button', { name: '保存する' }));

      await vi.waitFor(() => {
        expect(updateNotificationSettingsMock).toHaveBeenCalledWith({ warningThresholdDays: 7 });
      });
    });

    it('保存中はボタンが保存中…表示になり無効化され、キャンセル操作は存在しない', async () => {
      const user = userEvent.setup();
      let finishSave = (_settings: MockedSettings) => {};
      updateNotificationSettingsMock.mockImplementationOnce(
        (_settings: MockedSettings) =>
          new Promise<MockedSettings>((resolve) => {
            finishSave = resolve;
          }),
      );
      render(<NotificationSettingsView />);

      await user.click(screen.getByRole('button', { name: '保存する' }));

      const saveButton = await screen.findByRole('button', { name: '保存中…' });
      expect(saveButton).toBeDisabled();
      expect(screen.queryByRole('button', { name: 'キャンセル' })).not.toBeInTheDocument();

      await act(async () => {
        finishSave({ warningThresholdDays: 3 });
      });

      expect(await screen.findByRole('button', { name: '保存する' })).toBeEnabled();
    });
  });

  describe('異常系', () => {
    it('入力欄を空にして保存するを押すと通知タイミングを入力してくださいが表示され保存されない', async () => {
      const user = userEvent.setup();
      render(<NotificationSettingsView />);

      await changeThreshold(user, '');
      await user.click(screen.getByRole('button', { name: '保存する' }));

      expect(await screen.findByText('通知タイミングを入力してください')).toBeInTheDocument();
      expect(updateNotificationSettingsMock).not.toHaveBeenCalled();
    });

    it('入力欄に0を入れて保存すると通知タイミングは1以上90以下で入力してくださいが表示され保存されない', async () => {
      const user = userEvent.setup();
      render(<NotificationSettingsView />);

      await changeThreshold(user, '0');
      await user.click(screen.getByRole('button', { name: '保存する' }));

      expect(
        await screen.findByText('通知タイミングは1以上90以下で入力してください'),
      ).toBeInTheDocument();
      expect(updateNotificationSettingsMock).not.toHaveBeenCalled();
    });

    it('入力欄に91を入れて保存すると通知タイミングは1以上90以下で入力してくださいが表示され保存されない', async () => {
      const user = userEvent.setup();
      render(<NotificationSettingsView />);

      await changeThreshold(user, '91');
      await user.click(screen.getByRole('button', { name: '保存する' }));

      expect(
        await screen.findByText('通知タイミングは1以上90以下で入力してください'),
      ).toBeInTheDocument();
      expect(updateNotificationSettingsMock).not.toHaveBeenCalled();
    });

    it('入力欄に1.5を入れて保存すると通知タイミングは整数で入力してくださいが表示され保存されない', async () => {
      const user = userEvent.setup();
      render(<NotificationSettingsView />);

      await changeThreshold(user, '1.5');
      await user.click(screen.getByRole('button', { name: '保存する' }));

      expect(await screen.findByText('通知タイミングは整数で入力してください')).toBeInTheDocument();
      expect(updateNotificationSettingsMock).not.toHaveBeenCalled();
    });

    it('エラー表示後に入力し直すとエラーメッセージが消える', async () => {
      const user = userEvent.setup();
      render(<NotificationSettingsView />);

      await changeThreshold(user, '');
      await user.click(screen.getByRole('button', { name: '保存する' }));
      expect(await screen.findByText('通知タイミングを入力してください')).toBeInTheDocument();

      await user.type(screen.getByLabelText('通知タイミング'), '5');

      expect(screen.queryByText('通知タイミングを入力してください')).not.toBeInTheDocument();
    });
  });

  describe('境界値', () => {
    it('入力欄に1を入れて保存するとエラーにならず保存完了メッセージが表示される', async () => {
      const user = userEvent.setup();
      render(<NotificationSettingsView />);

      await changeThreshold(user, '1');
      await user.click(screen.getByRole('button', { name: '保存する' }));

      expect(await screen.findByText('通知設定を保存しました')).toBeInTheDocument();
    });

    it('入力欄に90を入れて保存するとエラーにならず保存完了メッセージが表示される', async () => {
      const user = userEvent.setup();
      render(<NotificationSettingsView />);

      await changeThreshold(user, '90');
      await user.click(screen.getByRole('button', { name: '保存する' }));

      expect(await screen.findByText('通知設定を保存しました')).toBeInTheDocument();
    });
  });
});
