import { afterEach, describe, expect, it, vi } from 'vitest';

import { backendFetch } from './backendFetch';

describe('backendFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('正常系', () => {
    it('BACKEND_API_URL未設定時はhttp://localhost:8080を前置したURLでfetchが呼ばれる', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
      vi.stubGlobal('fetch', fetchMock);

      await backendFetch('/api/categories');

      expect(fetchMock).toHaveBeenCalledWith('http://localhost:8080/api/categories', {
        cache: 'no-store',
      });
    });

    it('initに渡したオプション（methodなど）がそのままfetchに渡り、加えてcache: "no-store"が付与される', async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
      vi.stubGlobal('fetch', fetchMock);

      await backendFetch('/api/inventories/1', { method: 'DELETE' });

      expect(fetchMock).toHaveBeenCalledWith('http://localhost:8080/api/inventories/1', {
        method: 'DELETE',
        cache: 'no-store',
      });
    });
  });
});
