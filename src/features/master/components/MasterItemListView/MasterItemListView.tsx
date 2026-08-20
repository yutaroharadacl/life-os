'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { createMasterItem } from '../../api/createMasterItem';
import { deleteMasterItem } from '../../api/deleteMasterItem';
import { updateMasterItem } from '../../api/updateMasterItem';
import { MasterItemFormModal } from '../MasterItemFormModal';
import { MasterItemList } from '../MasterItemList';

import styles from './MasterItemListView.module.scss';

import { MasterItem, MasterItemDraft, MasterResource } from '@/shared/types';

/** 通信失敗時に表示する既定のエラーメッセージ（Error でない例外が投げられた場合のフォールバック） */
const DEFAULT_ERROR_MESSAGE = '通信に失敗しました';

type Props = {
  /** 画面見出し（例: 'カテゴリ管理'） */
  title: string;
  /** 項目種別のラベル（例: 'カテゴリ' / '保管場所'）。ボタン文言・バリデーションメッセージに使う */
  itemLabel: string;
  /** カテゴリ・保管場所のどちらを扱う画面か。BFF のエンドポイント選択に使う */
  resource: MasterResource;
  /** 初期表示する項目（Server Component から受け取る） */
  initialItems?: MasterItem[];
};

/**
 * カテゴリ管理・保管場所管理画面の共通クライアント側コンテナ。
 * 一覧と追加・編集モーダルの共通の親として項目リストを保持し、操作結果を即座に一覧へ反映する。
 * 追加・更新・削除は BFF（Route Handler）経由で Go バックエンドに永続化される。
 */
export const MasterItemListView = ({ title, itemLabel, resource, initialItems = [] }: Props) => {
  const [items, setItems] = useState(initialItems);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // null は追加モード、値があれば編集モード（対象項目）を表す
  const [editingTarget, setEditingTarget] = useState<MasterItem | null>(null);
  const [flashMessage, setFlashMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const createMutation = useMutation({
    mutationFn: (draft: MasterItemDraft) => createMasterItem(resource, draft),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: MasterItemDraft }) =>
      updateMasterItem(resource, id, draft),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMasterItem(resource, id),
  });

  // 重複チェック対象。編集時は対象自身を除外し、変更せず送信してもエラーにならないようにする
  const existingNames = items
    .filter((item) => item.id !== editingTarget?.id)
    .map((item) => item.name);

  const handleSubmit = async (draft: MasterItemDraft) => {
    setErrorMessage('');

    try {
      if (editingTarget) {
        const updated = await updateMutation.mutateAsync({ id: editingTarget.id, draft });

        setItems((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
        setIsModalOpen(false);
        setEditingTarget(null);
        setFlashMessage(`${updated.name}を更新しました`);
        return;
      }

      const created = await createMutation.mutateAsync(draft);

      setItems((previous) => [...previous, created]);
      setIsModalOpen(false);
      setFlashMessage(`${created.name}を追加しました`);
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

  const handleOpenEdit = (item: MasterItem) => {
    setFlashMessage('');
    setErrorMessage('');
    setEditingTarget(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // モーダルが閉じている間は編集対象を残さない（次に開くのが常に正しいモードになるようにする）
    setEditingTarget(null);
  };

  const handleDelete = async (item: MasterItem) => {
    setErrorMessage('');

    try {
      await deleteMutation.mutateAsync(item.id);

      setItems((previous) => previous.filter((current) => current.id !== item.id));
      setFlashMessage(`${item.name}を削除しました`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE);
    }
  };

  return (
    <div className={styles.container}>
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

      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <button type="button" className={styles.add} onClick={handleOpenCreate}>
          {itemLabel}を追加
        </button>
      </div>

      <MasterItemList
        items={items}
        itemLabel={itemLabel}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
      />

      <MasterItemFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        itemLabel={itemLabel}
        mode={editingTarget ? 'edit' : 'create'}
        initialValue={editingTarget?.name}
        existingNames={existingNames}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
