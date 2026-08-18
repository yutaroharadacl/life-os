'use client';

import { useInventoryFilterStore } from '../../stores/useInventoryFilterStore';

import styles from './InventoryStorageTabs.module.scss';

import { StorageLocation } from '@/shared/types';

/** 「すべて」タブが表す値。保管場所での絞り込みなしと同じ扱い（既存の select と同じ） */
const ALL_VALUE = '';
const ALL_LABEL = 'すべて';

type Props = {
  /** タブに出す保管場所マスタ */
  storageLocations?: StorageLocation[];
};

/**
 * 保管場所ごとに一覧の表示を切り替えるタブ（「すべて」＋保管場所マスタの各名称）。
 * useInventoryFilterStore の storage を直接参照・更新するため、絞り込みロジック自体には手を入れない。
 */
export const InventoryStorageTabs = ({ storageLocations = [] }: Props) => {
  const storage = useInventoryFilterStore((state) => state.storage);
  const setStorage = useInventoryFilterStore((state) => state.setStorage);

  return (
    <div className={styles.container} role="tablist" aria-label="保管場所で表示を切り替え">
      <button
        type="button"
        role="tab"
        aria-selected={storage === ALL_VALUE}
        className={storage === ALL_VALUE ? styles.tabSelected : styles.tab}
        onClick={() => setStorage(ALL_VALUE)}
      >
        {ALL_LABEL}
      </button>

      {storageLocations.map((location) => {
        const isSelected = storage === location.name;

        return (
          <button
            key={location.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            className={isSelected ? styles.tabSelected : styles.tab}
            onClick={() => setStorage(location.name)}
          >
            {location.name}
          </button>
        );
      })}
    </div>
  );
};
