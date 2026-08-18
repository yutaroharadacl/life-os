import { describe, expect, it } from 'vitest';

import { validateMasterItemForm } from './validateMasterItemForm';

describe('validateMasterItemForm', () => {
  describe('正常系', () => {
    it('妥当な名称のときundefinedを返す', () => {
      const result = validateMasterItemForm('野菜', 'カテゴリ', []);

      expect(result).toBeUndefined();
    });

    it('existingNamesに他の項目名が含まれていても一致しなければundefinedを返す', () => {
      const result = validateMasterItemForm('野菜', 'カテゴリ', ['肉', '魚']);

      expect(result).toBeUndefined();
    });
  });

  describe('異常系', () => {
    it('名称が空文字のとき${itemLabel}名を入力してくださいを返す', () => {
      const result = validateMasterItemForm('', 'カテゴリ', []);

      expect(result).toBe('カテゴリ名を入力してください');
    });

    it('名称が空白のみのとき${itemLabel}名を入力してくださいを返す', () => {
      const result = validateMasterItemForm('   ', 'カテゴリ', []);

      expect(result).toBe('カテゴリ名を入力してください');
    });

    it('名称が21文字のとき${itemLabel}名は20文字以内で入力してくださいを返す', () => {
      const result = validateMasterItemForm('あ'.repeat(21), 'カテゴリ', []);

      expect(result).toBe('カテゴリ名は20文字以内で入力してください');
    });

    it('既存の名称と完全一致するとき同じ名前の${itemLabel}が既に登録されていますを返す', () => {
      const result = validateMasterItemForm('野菜', 'カテゴリ', ['野菜', '肉']);

      expect(result).toBe('同じ名前のカテゴリが既に登録されています');
    });

    it('itemLabelが保管場所のときエラーメッセージの${itemLabel}部分が保管場所になる', () => {
      const result = validateMasterItemForm('', '保管場所', []);

      expect(result).toBe('保管場所名を入力してください');
    });
  });

  describe('境界値', () => {
    it('名称が20文字のときエラーにならない', () => {
      const result = validateMasterItemForm('あ'.repeat(20), 'カテゴリ', []);

      expect(result).toBeUndefined();
    });

    it('existingNamesが空配列のとき重複エラーにならない', () => {
      const result = validateMasterItemForm('野菜', 'カテゴリ', []);

      expect(result).toBeUndefined();
    });

    it('前後に空白を含む名称はtrimしたうえで既存の名称と比較され重複エラーになる', () => {
      const result = validateMasterItemForm(' 野菜 ', 'カテゴリ', ['野菜']);

      expect(result).toBe('同じ名前のカテゴリが既に登録されています');
    });

    it('existingNamesに編集対象自身の名称が含まれていなければ、変更せずそのまま送信してもエラーにならない', () => {
      // 呼び出し元（MasterItemListView）が編集対象自身の名称を除いて existingNames を渡す設計を前提とする
      const result = validateMasterItemForm('野菜', 'カテゴリ', ['肉', '魚']);

      expect(result).toBeUndefined();
    });
  });
});
