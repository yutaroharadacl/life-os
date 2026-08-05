import { Inventory } from '../types';

/**
 * 在庫リストを保管場所(storage)ごとにグループ化する関数
 * @param {Array} inventories - 在庫データの配列
 * @return {Object} - { "パントリー": [...], "冷蔵庫": [...] } のようなオブジェクト
 */
export const groupByStorage = (inventories: Inventory[] = []) => {
  return inventories.reduce(
    (acc, inventory) => {
      const key = inventory.storage || '未指定';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(inventory);
      return acc;
    },
    {} as Record<string, Inventory[]>,
  );
};
