import { describe, expect, it } from 'vitest';

import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('ISO形式の日付をYYYY/MM/DD形式に変換する', () => {
    const result = formatDate('2026-08-06');

    expect(result).toBe('2026/08/06');
  });

  it('nullの場合はなしを返す', () => {
    const result = formatDate(null);

    expect(result).toBe('なし');
  });

  it('不正な文字列の場合は-を返す', () => {
    const result = formatDate('not-a-date');

    expect(result).toBe('-');
  });

  it('書式は正しいが存在しない日付の場合は-を返す', () => {
    const result = formatDate('2026-02-30');

    expect(result).toBe('-');
  });
});
