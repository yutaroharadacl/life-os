import { Inventory } from '../../types';
import { groupByStorage } from '../../utils/groupeInventories';
import { InventoryCard } from '../InventoryCard/InventoryCard';
import styles from './InventoryList.module.scss';

type Props = {
  inventories: Inventory[];
};

export const InventoryList = ({ inventories = [] }: Props) => {
  if (inventories.length === 0) {
    return (
      <div className={styles.empty}>
        <p>登録されている在庫はありません。</p>
      </div>
    );
  }

  const groupedInventoryList = groupByStorage(inventories);

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>在庫一覧</h2>
        <span className={styles.count}>全 {inventories.length} 件</span>
      </div>

      {/* カードをグリッド状に並べるコンテナ */}
      {Object.entries(groupedInventoryList).map(([storageName, items]) => {
        return (
          <section key={storageName} className={styles.section}>
            <h3 className={styles.storageTitle}>{storageName}</h3>

            <div className={styles.grid}>
              {items.map((item, i) => (
                <InventoryCard key={item.name} inventory={item} />
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
};
