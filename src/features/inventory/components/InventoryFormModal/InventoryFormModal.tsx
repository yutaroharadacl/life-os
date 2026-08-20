'use client';

import { MouseEvent, useEffect, useId, useRef } from 'react';

import { InventoryDraft, InventoryFormMode, InventoryFormValues } from '../../types';
import { InventoryForm } from '../InventoryForm';

import styles from './InventoryFormModal.module.scss';

import { Category, StorageLocation } from '@/shared/types';

/** mode ごとのモーダルタイトル */
const TITLES: Record<InventoryFormMode, string> = {
  create: '在庫を登録',
  edit: '在庫を編集',
};

type Props = {
  /** モーダルを開くかどうか */
  open: boolean;
  /** 閉じる操作（キャンセル・ESC・背景クリック）が起きたときに呼ぶ */
  onClose: () => void;
  categories?: Category[];
  storageLocations?: StorageLocation[];
  /** フォームの動作モード。タイトル・送信ラベルの出し分けに使う。省略時は 'create' */
  mode?: InventoryFormMode;
  /** 編集対象の初期値。mode='edit' のときに渡す */
  initialValues?: InventoryFormValues;
  /** 登録・更新が成立したときに呼ぶ。Promise を返すと解決するまで送信中の表示が続く */
  onSubmit: (draft: InventoryDraft) => void | Promise<void>;
  /** InventoryForm へそのまま転送する（「＋ 新規登録」の選択肢の表示可否は InventoryForm 側が判断する） */
  onCreateCategory?: (name: string) => Promise<Category>;
  /** InventoryForm へそのまま転送する */
  onCreateStorageLocation?: (name: string) => Promise<StorageLocation>;
};

export const InventoryFormModal = ({
  open,
  onClose,
  categories = [],
  storageLocations = [],
  mode = 'create',
  initialValues,
  onSubmit,
  onCreateCategory,
  onCreateStorageLocation,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // 開閉はネイティブ API に任せる。showModal() でないとフォーカストラップと
  // 背景の不活性化が効かないため、open 属性の付け外しでは代用しない
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // click は mousedown と mouseup の共通祖先に届くため、フォーム内で押して背景で離す
  // （文字列選択のドラッグ）でも <dialog> が target になる。押した位置も見ないと
  // 入力途中のフォームごと閉じてしまうので、押下時点の対象を覚えておく
  const pressedOnBackdrop = useRef(false);

  const handleMouseDown = (event: MouseEvent<HTMLDialogElement>) => {
    pressedOnBackdrop.current = event.target === dialogRef.current;
  };

  // ダイアログ自身の領域外（＝背景）で押して離されたら閉じる。
  // ::backdrop はイベント上ダイアログ本体として届くため、座標で判定する
  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    const pressedOutside = pressedOnBackdrop.current;
    pressedOnBackdrop.current = false;

    if (!pressedOutside || event.target !== dialogRef.current) {
      return;
    }

    const { top, bottom, left, right } = event.currentTarget.getBoundingClientRect();
    const isOutside =
      event.clientY < top ||
      event.clientY > bottom ||
      event.clientX < left ||
      event.clientX > right;

    if (isOutside) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      // ESC は cancel イベントとして届く。既定の閉じる動作は親の open に一本化する
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onMouseDown={handleMouseDown}
      onClick={handleBackdropClick}
    >
      {/* 閉じるたびにアンマウントされるので、入力内容のリセット処理は要らない */}
      {open && (
        <div className={styles.content}>
          <div className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {TITLES[mode]}
            </h2>
            <button type="button" className={styles.close} onClick={onClose}>
              閉じる
            </button>
          </div>

          <InventoryForm
            categories={categories}
            storageLocations={storageLocations}
            mode={mode}
            initialValues={initialValues}
            onSubmit={onSubmit}
            onCancel={onClose}
            onCreateCategory={onCreateCategory}
            onCreateStorageLocation={onCreateStorageLocation}
          />
        </div>
      )}
    </dialog>
  );
};
