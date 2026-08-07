import { describe, expect, it } from 'vitest';

import { InventoryFormValues } from '../types';

import { validateInventoryForm } from './validateInventoryForm';

// テストデータはファクトリ関数で用意し、意味のある値だけを overrides で明示する
const createFormValues = (overrides: Partial<InventoryFormValues> = {}): InventoryFormValues => ({
  category: '野菜',
  expirationDate: '',
  memo: '',
  name: '白菜',
  purchaseDate: '2026-08-06',
  quantity: '1',
  storage: '冷蔵庫',
  ...overrides,
});

describe('validateInventoryForm', () => {
  describe('正常系', () => {
    it('すべて妥当な値のとき空オブジェクトを返す', () => {
      const values = createFormValues();

      expect(validateInventoryForm(values)).toEqual({});
    });

    it('期限が空文字（任意項目の未入力）でもエラーにならない', () => {
      const values = createFormValues({ expirationDate: '' });

      expect(validateInventoryForm(values)).toEqual({});
    });

    it('メモが空文字でもエラーにならない', () => {
      const values = createFormValues({ memo: '' });

      expect(validateInventoryForm(values)).toEqual({});
    });

    it('期限が購入日より前でもエラーにならない', () => {
      const values = createFormValues({ expirationDate: '2026-01-01', purchaseDate: '2026-08-06' });

      expect(validateInventoryForm(values)).toEqual({});
    });
  });

  describe('異常系', () => {
    it('食品名が空文字のとき食品名を入力してくださいを返す', () => {
      const values = createFormValues({ name: '' });

      expect(validateInventoryForm(values)).toEqual({ name: '食品名を入力してください' });
    });

    it('食品名が空白のみのとき食品名を入力してくださいを返す', () => {
      const values = createFormValues({ name: '   ' });

      expect(validateInventoryForm(values)).toEqual({ name: '食品名を入力してください' });
    });

    it('カテゴリが空文字のときカテゴリを選択してくださいを返す', () => {
      const values = createFormValues({ category: '' });

      expect(validateInventoryForm(values)).toEqual({ category: 'カテゴリを選択してください' });
    });

    it('保管場所が空文字のとき保管場所を選択してくださいを返す', () => {
      const values = createFormValues({ storage: '' });

      expect(validateInventoryForm(values)).toEqual({ storage: '保管場所を選択してください' });
    });

    it('数量が空文字のとき数量を入力してくださいを返す', () => {
      const values = createFormValues({ quantity: '' });

      expect(validateInventoryForm(values)).toEqual({ quantity: '数量を入力してください' });
    });

    it('数量がabcのとき数量は整数で入力してくださいを返す', () => {
      const values = createFormValues({ quantity: 'abc' });

      expect(validateInventoryForm(values)).toEqual({ quantity: '数量は整数で入力してください' });
    });

    it('数量が1.5のとき数量は整数で入力してくださいを返す', () => {
      const values = createFormValues({ quantity: '1.5' });

      expect(validateInventoryForm(values)).toEqual({ quantity: '数量は整数で入力してください' });
    });

    it('数量が0のとき数量は1以上999以下で入力してくださいを返す', () => {
      const values = createFormValues({ quantity: '0' });

      expect(validateInventoryForm(values)).toEqual({
        quantity: '数量は1以上999以下で入力してください',
      });
    });

    it('購入日が空文字のとき購入日を入力してくださいを返す', () => {
      const values = createFormValues({ purchaseDate: '' });

      expect(validateInventoryForm(values)).toEqual({ purchaseDate: '購入日を入力してください' });
    });

    it('購入日が実在しない日付のとき購入日を正しい日付で入力してくださいを返す', () => {
      const values = createFormValues({ purchaseDate: '2026-02-30' });

      expect(validateInventoryForm(values)).toEqual({
        purchaseDate: '購入日を正しい日付で入力してください',
      });
    });

    it('期限がnot-a-dateのとき期限を正しい日付で入力してくださいを返す', () => {
      const values = createFormValues({ expirationDate: 'not-a-date' });

      expect(validateInventoryForm(values)).toEqual({
        expirationDate: '期限を正しい日付で入力してください',
      });
    });

    it('複数フィールドが不正なときそのすべてのキーがエラーに含まれる', () => {
      const values = createFormValues({ name: '', category: '', quantity: '' });

      const result = validateInventoryForm(values);

      expect(Object.keys(result).sort()).toEqual(['category', 'name', 'quantity']);
    });
  });

  describe('境界値', () => {
    it('食品名が50文字のときエラーにならない', () => {
      const values = createFormValues({ name: 'あ'.repeat(50) });

      expect(validateInventoryForm(values)).toEqual({});
    });

    it('食品名が51文字のとき食品名は50文字以内で入力してくださいを返す', () => {
      const values = createFormValues({ name: 'あ'.repeat(51) });

      expect(validateInventoryForm(values)).toEqual({
        name: '食品名は50文字以内で入力してください',
      });
    });

    it('数量が1のときエラーにならない', () => {
      const values = createFormValues({ quantity: '1' });

      expect(validateInventoryForm(values)).toEqual({});
    });

    it('数量が999のときエラーにならない', () => {
      const values = createFormValues({ quantity: '999' });

      expect(validateInventoryForm(values)).toEqual({});
    });

    it('数量が1000のとき数量は1以上999以下で入力してくださいを返す', () => {
      const values = createFormValues({ quantity: '1000' });

      expect(validateInventoryForm(values)).toEqual({
        quantity: '数量は1以上999以下で入力してください',
      });
    });

    it('メモが200文字のときエラーにならない', () => {
      const values = createFormValues({ memo: 'あ'.repeat(200) });

      expect(validateInventoryForm(values)).toEqual({});
    });

    it('メモが201文字のときメモは200文字以内で入力してくださいを返す', () => {
      const values = createFormValues({ memo: 'あ'.repeat(201) });

      expect(validateInventoryForm(values)).toEqual({
        memo: 'メモは200文字以内で入力してください',
      });
    });
  });
});
