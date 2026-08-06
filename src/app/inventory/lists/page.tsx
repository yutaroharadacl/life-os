import { getInventories } from '@/features/inventory/api/getInventories';
import { InventoryTable } from '@/features/inventory/components/InventoryTable';

/**
 * 「残り日数」はアクセス時点の日付で計算する必要があるため、静的プリレンダリングを無効にする。
 * 既定のままだとビルド時刻が HTML に焼き込まれ、日が変わっても表示が更新されない。
 */
export const dynamic = 'force-dynamic';

export default function InventoryLists() {
  const inventories = getInventories();

  return <InventoryTable inventories={inventories} />;
}
