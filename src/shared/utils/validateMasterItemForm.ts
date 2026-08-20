/** 名称の最大文字数 */
const NAME_MAX_LENGTH = 20;

/**
 * マスタ項目フォームの名称を検証する。
 * @param name - 入力された名称
 * @param itemLabel - 項目種別のラベル（例: 'カテゴリ' / '保管場所'）。メッセージの組み立てに使う
 * @param existingNames - 重複チェック対象の既存名称。編集時は対象自身の名称を除いて渡すこと
 * @returns エラーメッセージ。問題が無ければ `undefined`
 */
export const validateMasterItemForm = (
  name: string,
  itemLabel: string,
  existingNames: string[],
): string | undefined => {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return `${itemLabel}名を入力してください`;
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `${itemLabel}名は${NAME_MAX_LENGTH}文字以内で入力してください`;
  }
  if (existingNames.includes(trimmed)) {
    return `同じ名前の${itemLabel}が既に登録されています`;
  }

  return undefined;
};
