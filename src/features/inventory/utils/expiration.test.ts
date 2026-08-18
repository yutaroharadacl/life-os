import { describe, expect, it } from 'vitest';

import { Inventory } from '../types';

import { getExpirationInfo } from './expiration';

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createInventory = (overrides: Partial<Inventory> = {}): Inventory => ({
  category: '野菜',
  expirationDate: null,
  id: '1',
  memo: '',
  name: '白菜',
  purchaseDate: '2026-08-03',
  quantity: 1,
  storage: '冷蔵庫',
  ...overrides,
});

describe('getExpirationInfo', () => {
  // 実装はローカルタイムの年月日で判定するため、基準日もローカル日付で作る。
  // new Date('2026-08-06') は UTC 深夜のため、UTC より遅れたタイムゾーンでは前日になってしまう。
  const today = new Date(2026, 7, 6);

  describe('正常系', () => {
    it('期限が今日より3日後の場合は warning であと3日と表示する', () => {
      const inventory = createInventory({ expirationDate: '2026-08-09' });

      const result = getExpirationInfo(inventory, today);

      expect(result).toEqual({ status: 'warning', label: 'あと3日' });
    });

    it('期限が今日より10日後の場合は normal であと10日と表示する', () => {
      const inventory = createInventory({ expirationDate: '2026-08-16' });

      const result = getExpirationInfo(inventory, today);

      expect(result).toEqual({ status: 'normal', label: 'あと10日' });
    });

    it('期限が今日の場合は warning で本日までと表示する', () => {
      const inventory = createInventory({ expirationDate: '2026-08-06' });

      const result = getExpirationInfo(inventory, today);

      expect(result).toEqual({ status: 'warning', label: '本日まで' });
    });

    it('期限が3日前の場合は expired で3日超過と表示する', () => {
      const inventory = createInventory({ expirationDate: '2026-08-03' });

      const result = getExpirationInfo(inventory, today);

      expect(result).toEqual({ status: 'expired', label: '3日超過' });
    });

    it('期限がnullで購入日が5日前の場合は none で購入から5日と表示する', () => {
      const inventory = createInventory({ expirationDate: null, purchaseDate: '2026-08-01' });

      const result = getExpirationInfo(inventory, today);

      expect(result).toEqual({ status: 'none', label: '購入から5日' });
    });

    it('期限がnullで購入日が今日の場合は none で購入から0日と表示する', () => {
      const inventory = createInventory({ expirationDate: null, purchaseDate: '2026-08-06' });

      const result = getExpirationInfo(inventory, today);

      expect(result).toEqual({ status: 'none', label: '購入から0日' });
    });
  });

  describe('異常系', () => {
    it('expirationDateが不正な文字列の場合は例外を投げずnoneで-を返す', () => {
      const inventory = createInventory({ expirationDate: 'not-a-date' });

      const result = getExpirationInfo(inventory, today);

      expect(result).toEqual({ status: 'none', label: '-' });
    });

    it('expirationDateがnullで購入日が未来の場合は経過日数を出さずnoneで-を返す', () => {
      const inventory = createInventory({ expirationDate: null, purchaseDate: '2026-08-09' });

      const result = getExpirationInfo(inventory, today);

      expect(result).toEqual({ status: 'none', label: '-' });
    });

    it('expirationDateがnullかつpurchaseDateが不正な文字列の場合はnoneで-を返す', () => {
      const inventory = createInventory({
        expirationDate: null,
        purchaseDate: 'not-a-date',
      });

      const result = getExpirationInfo(inventory, today);

      expect(result).toEqual({ status: 'none', label: '-' });
    });
  });

  describe('境界値', () => {
    it('期限が今日より4日後の場合はwarningではなくnormalになる', () => {
      const inventory = createInventory({ expirationDate: '2026-08-10' });

      const result = getExpirationInfo(inventory, today);

      expect(result).toEqual({ status: 'normal', label: 'あと4日' });
    });

    it('期限が今日より1日後の場合はwarningであと1日と表示する', () => {
      const inventory = createInventory({ expirationDate: '2026-08-07' });

      const result = getExpirationInfo(inventory, today);

      expect(result).toEqual({ status: 'warning', label: 'あと1日' });
    });

    it('期限が今日より1日前の場合はexpiredで1日超過と表示する', () => {
      const inventory = createInventory({ expirationDate: '2026-08-05' });

      const result = getExpirationInfo(inventory, today);

      expect(result).toEqual({ status: 'expired', label: '1日超過' });
    });

    it('基準日の時刻が23:59でも日付単位で判定し同日なら本日までと表示する', () => {
      const inventory = createInventory({ expirationDate: '2026-08-06' });
      const lateToday = new Date(2026, 7, 6, 23, 59);

      const result = getExpirationInfo(inventory, lateToday);

      expect(result).toEqual({ status: 'warning', label: '本日まで' });
    });
  });

  describe('warningThresholdDays（通知設定連動）', () => {
    it('第3引数にwarningThresholdDays=7を渡すと期限が7日後の在庫はwarningになる', () => {
      // 既定の3日なら normal になるはずの日数で確認する
      const inventory = createInventory({ expirationDate: '2026-08-13' });

      const result = getExpirationInfo(inventory, today, 7);

      expect(result).toEqual({ status: 'warning', label: 'あと7日' });
    });

    it('第3引数を省略すると、これまでどおり3日以内がwarningになる（回帰確認）', () => {
      const inventory = createInventory({ expirationDate: '2026-08-09' });

      const result = getExpirationInfo(inventory, today);

      expect(result).toEqual({ status: 'warning', label: 'あと3日' });
    });

    it('warningThresholdDays=7のとき期限がちょうど7日後はwarningになる（境界値）', () => {
      const inventory = createInventory({ expirationDate: '2026-08-13' });

      const result = getExpirationInfo(inventory, today, 7);

      expect(result.status).toBe('warning');
    });

    it('warningThresholdDays=7のとき期限が8日後（しきい値+1日）はnormalになる（境界値）', () => {
      const inventory = createInventory({ expirationDate: '2026-08-14' });

      const result = getExpirationInfo(inventory, today, 7);

      expect(result).toEqual({ status: 'normal', label: 'あと8日' });
    });

    it('expired判定はwarningThresholdDaysの値に関わらず変化しない（境界値）', () => {
      const inventory = createInventory({ expirationDate: '2026-08-03' });

      const result = getExpirationInfo(inventory, today, 7);

      expect(result).toEqual({ status: 'expired', label: '3日超過' });
    });
  });
});
