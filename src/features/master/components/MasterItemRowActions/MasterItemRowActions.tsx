'use client';

import { useState } from 'react';

import styles from './MasterItemRowActions.module.scss';

import { MasterItem } from '@/shared/types';

type Props = {
  item: MasterItem;
  /** 編集ボタンを押したときに、対象の項目とともに呼ぶ */
  onEdit: (item: MasterItem) => void;
  /** 削除確認で「削除する」を押したときに、対象の項目とともに呼ぶ */
  onDelete: (item: MasterItem) => void;
};

/** マスタ一覧の1行分の「編集」「削除」操作。削除は誤操作防止のため行内で確認を挟む */
export const MasterItemRowActions = ({ item, onEdit, onDelete }: Props) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (isConfirmingDelete) {
    return (
      <div className={styles.confirm} role="status">
        <span className={styles.confirmMessage}>削除しますか？</span>
        <button
          type="button"
          className={styles.danger}
          onClick={() => {
            setIsConfirmingDelete(false);
            onDelete(item);
          }}
        >
          削除する
        </button>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => setIsConfirmingDelete(false)}
        >
          キャンセル
        </button>
      </div>
    );
  }

  return (
    <div className={styles.actions}>
      <button type="button" className={styles.secondary} onClick={() => onEdit(item)}>
        編集
      </button>
      <button type="button" className={styles.danger} onClick={() => setIsConfirmingDelete(true)}>
        削除
      </button>
    </div>
  );
};
