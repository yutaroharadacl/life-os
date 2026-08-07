'use client';

import { useState } from 'react';

import { Inventory } from '../../types';

import styles from './InventoryRowActions.module.scss';

type Props = {
  inventory: Inventory;
  /** 編集ボタンを押したときに、対象の在庫とともに呼ぶ */
  onEdit: (inventory: Inventory) => void;
  /** 削除確認で「削除する」を押したときに、対象の在庫とともに呼ぶ */
  onDelete: (inventory: Inventory) => void;
};

/** 在庫一覧の1行分の「編集」「削除」操作。削除は誤操作防止のため行内で確認を挟む */
export const InventoryRowActions = ({ inventory, onEdit, onDelete }: Props) => {
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
            onDelete(inventory);
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
      <button type="button" className={styles.secondary} onClick={() => onEdit(inventory)}>
        編集
      </button>
      <button type="button" className={styles.danger} onClick={() => setIsConfirmingDelete(true)}>
        削除
      </button>
    </div>
  );
};
