import { Inventory, InventoryFilters } from '../types';

/**
 * 在庫をキーワード・カテゴリ・保管場所で絞り込む（すべての条件を満たす AND）。
 * キーワードは食品名の部分一致（前後の空白を除去し、大文字小文字を区別しない）。
 * 各条件は空文字のとき「絞り込みなし」として扱う。
 * @param inventories - 絞り込む在庫
 * @param filters - 絞り込み条件
 * @returns 条件に一致する在庫の新しい配列（引数の配列は変更しない）
 */
export const filterInventories = (
  inventories: Inventory[] = [],
  filters: InventoryFilters,
): Inventory[] => {
  const keyword = filters.keyword.trim().toLowerCase();

  return inventories.filter((inventory) => {
    const matchesKeyword = keyword === '' || inventory.name.toLowerCase().includes(keyword);
    const matchesCategory = filters.category === '' || inventory.category === filters.category;
    const matchesStorage = filters.storage === '' || inventory.storage === filters.storage;

    return matchesKeyword && matchesCategory && matchesStorage;
  });
};
