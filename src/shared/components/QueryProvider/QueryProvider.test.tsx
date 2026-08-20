import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { QueryProvider } from './QueryProvider';

describe('QueryProvider', () => {
  describe('正常系', () => {
    it('childrenをそのままレンダリングする', () => {
      render(
        <QueryProvider>
          <p>子要素</p>
        </QueryProvider>,
      );

      expect(screen.getByText('子要素')).toBeInTheDocument();
    });
  });
});
