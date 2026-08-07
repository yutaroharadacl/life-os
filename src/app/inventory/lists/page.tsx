import { getCategories } from '@/features/inventory/api/getCategories';
import { getInventories } from '@/features/inventory/api/getInventories';
import { getStorageLocations } from '@/features/inventory/api/getStorageLocations';
import { InventoryListsView } from '@/features/inventory/components/InventoryListsView';

/**
 * 「残り日数」はアクセス時点の日付で計算する必要があるため、静的プリレンダリングを無効にする。
 * 既定のままだとビルド時刻が HTML に焼き込まれ、日が変わっても表示が更新されない。
 */
export const dynamic = 'force-dynamic';

export default function InventoryLists() {
  const inventories = getInventories();
  const categories = getCategories();
  const storageLocations = getStorageLocations();

  /**
   * 「残り日数」の基準日はここで1度だけ求めて渡す。
   * 一覧はクライアント境界にあり SSR とハイドレーションの2回描画されるため、
   * 表示側で `new Date()` を評価するとサーバーとブラウザのタイムゾーン差で
   * 別々の日付になり、内容の食い違い（hydration mismatch）が起きる。
   */
  const today = new Date();

  return (
    <InventoryListsView
      initialInventories={inventories}
      categories={categories}
      storageLocations={storageLocations}
      today={today}
    />
  );
}
