import { Inventory, InventoryGroup } from '../types';

/** 保管場所が未設定の在庫をまとめるグループ名 */
const UNSPECIFIED_STORAGE = '未指定';

/**
 * 在庫を保管場所ごとのグループに分ける。
 * グループの順序は在庫データに最初に現れた順（保管場所マスタの表示順が実装されるまでの暫定仕様）。
 * @param inventories - グループ化する在庫
 * @returns 保管場所ごとのグループの配列（引数の配列は変更しない）
 */
export const groupByStorage = (inventories: Inventory[] = []): InventoryGroup[] => {
  const groups: InventoryGroup[] = [];

  for (const inventory of inventories) {
    const storage = inventory.storage || UNSPECIFIED_STORAGE;
    const group = groups.find((candidate) => candidate.storage === storage);

    if (group) {
      group.inventories.push(inventory);
    } else {
      groups.push({ storage, inventories: [inventory] });
    }
  }

  return groups;
};
