import { MasterItemRowActions } from '../MasterItemRowActions';

import styles from './MasterItemList.module.scss';

import { MasterItem } from '@/shared/types';

type Props = {
  /** 表示する項目 */
  items?: MasterItem[];
  /** 項目種別のラベル（例: 'カテゴリ' / '保管場所'）。0件メッセージの組み立てに使う */
  itemLabel: string;
  /** 0件のときのメッセージ。省略時は `登録されている${itemLabel}はありません。` */
  emptyMessage?: string;
  onEdit: (item: MasterItem) => void;
  onDelete: (item: MasterItem) => void;
};

export const MasterItemList = ({
  items = [],
  itemLabel,
  emptyMessage,
  onEdit,
  onDelete,
}: Props) => {
  if (items.length === 0) {
    return (
      <p className={styles.empty}>{emptyMessage ?? `登録されている${itemLabel}はありません。`}</p>
    );
  }

  return (
    <div className={styles.scroller}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">名称</th>
            <th scope="col">操作</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <th scope="row" className={styles.name}>
                {item.name}
              </th>
              <td>
                <MasterItemRowActions item={item} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
