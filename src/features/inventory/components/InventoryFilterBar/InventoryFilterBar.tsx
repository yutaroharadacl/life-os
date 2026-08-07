'use client';

import { useInventoryFilterStore } from '../../stores/useInventoryFilterStore';
import { Category, SortOrder, StorageLocation } from '../../types';

import styles from './InventoryFilterBar.module.scss';

/** カテゴリ・保管場所フィルタの「すべて」を表す値 */
const ALL_VALUE = '';

/** 並び替えの選択肢 */
const SORT_ORDER_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'expirationAsc', label: '期限が近い順' },
  { value: 'nameAsc', label: '食品名順' },
];

type Props = {
  /** 選択肢に出すカテゴリマスタ */
  categories?: Category[];
  /** 選択肢に出す保管場所マスタ */
  storageLocations?: StorageLocation[];
};

export const InventoryFilterBar = ({ categories = [], storageLocations = [] }: Props) => {
  const keyword = useInventoryFilterStore((state) => state.keyword);
  const category = useInventoryFilterStore((state) => state.category);
  const storage = useInventoryFilterStore((state) => state.storage);
  const sortOrder = useInventoryFilterStore((state) => state.sortOrder);
  const setKeyword = useInventoryFilterStore((state) => state.setKeyword);
  const setCategory = useInventoryFilterStore((state) => state.setCategory);
  const setStorage = useInventoryFilterStore((state) => state.setStorage);
  const setSortOrder = useInventoryFilterStore((state) => state.setSortOrder);
  const resetFilters = useInventoryFilterStore((state) => state.resetFilters);

  return (
    <div className={styles.container} role="search">
      <div className={styles.field}>
        <label htmlFor="inventory-filter-keyword">食品名で検索</label>
        <input
          id="inventory-filter-keyword"
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="inventory-filter-category">カテゴリで絞り込み</label>
        <select
          id="inventory-filter-category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value={ALL_VALUE}>すべて</option>
          {categories.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="inventory-filter-storage">保管場所で絞り込み</label>
        <select
          id="inventory-filter-storage"
          value={storage}
          onChange={(event) => setStorage(event.target.value)}
        >
          <option value={ALL_VALUE}>すべて</option>
          {storageLocations.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="inventory-filter-sort">並び替え</label>
        <select
          id="inventory-filter-sort"
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value as SortOrder)}
        >
          {SORT_ORDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button type="button" className={styles.clear} onClick={resetFilters}>
        絞り込みをクリア
      </button>
    </div>
  );
};
