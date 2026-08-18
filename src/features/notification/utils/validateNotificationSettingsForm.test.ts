import { describe, expect, it } from 'vitest';

import { validateNotificationSettingsForm } from './validateNotificationSettingsForm';

describe('validateNotificationSettingsForm', () => {
  describe('正常系', () => {
    it('妥当な整数の文字列のときundefinedを返す', () => {
      const result = validateNotificationSettingsForm('5');

      expect(result).toBeUndefined();
    });

    it('2桁の整数の文字列のときundefinedを返す', () => {
      const result = validateNotificationSettingsForm('30');

      expect(result).toBeUndefined();
    });
  });

  describe('異常系', () => {
    it('空文字のとき通知タイミングを入力してくださいを返す', () => {
      const result = validateNotificationSettingsForm('');

      expect(result).toBe('通知タイミングを入力してください');
    });

    it('空白のみのとき通知タイミングを入力してくださいを返す', () => {
      const result = validateNotificationSettingsForm('   ');

      expect(result).toBe('通知タイミングを入力してください');
    });

    it('0のとき通知タイミングは1以上90以下で入力してくださいを返す', () => {
      const result = validateNotificationSettingsForm('0');

      expect(result).toBe('通知タイミングは1以上90以下で入力してください');
    });

    it('91のとき通知タイミングは1以上90以下で入力してくださいを返す', () => {
      const result = validateNotificationSettingsForm('91');

      expect(result).toBe('通知タイミングは1以上90以下で入力してください');
    });

    it('1.5のとき通知タイミングは整数で入力してくださいを返す', () => {
      const result = validateNotificationSettingsForm('1.5');

      expect(result).toBe('通知タイミングは整数で入力してください');
    });

    it('数値として解釈できない文字列のとき通知タイミングは整数で入力してくださいを返す', () => {
      const result = validateNotificationSettingsForm('abc');

      expect(result).toBe('通知タイミングは整数で入力してください');
    });

    it('マイナスの整数のとき通知タイミングは1以上90以下で入力してくださいを返す', () => {
      const result = validateNotificationSettingsForm('-1');

      expect(result).toBe('通知タイミングは1以上90以下で入力してください');
    });
  });

  describe('境界値', () => {
    it('1のときエラーにならない', () => {
      const result = validateNotificationSettingsForm('1');

      expect(result).toBeUndefined();
    });

    it('90のときエラーにならない', () => {
      const result = validateNotificationSettingsForm('90');

      expect(result).toBeUndefined();
    });
  });
});
