import { ExpirationInfo, Inventory } from '../types';

import { parseIsoDate, toDayValue } from './isoDate';

/**
 * 期限が近いと警告表示するしきい値（日数）。
 * 通知設定画面（要件 5-6）の実装時にユーザー設定値へ差し替える暫定値。
 */
const WARNING_THRESHOLD_DAYS = 3;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** 日付として解釈できない値を表示するときのラベル */
const UNKNOWN_LABEL = '-';

/**
 * ISO 形式の日付文字列を、日付単位で比較できる数値に変換する。
 * @returns 変換後の数値。日付として解釈できない場合は null
 */
const toComparableDay = (isoDate: string): number | null => {
  const parts = parseIsoDate(isoDate);

  return parts === null ? null : toDayValue(parts);
};

/**
 * 基準日（Date）を日付単位で比較できる数値に変換する。時刻は切り捨てる。
 * ローカルタイムの年月日を見るため、実行時刻が何時であっても同じ日付として扱われる。
 */
const toComparableDayFromDate = (date: Date): number =>
  toDayValue({ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() });

/** 日付単位の数値どうしの差を日数で返す */
const diffInDays = (from: number, to: number): number => Math.round((to - from) / MS_PER_DAY);

/**
 * 在庫の期限状態と、一覧の「残り日数」列に表示するラベルを求める。
 * 期限が設定されていれば期限までの日数、未設定なら購入日からの経過日数を返す。
 * @param inventory - 対象の在庫
 * @param today - 基準日。省略時は当日
 */
export const getExpirationInfo = (
  inventory: Inventory,
  today: Date = new Date(),
): ExpirationInfo => {
  const baseDay = toComparableDayFromDate(today);

  // 期限未設定の在庫は購入日からの経過日数を表示する
  if (inventory.expirationDate === null) {
    const purchaseDay = toComparableDay(inventory.purchaseDate);
    if (purchaseDay === null) {
      return { status: 'none', label: UNKNOWN_LABEL };
    }

    const elapsedDays = diffInDays(purchaseDay, baseDay);
    // 購入日が未来の在庫は経過日数を決められない（入力誤りとみなす）
    if (elapsedDays < 0) {
      return { status: 'none', label: UNKNOWN_LABEL };
    }

    return { status: 'none', label: `購入から${elapsedDays}日` };
  }

  const expirationDay = toComparableDay(inventory.expirationDate);
  if (expirationDay === null) {
    return { status: 'none', label: UNKNOWN_LABEL };
  }

  const remainingDays = diffInDays(baseDay, expirationDay);

  if (remainingDays < 0) {
    return { status: 'expired', label: `${-remainingDays}日超過` };
  }

  if (remainingDays === 0) {
    return { status: 'warning', label: '本日まで' };
  }

  if (remainingDays <= WARNING_THRESHOLD_DAYS) {
    return { status: 'warning', label: `あと${remainingDays}日` };
  }

  return { status: 'normal', label: `あと${remainingDays}日` };
};
