'use client';

import { useId, useState } from 'react';

import { useInventoryFilterStore } from '../../stores/useInventoryFilterStore';
import { SortOrder } from '../../types';

import styles from './InventoryFilterBar.module.scss';

import { Category } from '@/shared/types';

/** カテゴリ絞り込みの「すべて」を表す値 */
const ALL_VALUE = '';

/** 並び替えの選択肢 */
const SORT_ORDER_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'expirationAsc', label: '期限が近い順' },
  { value: 'nameAsc', label: '食品名順' },
];

type Props = {
  /** 選択肢に出すカテゴリマスタ */
  categories?: Category[];
};

/**
 * 検索・絞り込み・並び替え UI。スマホの縦スペースを圧迫しないよう、初期状態は閉じた開閉パネルにする。
 * 保管場所での絞り込みは InventoryStorageTabs に統合したため、ここでは扱わない。
 */
export const InventoryFilterBar = ({ categories = [] }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  const keyword = useInventoryFilterStore((state) => state.keyword);
  const category = useInventoryFilterStore((state) => state.category);
  const sortOrder = useInventoryFilterStore((state) => state.sortOrder);
  const setKeyword = useInventoryFilterStore((state) => state.setKeyword);
  const setCategory = useInventoryFilterStore((state) => state.setCategory);
  const setSortOrder = useInventoryFilterStore((state) => state.setSortOrder);
  const resetFilters = useInventoryFilterStore((state) => state.resetFilters);

  return (
    <div className={styles.container} role="search">
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((previous) => !previous)}
      >
        絞り込み・並び替え
      </button>

      {isOpen && (
        <div id={panelId} className={styles.panel}>
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
      )}
    </div>
  );
};
