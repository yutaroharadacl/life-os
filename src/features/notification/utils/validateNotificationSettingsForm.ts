/** 通知タイミングの下限（日） */
const MIN_DAYS = 1;
/** 通知タイミングの上限（日）。要件に具体的な数値の指定が無いため実装上の妥当な値とする */
const MAX_DAYS = 90;

/** 整数のみを受け付ける正規表現（符号は許容し、範囲チェックで弾く。小数点は不可） */
const INTEGER_PATTERN = /^-?\d+$/;

/**
 * 通知設定フォームの通知タイミングを検証する。
 * @param warningThresholdDays - 入力された通知タイミング（文字列）
 * @returns エラーメッセージ。問題が無ければ `undefined`
 */
export const validateNotificationSettingsForm = (
  warningThresholdDays: string,
): string | undefined => {
  const trimmed = warningThresholdDays.trim();

  if (trimmed.length === 0) {
    return '通知タイミングを入力してください';
  }
  if (!INTEGER_PATTERN.test(trimmed)) {
    return '通知タイミングは整数で入力してください';
  }

  const value = Number(trimmed);
  if (value < MIN_DAYS || value > MAX_DAYS) {
    return `通知タイミングは${MIN_DAYS}以上${MAX_DAYS}以下で入力してください`;
  }

  return undefined;
};
