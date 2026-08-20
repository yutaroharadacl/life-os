import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchJson } from './fetchJson';

describe('fetchJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('正常系', () => {
    it('okがtrueのとき、レスポンスボディをJSONパースした値を返す', async () => {
      const body = { id: '1', name: '白菜' };
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 })),
      );

      const result = await fetchJson('/api/inventories/1');

      expect(result).toEqual(body);
    });

    it('status:204のとき、undefinedを返す', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

      const result = await fetchJson('/api/inventories/1', { method: 'DELETE' });

      expect(result).toBeUndefined();
    });
  });

  describe('異常系', () => {
    it('okがfalseかつボディが{ error: "メッセージ" }のとき、そのメッセージを持つErrorを投げる', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ error: '指定されたカテゴリが見つかりません' }), {
            status: 400,
          }),
        ),
      );

      await expect(fetchJson('/api/inventories')).rejects.toThrow(
        '指定されたカテゴリが見つかりません',
      );
    });

    it('okがfalseかつボディがJSONとして解析できないとき、既定のメッセージ（通信に失敗しました）を持つErrorを投げる', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json', { status: 500 })));

      await expect(fetchJson('/api/inventories')).rejects.toThrow('通信に失敗しました');
    });

    it('okがfalseかつボディがerrorフィールドを持たないとき、既定のメッセージ（通信に失敗しました）を持つErrorを投げる', async () => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            new Response(JSON.stringify({ message: '予期しないエラー' }), { status: 500 }),
          ),
      );

      await expect(fetchJson('/api/inventories')).rejects.toThrow('通信に失敗しました');
    });

    it('okがtrueだがボディがJSONとして解析できないとき、既定のメッセージ（通信に失敗しました）を持つErrorを投げる', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json', { status: 200 })));

      await expect(fetchJson('/api/inventories')).rejects.toThrow('通信に失敗しました');
    });
  });
});
