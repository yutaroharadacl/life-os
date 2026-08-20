import { InventoryFormErrors, InventoryFormValues } from '../types';

import { parseIsoDate } from './isoDate';

import { validateMasterItemForm } from '@/shared/utils/validateMasterItemForm';

/** カテゴリ・保管場所の `<select>` で「＋ 新規登録」を表す値 */
export const NEW_MASTER_ITEM_VALUE = '__new__';

/** 食品名の最大文字数 */
const NAME_MAX_LENGTH = 50;
/** メモの最大文字数 */
const MEMO_MAX_LENGTH = 200;
/** 数量の下限 */
const QUANTITY_MIN = 1;
/** 数量の上限 */
const QUANTITY_MAX = 999;

/** 整数のみを受け付ける正規表現（符号・小数点は不可） */
const INTEGER_PATTERN = /^\d+$/;

/** 食品名を検証する */
const validateName = (name: string): string | undefined => {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return '食品名を入力してください';
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `食品名は${NAME_MAX_LENGTH}文字以内で入力してください`;
  }

  return undefined;
};

/** 数量を検証する */
const validateQuantity = (quantity: string): string | undefined => {
  if (quantity === '') {
    return '数量を入力してください';
  }
  if (!INTEGER_PATTERN.test(quantity)) {
    return '数量は整数で入力してください';
  }

  const value = Number(quantity);
  if (value < QUANTITY_MIN || value > QUANTITY_MAX) {
    return `数量は${QUANTITY_MIN}以上${QUANTITY_MAX}以下で入力してください`;
  }

  return undefined;
};

/** 購入日を検証する（必須） */
const validatePurchaseDate = (purchaseDate: string): string | undefined => {
  if (purchaseDate === '') {
    return '購入日を入力してください';
  }
  if (parseIsoDate(purchaseDate) === null) {
    return '購入日を正しい日付で入力してください';
  }

  return undefined;
};

/** 期限を検証する（任意項目のため未入力は許容する） */
const validateExpirationDate = (expirationDate: string): string | undefined => {
  if (expirationDate === '') {
    return undefined;
  }
  if (parseIsoDate(expirationDate) === null) {
    return '期限を正しい日付で入力してください';
  }

  return undefined;
};

/** メモを検証する（任意項目） */
const validateMemo = (memo: string): string | undefined =>
  memo.length > MEMO_MAX_LENGTH ? `メモは${MEMO_MAX_LENGTH}文字以内で入力してください` : undefined;

/**
 * 在庫登録フォームの入力値を検証する。
 * 最初のエラーで打ち切らず、全フィールドをまとめて検証する
 * （利用者が1つ直すたびに次のエラーが現れるのを避けるため）。
 * @param values - フォームの入力値
 * @param existingCategoryNames - 重複チェック対象の既存カテゴリ名（category が新規登録のときのみ使う）
 * @param existingStorageNames - 重複チェック対象の既存保管場所名（storage が新規登録のときのみ使う）
 * @returns フィールドごとのエラーメッセージ。エラーが無ければ空オブジェクト
 */
export const validateInventoryForm = (
  values: InventoryFormValues,
  existingCategoryNames: string[] = [],
  existingStorageNames: string[] = [],
): InventoryFormErrors => {
  const candidates: InventoryFormErrors = {
    name: validateName(values.name),
    category: values.category === '' ? 'カテゴリを選択してください' : undefined,
    newCategoryName:
      values.category === NEW_MASTER_ITEM_VALUE
        ? validateMasterItemForm(values.newCategoryName, 'カテゴリ', existingCategoryNames)
        : undefined,
    storage: values.storage === '' ? '保管場所を選択してください' : undefined,
    newStorageName:
      values.storage === NEW_MASTER_ITEM_VALUE
        ? validateMasterItemForm(values.newStorageName, '保管場所', existingStorageNames)
        : undefined,
    quantity: validateQuantity(values.quantity),
    expirationDate: validateExpirationDate(values.expirationDate),
    purchaseDate: validatePurchaseDate(values.purchaseDate),
    memo: validateMemo(values.memo),
  };

  // エラーの無いフィールドはキーごと落とし、「キーが無い＝正常」で判定できるようにする
  return Object.fromEntries(
    Object.entries(candidates).filter(([, message]) => message !== undefined),
  );
};
