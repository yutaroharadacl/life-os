import Link from 'next/link';

import styles from './MasterMenu.module.scss';

/** マスタ管理画面（画面4）から遷移できるマスタ種別。将来増える場合はここに追記する */
const MENU_ITEMS = [
  { href: '/master/categories', label: 'カテゴリ管理' },
  { href: '/master/storage-locations', label: '保管場所管理' },
] as const;

/** マスタ管理画面（画面4）。カテゴリ管理・保管場所管理など各種マスタデータへの入り口 */
export const MasterMenu = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>マスタ管理</h1>

      <ul className={styles.list}>
        {MENU_ITEMS.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={styles.link}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
