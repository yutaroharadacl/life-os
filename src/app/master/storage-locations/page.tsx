import { MasterItemListView } from '@/features/master/components/MasterItemListView';
import { getStorageLocations } from '@/shared/api/getStorageLocations';

/**
 * 保管場所一覧は Server Component が実行時に Go バックエンドへ取得しに行くため、
 * ビルド時の静的化を無効にする（既定のままだとビルドマシンから到達できない
 * バックエンドの呼び出しに失敗する、または古いデータが焼き込まれる）。
 */
export const dynamic = 'force-dynamic';

export default async function MasterStorageLocations() {
  const storageLocations = await getStorageLocations();

  return (
    <MasterItemListView
      title="保管場所管理"
      itemLabel="保管場所"
      resource="storage"
      initialItems={storageLocations}
    />
  );
}
