import { NotificationSettingsView } from '@/features/notification/components/NotificationSettingsView';
import { getNotificationSettings } from '@/shared/api/getNotificationSettings';

export default function Notifications() {
  const { warningThresholdDays } = getNotificationSettings();

  return <NotificationSettingsView initialWarningThresholdDays={warningThresholdDays} />;
}
