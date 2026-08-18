import { NotificationSettings } from '@/shared/types';

/**
 * 通知設定を更新する。
 * Go バックエンド（PUT /api/notification-settings）が未実装のためモック。
 * 対象は1レコードのみ（ユーザー単位の設定で ID を持たない）ため、受け取った値をそのまま返すだけで永続化はしない。
 * @param settings - 更新後の通知設定
 * @returns 更新後の通知設定
 */
export const updateNotificationSettings = (settings: NotificationSettings): NotificationSettings =>
  settings;
