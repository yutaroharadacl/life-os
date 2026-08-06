/** ISO 形式（YYYY-MM-DD）を判定する正規表現 */
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** 日付を年月日に分解したもの。月は1始まり */
export type IsoDateParts = {
  year: number;
  month: number;
  day: number;
};

/**
 * 年月日から UTC 基準の Date を作る。
 * `Date.UTC` は 0〜99 年を1900年代に読み替えるため、年は後から明示的に設定する。
 */
const toUtcDate = ({ year, month, day }: IsoDateParts): Date => {
  const date = new Date(Date.UTC(2000, month - 1, day));
  date.setUTCFullYear(year);

  return date;
};

/**
 * ISO 形式（YYYY-MM-DD）の日付文字列を年月日に分解する。
 * 書式が違う場合に加え、2026-02-30 のような実在しない日付も受け付けない。
 * 日付を扱うユーティリティはすべてこの関数で解釈を揃えること
 * （表示と日数計算で妥当性の判定が食い違わないようにするため）。
 * @param isoDate - ISO 形式の日付文字列
 * @returns 分解した年月日。日付として解釈できない場合は null
 */
export const parseIsoDate = (isoDate: string): IsoDateParts | null => {
  const matched = ISO_DATE_PATTERN.exec(isoDate);
  if (!matched) {
    return null;
  }

  const parts = {
    year: Number(matched[1]),
    month: Number(matched[2]),
    day: Number(matched[3]),
  };
  const date = toUtcDate(parts);

  // 桁上がりしていたら実在しない日付（例: 2026-02-30 → 3月2日）
  if (
    date.getUTCFullYear() !== parts.year ||
    date.getUTCMonth() !== parts.month - 1 ||
    date.getUTCDate() !== parts.day
  ) {
    return null;
  }

  return parts;
};

/**
 * 年月日を、日付単位で比較できる数値に変換する。
 * タイムゾーンの影響を受けないよう UTC 基準で揃える。
 */
export const toDayValue = (parts: IsoDateParts): number => toUtcDate(parts).getTime();
