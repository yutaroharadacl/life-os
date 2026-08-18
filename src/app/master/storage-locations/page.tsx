import { MasterItemListView } from '@/features/master/components/MasterItemListView';
import { getStorageLocations } from '@/shared/api/getStorageLocations';

export default function MasterStorageLocations() {
  const storageLocations = getStorageLocations();

  return (
    <MasterItemListView title="保管場所管理" itemLabel="保管場所" initialItems={storageLocations} />
  );
}
