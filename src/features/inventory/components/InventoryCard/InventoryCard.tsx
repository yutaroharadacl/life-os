import { Inventory } from '../../types';
import styles from './InventoryCard.module.scss';

type Props = {
  inventory: Inventory;
};

export const InventoryCard = ({ inventory }: Props) => {
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <span className={styles.category}>{inventory.category}</span>
        <h2 className={styles.name}>{inventory.name}</h2>
      </header>

      <dl className={styles.details}>
        <div className={styles.detailItem}>
          <dt className={styles.label}>数量</dt>
          <dd className={`${styles.value} ${styles.highlight}`}>{inventory.quantity}</dd>
        </div>

        <div className={styles.detailItem}>
          <dt className={styles.label}>保管場所</dt>
          <dd className={styles.value}>{inventory.storage}</dd>
        </div>

        <div className={styles.detailItem}>
          <dt className={styles.label}>購入日</dt>
          <dd className={styles.value}>{inventory.purchaseDate || '-'}</dd>
        </div>

        <div className={styles.detailItem}>
          <dt className={styles.label}>賞味期限</dt>
          <dd className={`${styles.value} ${!inventory.expirationDate ? styles.muted : ''}`}>
            {inventory.expirationDate ? inventory.expirationDate : 'なし'}
          </dd>
        </div>
      </dl>
    </article>
  );
};
