import { MasterItemListView } from '@/features/master/components/MasterItemListView';
import { getCategories } from '@/shared/api/getCategories';

export default function MasterCategories() {
  const categories = getCategories();

  return <MasterItemListView title="カテゴリ管理" itemLabel="カテゴリ" initialItems={categories} />;
}
