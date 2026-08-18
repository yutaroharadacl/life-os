import { NotificationSettings } from '../types';

/**
 * 通知設定を取得する。
 * Go バックエンド（GET /api/notification-settings）が未実装のためモック。
 * 常に既定値（3日前）を返す。
 */
export const getNotificationSettings = (): NotificationSettings => ({
  warningThresholdDays: 3,
});
