import { InventoryList } from '@/features/inventory/components/InventoryList';
import { Inventory } from '@/features/inventory/types';

export default function InventoryLists() {
  // TODO: API実装後削除
  const dummyInventory: Inventory[] = [
    {
      category: '野菜',
      expirationDate: null,
      purchaseDate: '2026/08/03',
      name: '白菜',
      quantity: 1,
      storage: '冷蔵庫',
    },
    {
      category: '肉',
      expirationDate: '2026/08/06',
      purchaseDate: '2026/08/03',
      name: '豚こま肉',
      quantity: 1,
      storage: '冷蔵庫',
    },
    {
      category: '麺',
      expirationDate: '2026/08/06',
      purchaseDate: '2026/08/03',
      name: 'パスタ',
      quantity: 1,
      storage: 'パントリー',
    },
  ];

  return <InventoryList inventories={dummyInventory} />;
}
