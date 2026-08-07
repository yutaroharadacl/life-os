import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// 各テスト後に DOM を破棄し、テスト間の状態汚染を防ぐ
afterEach(() => {
  cleanup();
});

// jsdom 30 の HTMLDialogElement は open プロパティしか実装しておらず、
// showModal() / close() を呼ぶと TypeError になる。テスト環境側で最小限を補う。
// フォーカストラップ・背景の不活性化・ESC はブラウザ固有の挙動のため再現しない
// （テスト対象にもしない）。実装側にテスト専用の分岐は入れないための措置。
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}
