import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// 各テスト後に DOM を破棄し、テスト間の状態汚染を防ぐ
afterEach(() => {
  cleanup();
});
