'use client';

import { useState } from 'react';

import { createMasterItem } from '../../api/createMasterItem';
import { deleteMasterItem } from '../../api/deleteMasterItem';
import { updateMasterItem } from '../../api/updateMasterItem';
import { MasterItemFormModal } from '../MasterItemFormModal';
import { MasterItemList } from '../MasterItemList';

import styles from './MasterItemListView.module.scss';

import { MasterItem, MasterItemDraft } from '@/shared/types';

type Props = {
  /** 画面見出し（例: 'カテゴリ管理'） */
  title: string;
  /** 項目種別のラベル（例: 'カテゴリ' / '保管場所'）。ボタン文言・バリデーションメッセージに使う */
  itemLabel: string;
  /** 初期表示する項目（Server Component から受け取るモック） */
  initialItems?: MasterItem[];
};

/**
 * カテゴリ管理・保管場所管理画面の共通クライアント側コンテナ。
 * 一覧と追加・編集モーダルの共通の親として項目リストを保持し、操作結果を即座に一覧へ反映する。
 * 永続化はしていないため、ページを離れると内容は失われる（Go バックエンド未実装のため）。
 */
export const MasterItemListView = ({ title, itemLabel, initialItems = [] }: Props) => {
  const [items, setItems] = useState(initialItems);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // null は追加モード、値があれば編集モード（対象項目）を表す
  const [editingTarget, setEditingTarget] = useState<MasterItem | null>(null);
  const [flashMessage, setFlashMessage] = useState('');

  // 重複チェック対象。編集時は対象自身を除外し、変更せず送信してもエラーにならないようにする
  const existingNames = items
    .filter((item) => item.id !== editingTarget?.id)
    .map((item) => item.name);

  const handleSubmit = (draft: MasterItemDraft) => {
    if (editingTarget) {
      const updated = updateMasterItem(editingTarget.id, draft);

      setItems((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
      setIsModalOpen(false);
      setEditingTarget(null);
      setFlashMessage(`${updated.name}を更新しました`);
      return;
    }

    const created = createMasterItem(draft);

    setItems((previous) => [...previous, created]);
    setIsModalOpen(false);
    setFlashMessage(`${created.name}を追加しました`);
  };

  const handleOpenCreate = () => {
    setFlashMessage('');
    setEditingTarget(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MasterItem) => {
    setFlashMessage('');
    setEditingTarget(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // モーダルが閉じている間は編集対象を残さない（次に開くのが常に正しいモードになるようにする）
    setEditingTarget(null);
  };

  const handleDelete = (item: MasterItem) => {
    deleteMasterItem(item.id);
    setItems((previous) => previous.filter((current) => current.id !== item.id));
    setFlashMessage(`${item.name}を削除しました`);
  };

  return (
    <div className={styles.container}>
      {flashMessage && (
        <p className={styles.flash} role="status">
          {flashMessage}
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
