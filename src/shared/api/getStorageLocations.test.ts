import { afterEach, describe, expect, it, vi } from 'vitest';

import { StorageLocation } from '../types';

import { getStorageLocations } from './getStorageLocations';

describe('getStorageLocations', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('正常系', () => {
    it('backendFetchが返した保管場所一覧をそのまま返す', async () => {
      const storageLocations: StorageLocation[] = [
        { id: 's1', name: '冷蔵庫' },
        { id: 's2', name: '冷凍庫' },
      ];
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(JSON.stringify(storageLocations), { status: 200 })),
      );

      const result = await getStorageLocations();

      expect(result).toEqual(storageLocations);
    });
  });

  describe('境界値', () => {
    it('backendFetchが空配列を返すとき、空配列を返す', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 })),
      );

      const result = await getStorageLocations();

      expect(result).toEqual([]);
    });
  });
});
