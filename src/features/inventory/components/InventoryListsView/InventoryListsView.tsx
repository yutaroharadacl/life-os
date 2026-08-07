'use client';

import { useState } from 'react';

import { createInventory } from '../../api/createInventory';
import { Category, Inventory, InventoryDraft, StorageLocation } from '../../types';
import { InventoryFormModal } from '../InventoryFormModal';
import { InventoryTable } from '../InventoryTable';

import styles from './InventoryListsView.module.scss';

type Props = {
  /** 初期表示する在庫（Server Component から受け取るモック） */
  initialInventories?: Inventory[];
  /** 選択肢に出すカテゴリマスタ */
  categories?: Category[];
  /** 選択肢に出す保管場所マスタ */
  storageLocations?: StorageLocation[];
  /**
   * 期限日数の基準日。省略時は当日。
   * このコンポーネントはクライアント境界にあり SSR とハイドレーションの2回描画されるため、
   * 基準日は必ず呼び出し元（Server Component）で1度だけ求めて渡すこと。
   * ここで既定値に頼るとサーバーとブラウザのタイムゾーン差で表示が食い違う。
   */
  today?: Date;
};

/**
 * 在庫一覧画面のクライアント側コンテナ。
 * 一覧と登録モーダルの共通の親として在庫リストを保持し、登録結果を即座に一覧へ反映する。
 * 永続化はしていないため、リロードすると登録内容は失われる（Go バックエンド未実装のため）。
 */
export const InventoryListsView = ({
  initialInventories = [],
  categories = [],
  storageLocations = [],
  today,
}: Props) => {
  const [inventories, setInventories] = useState(initialInventories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');

  const handleSubmit = (draft: InventoryDraft) => {
    const created = createInventory(draft);

    // 表示位置は InventoryTable のグループ化と並び替えが決めるため、末尾に足すだけでよい
    setInventories((previous) => [...previous, created]);
    setIsModalOpen(false);
    setFlashMessage(`${created.name}を登録しました`);
  };

  const handleOpen = () => {
    setFlashMessage('');
    setIsModalOpen(true);
  };

  return (
    <>
      {flashMessage && (
        <p className={styles.flash} role="status">
          {flashMessage}
        </p>
      )}

      <InventoryTable
        inventories={inventories}
        today={today}
        action={
          <button type="button" className={styles.register} onClick={handleOpen}>
            在庫を登録
          </button>
        }
      />

      <InventoryFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        storageLocations={storageLocations}
        onSubmit={handleSubmit}
      />
    </>
  );
};
