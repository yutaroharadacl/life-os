import { MasterItemListView } from '@/features/master/components/MasterItemListView';
import { getCategories } from '@/shared/api/getCategories';

/**
 * カテゴリ一覧は Server Component が実行時に Go バックエンドへ取得しに行くため、
 * ビルド時の静的化を無効にする（既定のままだとビルドマシンから到達できない
 * バックエンドの呼び出しに失敗する、または古いデータが焼き込まれる）。
 */
export const dynamic = 'force-dynamic';

export default async function MasterCategories() {
  const categories = await getCategories();

  return (
    <MasterItemListView
      title="カテゴリ管理"
      itemLabel="カテゴリ"
      resource="category"
      initialItems={categories}
    />
  );
}
