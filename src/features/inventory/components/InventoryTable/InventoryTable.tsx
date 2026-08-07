import { ReactNode } from 'react';

import { ExpirationStatus, Inventory, SortOrder } from '../../types';
import { getExpirationInfo } from '../../utils/expiration';
import { formatDate } from '../../utils/formatDate';
import { groupByStorage } from '../../utils/groupInventories';
import { sortInventories } from '../../utils/sortInventories';
import { InventoryRowActions } from '../InventoryRowActions';

import styles from './InventoryTable.module.scss';

/** カテゴリが未設定のときの表示 */
const UNSPECIFIED_CATEGORY = '未指定';

/** 0件のときの既定メッセージ */
const DEFAULT_EMPTY_MESSAGE = '登録されている在庫はありません。';

/** 期限の状態ごとの文字色 */
const statusClassNames: Record<ExpirationStatus, string> = {
  expired: styles.expired,
  warning: styles.warning,
  normal: '',
  none: styles.muted,
};

type Props = {
  /** 表示する在庫。グループ化と並び替えはこのコンポーネントで行う */
  inventories?: Inventory[];
  /**
   * 期限日数の基準日。省略時は当日。
   * クライアント境界から使う場合は必ず呼び出し元で求めた値を渡すこと
   * （既定値に頼るとサーバーとブラウザで別々の日付になり表示が食い違う）。
   */
  today?: Date;
  /** ヘッダ右側に置く操作要素（例: 登録ボタン）。省略時は何も描画しない */
  action?: ReactNode;
  /** グループ内の並び替え順。省略時は 'expirationAsc'（既存の挙動） */
  sortOrder?: SortOrder;
  /** 0件のときのメッセージ。省略時は「登録されている在庫はありません。」 */
  emptyMessage?: string;
  /** 「編集」を押したときに、対象の在庫とともに呼ぶ。省略時は何もしない */
  onEdit?: (inventory: Inventory) => void;
  /** 削除確認で「削除する」を押したときに、対象の在庫とともに呼ぶ。省略時は何もしない */
  onDelete?: (inventory: Inventory) => void;
};

export const InventoryTable = ({
  inventories = [],
  today = new Date(),
  action,
  sortOrder = 'expirationAsc',
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  onEdit = () => {},
  onDelete = () => {},
}: Props) => {
  const groups = groupByStorage(inventories);

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>在庫一覧</h1>
        <span className={styles.count}>全 {inventories.length} 件</span>
        {action && <div className={styles.action}>{action}</div>}
      </div>

      {groups.length === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        groups.map((group, groupIndex) => {
          // 保管場所名は空白を含みうる（id に使うと aria-labelledby が壊れる）ため連番で作る
          const headingId = `inventory-storage-${groupIndex}`;

          return (
            <section key={group.storage} className={styles.group} aria-labelledby={headingId}>
              <h2 id={headingId} className={styles.storage}>
                {group.storage}
              </h2>

              {/* 画面幅が狭いときは横スクロールで全列を参照できるようにする */}
              <div className={styles.scroller}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">食品名</th>
                      <th scope="col">カテゴリ</th>
                      <th scope="col" className={styles.numeric}>
                        数量
                      </th>
                      <th scope="col">期限</th>
                      <th scope="col">残り日数</th>
                      <th scope="col">操作</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortInventories(group.inventories, sortOrder).map((inventory) => {
                      const expiration = getExpirationInfo(inventory, today);

                      return (
                        <tr key={inventory.id}>
                          <th scope="row" className={styles.name}>
                            {inventory.name}
                          </th>
                          <td>{inventory.category || UNSPECIFIED_CATEGORY}</td>
                          <td className={styles.numeric}>{inventory.quantity}</td>
                          <td>{formatDate(inventory.expirationDate)}</td>
                          <td className={statusClassNames[expiration.status]}>
                            {expiration.label}
                          </td>
                          <td>
                            <InventoryRowActions
                              inventory={inventory}
                              onEdit={onEdit}
                              onDelete={onDelete}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })
      )}
    </section>
  );
};
