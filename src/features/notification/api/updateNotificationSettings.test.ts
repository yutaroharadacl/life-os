import { describe, expect, it } from 'vitest';

import { updateNotificationSettings } from './updateNotificationSettings';

import { NotificationSettings } from '@/shared/types';

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createSettings = (overrides: Partial<NotificationSettings> = {}): NotificationSettings => ({
  warningThresholdDays: 3,
  ...overrides,
});

describe('updateNotificationSettings', () => {
  describe('正常系', () => {
    it('渡した設定をそのまま返す', () => {
      const settings = createSettings({ warningThresholdDays: 5 });

      const result = updateNotificationSettings(settings);

      expect(result).toEqual(settings);
    });

    it('warningThresholdDaysを変更した値が戻り値に反映される', () => {
      const result = updateNotificationSettings(createSettings({ warningThresholdDays: 7 }));

      expect(result.warningThresholdDays).toBe(7);
    });
  });

  describe('境界値', () => {
    it('warningThresholdDaysが1でも例外を投げずそのまま返す', () => {
      const result = updateNotificationSettings(createSettings({ warningThresholdDays: 1 }));

      expect(result.warningThresholdDays).toBe(1);
    });

    it('warningThresholdDaysが90でも例外を投げずそのまま返す', () => {
      const result = updateNotificationSettings(createSettings({ warningThresholdDays: 90 }));

      expect(result.warningThresholdDays).toBe(90);
    });
  });
});
