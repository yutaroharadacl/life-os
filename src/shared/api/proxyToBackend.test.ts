import { afterEach, describe, expect, it, vi } from 'vitest';

import { proxyToBackend } from './proxyToBackend';

/** Go バックエンドからの応答を模したレスポンスを作る */
const createBackendResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('proxyToBackend', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('正常系', () => {
    it('GET以外（POST）のリクエストのとき、リクエストボディを読み取りContent-Type: application/jsonを付けて中継する', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(createBackendResponse({ id: 'c1', name: '野菜' }, 201));
      vi.stubGlobal('fetch', fetchMock);
      const request = new Request('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: '野菜' }),
      });

      await proxyToBackend('/api/categories', request);

      expect(fetchMock).toHaveBeenCalledWith('http://localhost:8080/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '野菜' }),
      });
    });

    it('DELETEのとき、リクエストボディを読み取らずに中継する', async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
      vi.stubGlobal('fetch', fetchMock);
      const request = new Request('http://localhost:3000/api/categories/1', { method: 'DELETE' });

      await proxyToBackend('/api/categories/1', request);

      expect(fetchMock).toHaveBeenCalledWith('http://localhost:8080/api/categories/1', {
        method: 'DELETE',
        headers: undefined,
        body: undefined,
      });
    });

    it('Goバックエンドがstatus: 204を返したとき、ボディなしの204レスポンスを返す', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
      const request = new Request('http://localhost:3000/api/categories/1', { method: 'DELETE' });

      const response = await proxyToBackend('/api/categories/1', request);

      expect(response.status).toBe(204);
      expect(await response.text()).toBe('');
    });

    it('Goバックエンドがstatus: 200とJSONボディを返したとき、同じステータス・同じボディで返す', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(createBackendResponse({ id: 'c1', name: '野菜' }, 200)),
      );
      const request = new Request('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: '野菜' }),
      });

      const response = await proxyToBackend('/api/categories', request);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ id: 'c1', name: '野菜' });
    });
  });

  describe('異常系', () => {
    it('Goバックエンドがstatus: 400とエラーボディを返したとき、同じ400とそのボディをそのまま返す', async () => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            createBackendResponse({ error: '同じ名前のカテゴリが既に登録されています' }, 400),
          ),
      );
      const request = new Request('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: '野菜' }),
      });

      const response = await proxyToBackend('/api/categories', request);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: '同じ名前のカテゴリが既に登録されています' });
    });
  });
});
