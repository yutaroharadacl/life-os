import { StorageLocation } from '../types';

/**
 * 保管場所マスタを取得する。
 * Go バックエンド（GET /api/storages）とマスタ管理画面（要件 5-3）が未実装のためモック。
 * 要件定義書「5-3. 保管場所マスター管理機能」の初期値をそのまま返す。
 */
export const getStorageLocations = (): StorageLocation[] => [
  { id: 's1', name: '冷蔵庫' },
  { id: 's2', name: '冷凍庫' },
  { id: 's3', name: 'パントリー' },
  { id: 's4', name: '常温棚' },
];
