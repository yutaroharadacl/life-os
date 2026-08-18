'use client';

import { useActionState, useId, useState } from 'react';

import { updateNotificationSettings } from '../../api/updateNotificationSettings';
import { validateNotificationSettingsForm } from '../../utils/validateNotificationSettingsForm';

import styles from './NotificationSettingsView.module.scss';

/** initialWarningThresholdDays 省略時の既定値。現行の警告しきい値と同じ3日 */
const DEFAULT_WARNING_THRESHOLD_DAYS = 3;

type Props = {
  /** 初期表示する通知タイミング（日）。省略時は 3 */
  initialWarningThresholdDays?: number;
};

/**
 * 通知設定画面（画面5）。通知タイミング（期限の何日前から警告するか）を表示・変更・保存する。
 * 永続化はしていないため、ページを離れると入力内容は失われる（Go バックエンド未実装のため）。
 */
export const NotificationSettingsView = ({
  initialWarningThresholdDays = DEFAULT_WARNING_THRESHOLD_DAYS,
}: Props) => {
  const inputId = useId();
  const [value, setValue] = useState(String(initialWarningThresholdDays));
  const [error, setError] = useState<string | undefined>(undefined);
  const [flashMessage, setFlashMessage] = useState('');

  // 検証は送信時に行う（入力途中に赤字が出るのを避ける）
  const [, submitAction, isPending] = useActionState<null>(async () => {
    // 前回保存時の完了メッセージが今回のエラー表示と同時に残らないよう、送信のたびにクリアする
    setFlashMessage('');

    const message = validateNotificationSettingsForm(value);
    setError(message);

    if (message !== undefined) {
      return null;
    }

    await updateNotificationSettings({ warningThresholdDays: Number(value) });
    setFlashMessage('通知設定を保存しました');

    return null;
  }, null);

  const handleChange = (nextValue: string) => {
    setValue(nextValue);
    // 直したそばからエラーを引っ込める（単一項目のため送信を待たず即時に消してよい）
    setError(undefined);
  };

  const errorId = `${inputId}-error`;

  return (
    <div className={styles.container}>
      {flashMessage && (
        <p className={styles.flash} role="status">
          {flashMessage}
        </p>
      )}

      <h1 className={styles.title}>通知設定</h1>

      <form className={styles.form} action={submitAction} noValidate>
        <div className={styles.field}>
          <label htmlFor={inputId}>通知タイミング</label>
          <div className={styles.inputRow}>
            <input
              id={inputId}
              type="number"
              inputMode="numeric"
              value={value}
              aria-invalid={error !== undefined}
              aria-describedby={error === undefined ? undefined : errorId}
              onChange={(event) => handleChange(event.target.value)}
            />
            <span className={styles.unit}>日前</span>
          </div>
          {error !== undefined && (
            <p id={errorId} className={styles.error}>
              {error}
            </p>
          )}
        </div>

        <button type="submit" className={styles.primary} disabled={isPending}>
          {isPending ? '保存中…' : '保存する'}
        </button>
      </form>
    </div>
  );
};
