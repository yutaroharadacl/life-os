import { parseIsoDate } from './isoDate';

/**
 * ISO 形式（YYYY-MM-DD）の日付を表示用（YYYY/MM/DD）に整形する。
 * 一覧全体を壊さないよう、解釈できない値でも例外を投げずフォールバック文字列を返す。
 * @param isoDate - ISO 形式の日付。未設定は null
 * @returns 整形した日付 / 未設定なら「なし」 / 解釈できなければ「-」
 */
export const formatDate = (isoDate: string | null): string => {
  if (isoDate === null) {
    return 'なし';
  }

  const parts = parseIsoDate(isoDate);
  if (parts === null) {
    return '-';
  }

  const year = String(parts.year).padStart(4, '0');
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');

  return `${year}/${month}/${day}`;
};
