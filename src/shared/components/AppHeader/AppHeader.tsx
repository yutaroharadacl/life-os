'use client';

import Link from 'next/link';
import { MouseEvent, useEffect, useId, useRef, useState } from 'react';

import styles from './AppHeader.module.scss';

/** ハンバーガーメニューから遷移できる項目。将来増える場合はここに追記する */
const MENU_ITEMS = [
  { href: '/inventory/lists', label: '在庫一覧' },
  { href: '/master', label: 'マスタ管理' },
  { href: '/notifications', label: '通知設定' },
] as const;

/**
 * サイト共通ヘッダ。全画面のルートレイアウトから描画される。
 * アプリ名（在庫一覧への導線）とハンバーガーメニュー（在庫一覧・マスタ管理・通知設定への導線）を持つ。
 */
export const AppHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // 開閉はネイティブ API に任せる。showModal() でないとフォーカストラップと
  // 背景の不活性化が効かないため、open 属性の付け外しでは代用しない（InventoryFormModal と同じ方針）
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isMenuOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isMenuOpen && dialog.open) {
      dialog.close();
    }
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  // click は mousedown と mouseup の共通祖先に届くため、押した位置も見て
  // 背景（ダイアログの領域外）で押して離されたときだけ閉じる（InventoryFormModal と同じ方針）
  const pressedOnBackdrop = useRef(false);

  const handleMouseDown = (event: MouseEvent<HTMLDialogElement>) => {
    pressedOnBackdrop.current = event.target === dialogRef.current;
  };

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
      closeMenu();
    }
  };

  return (
    <header className={styles.header}>
      <Link href="/inventory/lists" className={styles.brand}>
        在庫管理
      </Link>

      <button
        type="button"
        className={styles.menuButton}
        aria-label="メニューを開く"
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((previous) => !previous)}
      >
        <span className={styles.bar} />
        <span className={styles.bar} />
        <span className={styles.bar} />
      </button>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          closeMenu();
        }}
        onMouseDown={handleMouseDown}
        onClick={handleBackdropClick}
      >
        {/* 閉じるたびにアンマウントされるので、開くたびに常に同じ内容から始まる */}
        {isMenuOpen && (
          <div className={styles.content}>
            <h2 id={titleId} className={styles.title}>
              メニュー
            </h2>

            <nav>
              <ul className={styles.list}>
                {MENU_ITEMS.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={styles.link} onClick={closeMenu}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </dialog>
    </header>
  );
};
