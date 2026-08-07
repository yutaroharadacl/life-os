import { InventoryDraft, InventoryFormValues } from '../types';

/**
 * フォームの入力値（すべて文字列）をドメイン型の登録値へ変換する。
 * 検証は `validateInventoryForm` の責務とし、ここでは型の変換だけを行う。
 * @param values - 検証済みのフォーム入力値
 * @returns 登録用の在庫データ
 */
export const toInventoryDraft = (values: InventoryFormValues): InventoryDraft => ({
  name: values.name.trim(),
  category: values.category,
  storage: values.storage,
  quantity: Number(values.quantity),
  // 任意項目のため、未入力は空文字ではなく null として保持する
  expirationDate: values.expirationDate === '' ? null : values.expirationDate,
  purchaseDate: values.purchaseDate,
  memo: values.memo,
});
