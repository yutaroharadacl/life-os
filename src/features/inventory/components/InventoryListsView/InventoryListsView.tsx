'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { createInventory } from '../../api/createInventory';
import { deleteInventory } from '../../api/deleteInventory';
import { updateInventory } from '../../api/updateInventory';
import { useInventoryFilterStore } from '../../stores/useInventoryFilterStore';
import { Inventory, InventoryDraft } from '../../types';
import { filterInventories } from '../../utils/filterInventories';
import { toInventoryFormValues } from '../../utils/toInventoryFormValues';
import { InventoryFilterBar } from '../InventoryFilterBar';
import { InventoryFormModal } from '../InventoryFormModal';
import { InventoryStorageTabs } from '../InventoryStorageTabs';
import { InventoryTable } from '../InventoryTable';

import styles from './InventoryListsView.module.scss';

import { Category, StorageLocation } from '@/shared/types';

/** 絞り込み条件に一致する在庫が1件もないときのメッセージ（未登録の0件とは区別する） */
const NO_MATCH_MESSAGE = '該当する在庫が見つかりません。';

/** 通信失敗時に表示する既定のエラーメッセージ（Error でない例外が投げられた場合のフォールバック） */
const DEFAULT_ERROR_MESSAGE = '通信に失敗しました';

type Props = {
  /** 初期表示する在庫（Server Component から受け取る） */
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
  /** 「期限間近」警告のしきい値（日）。通知設定の値。省略時はInventoryTableの既定値（3）に従う */
  warningThresholdDays?: number;
};

/**
 * 在庫一覧画面のクライアント側コンテナ。
 * 一覧と登録モーダルの共通の親として在庫リストを保持し、登録結果を即座に一覧へ反映する。
 * 登録・更新・削除は BFF（Route Handler）経由で Go バックエンドに永続化される。
 */
export const InventoryListsView = ({
  initialInventories = [],
  categories = [],
  storageLocations = [],
  today,
  warningThresholdDays,
}: Props) => {
  const [inventories, setInventories] = useState(initialInventories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // null は登録モード、値があれば編集モード（対象在庫）を表す
  const [editingTarget, setEditingTarget] = useState<Inventory | null>(null);
  const [flashMessage, setFlashMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const createMutation = useMutation({ mutationFn: createInventory });
  const updateMutation = useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: InventoryDraft }) =>
      updateInventory(id, draft),
  });
  const deleteMutation = useMutation({ mutationFn: deleteInventory });

  const keyword = useInventoryFilterStore((state) => state.keyword);
  const category = useInventoryFilterStore((state) => state.category);
  const storage = useInventoryFilterStore((state) => state.storage);
  const sortOrder = useInventoryFilterStore((state) => state.sortOrder);
  const resetFilters = useInventoryFilterStore((state) => state.resetFilters);

  const visibleInventories = filterInventories(inventories, { keyword, category, storage });
  // 未登録の0件（inventories が空）と、絞り込み結果の0件は表示を分ける
  const emptyMessage = inventories.length > 0 ? NO_MATCH_MESSAGE : undefined;

  const handleSubmit = async (draft: InventoryDraft) => {
    setErrorMessage('');

    try {
      if (editingTarget) {
        const updated = await updateMutation.mutateAsync({ id: editingTarget.id, draft });

        setInventories((previous) =>
          previous.map((inventory) => (inventory.id === updated.id ? updated : inventory)),
        );
        // 絞り込み条件が残っていると、編集後の内容が条件から外れて一覧から消えることがあるため、登録時と同様にクリアする
        resetFilters();
        setIsModalOpen(false);
        setEditingTarget(null);
        setFlashMessage(`${updated.name}を更新しました`);
        return;
      }

      const created = await createMutation.mutateAsync(draft);

      // 表示位置は InventoryTable のグループ化と並び替えが決めるため、末尾に足すだけでよい
      setInventories((previous) => [...previous, created]);
      // 絞り込み条件が残っていると登録した在庫が一覧に映らないことがあるため、登録時にクリアする
      resetFilters();
      setIsModalOpen(false);
      setFlashMessage(`${created.name}を登録しました`);
    } catch (error) {
      // 通信失敗時はモーダルを開いたままにし、利用者が入力し直して再送信できるようにする
      setErrorMessage(error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE);
    }
  };

  const handleOpenCreate = () => {
    setFlashMessage('');
    setErrorMessage('');
    setEditingTarget(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inventory: Inventory) => {
    setFlashMessage('');
    setErrorMessage('');
    setEditingTarget(inventory);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // モーダルが閉じている間は編集対象を残さない（次に開くのが常に正しいモードになるようにする）
    setEditingTarget(null);
  };

  const handleDelete = async (inventory: Inventory) => {
    setErrorMessage('');

    try {
      await deleteMutation.mutateAsync(inventory.id);

      setInventories((previous) => previous.filter((item) => item.id !== inventory.id));
      setFlashMessage(`${inventory.name}を削除しました`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE);
    }
  };

  return (
    <>
      {flashMessage && (
        <p className={styles.flash} role="status">
          {flashMessage}
        </p>
      )}

      {errorMessage && (
        <p className={styles.errorFlash} role="alert">
          {errorMessage}
        </p>
      )}

      <InventoryStorageTabs storageLocations={storageLocations} />

      <InventoryFilterBar categories={categories} />

      <InventoryTable
        inventories={visibleInventories}
        today={today}
        sortOrder={sortOrder}
        emptyMessage={emptyMessage}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        warningThresholdDays={warningThresholdDays}
        action={
          <button type="button" className={styles.register} onClick={handleOpenCreate}>
            在庫を登録
          </button>
        }
      />

      <InventoryFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        categories={categories}
        storageLocations={storageLocations}
        mode={editingTarget ? 'edit' : 'create'}
        initialValues={editingTarget ? toInventoryFormValues(editingTarget) : undefined}
        onSubmit={handleSubmit}
      />
    </>
  );
};
