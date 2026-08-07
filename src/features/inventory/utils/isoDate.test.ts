import { describe, expect, it } from 'vitest';

import { formatIsoDate, parseIsoDate } from './isoDate';

describe('parseIsoDate', () => {
  describe('正常系', () => {
    it('ISO形式の日付を年月日に分解する', () => {
      const result = parseIsoDate('2026-08-06');

      expect(result).toEqual({ year: 2026, month: 8, day: 6 });
    });

    it('うるう年の2月29日を受け付ける', () => {
      const result = parseIsoDate('2028-02-29');

      expect(result).toEqual({ year: 2028, month: 2, day: 29 });
    });
  });

  describe('異常系', () => {
    it('日付として解釈できない文字列はnullを返す', () => {
      expect(parseIsoDate('not-a-date')).toBeNull();
    });

    it('YYYY/MM/DD形式はnullを返す', () => {
      expect(parseIsoDate('2026/08/06')).toBeNull();
    });

    it('空文字はnullを返す', () => {
      expect(parseIsoDate('')).toBeNull();
    });
  });

  describe('境界値', () => {
    it('存在しない日付（2026-02-30）はnullを返す', () => {
      expect(parseIsoDate('2026-02-30')).toBeNull();
    });

    it('うるう年でない年の2月29日はnullを返す', () => {
      expect(parseIsoDate('2026-02-29')).toBeNull();
    });

    it('13月はnullを返す', () => {
      expect(parseIsoDate('2026-13-01')).toBeNull();
    });

    it('0日はnullを返す', () => {
      expect(parseIsoDate('2026-08-00')).toBeNull();
    });

    it('西暦100年未満でも1900年代に読み替えない', () => {
      expect(parseIsoDate('0026-08-06')).toEqual({ year: 26, month: 8, day: 6 });
    });
  });
});

describe('formatIsoDate', () => {
  describe('正常系', () => {
    it('日付をYYYY-MM-DD形式の文字列に変換する', () => {
      const date = new Date(2026, 7, 6);

      expect(formatIsoDate(date)).toBe('2026-08-06');
    });
  });

  describe('境界値', () => {
    it('月・日が1桁のときは0埋めされる', () => {
      const date = new Date(2026, 0, 5);

      expect(formatIsoDate(date)).toBe('2026-01-05');
    });

    it('ローカルタイムの年月日を使い、UTC変換で日付がずれない', () => {
      // UTCに変換すると前日になりうる深夜0時に近い時刻で確認する
      const date = new Date(2026, 7, 6, 0, 30);

      expect(formatIsoDate(date)).toBe('2026-08-06');
    });
  });
});
