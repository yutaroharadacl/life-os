import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MasterMenu } from './MasterMenu';

describe('MasterMenu', () => {
  describe('正常系', () => {
    it('見出しマスタ管理が表示される', () => {
      render(<MasterMenu />);

      expect(screen.getByRole('heading', { name: 'マスタ管理' })).toBeInTheDocument();
    });

    it('カテゴリ管理へのリンクが表示され/master/categoriesを指す', () => {
      render(<MasterMenu />);

      const link = screen.getByRole('link', { name: 'カテゴリ管理' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/master/categories');
    });

    it('保管場所管理へのリンクが表示され/master/storage-locationsを指す', () => {
      render(<MasterMenu />);

      const link = screen.getByRole('link', { name: '保管場所管理' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/master/storage-locations');
    });
  });
});
