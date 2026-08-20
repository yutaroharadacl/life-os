import { StorageLocation } from '../types';

import { backendFetch } from './backendFetch';

/**
 * 保管場所マスタを取得する。
 * サーバー側（Server Component・Route Handler）専用。Go バックエンド（GET /api/storages）へ直接 fetch する。
 */
export const getStorageLocations = (): Promise<StorageLocation[]> =>
  backendFetch<StorageLocation[]>('/api/storages');
