import { fetchJson } from '@/shared/api/fetchJson';
import { RESOURCE_PATHS } from '@/shared/api/resourcePath';
import { MasterResource } from '@/shared/types';

/**
 * マスタ項目（カテゴリ・保管場所）を削除する。
 * ブラウザから BFF（DELETE /api/categories/{id} または /api/storages/{id}）を叩く。
 * @param resource - 削除対象の種別
 * @param id - 削除対象の項目ID
 */
export const deleteMasterItem = (resource: MasterResource, id: string): Promise<void> =>
  fetchJson<void>(`${RESOURCE_PATHS[resource]}/${id}`, { method: 'DELETE' });
