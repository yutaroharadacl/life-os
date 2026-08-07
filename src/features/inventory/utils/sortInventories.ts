import { Inventory, SortOrder } from '../types';

/**
 * 在庫を期限が近い順に並び替える。
 * 期限ありを先に、期限なしを後に置き、期限なしどうしは購入日の古い順（経過日数の長い順）に並べる。
 * 日付は ISO 形式のため文字列比較で日付順になる。
 * @param inventories - 並び替える在庫
 * @returns 並び替えた新しい配列（引数の配列は変更しない）
 */
export const sortByExpiration = (inventories: Inventory[] = []): Inventory[] =>
  [...inventories].sort((a, b) => {
    if (a.expirationDate !== null && b.expirationDate !== null) {
      return a.expirationDate.localeCompare(b.expirationDate);
    }

    if (a.expirationDate !== null) {
      return -1;
    }

    if (b.expirationDate !== null) {
      return 1;
    }

    return a.purchaseDate.localeCompare(b.purchaseDate);
  });

/**
 * 在庫を指定した並び替え順で並び替える。
 * @param inventories - 並び替える在庫
 * @param sortOrder - 並び替え順。省略時は 'expirationAsc'（期限が近い順）
 * @returns 並び替えた新しい配列（引数の配列は変更しない）
 */
export const sortInventories = (
  inventories: Inventory[] = [],
  sortOrder: SortOrder = 'expirationAsc',
): Inventory[] => {
  if (sortOrder === 'nameAsc') {
    return [...inventories].sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  }

  return sortByExpiration(inventories);
};
