import { RESOURCE_PATHS } from './resourcePath';

import { fetchJson } from '@/shared/api/fetchJson';
import { MasterItem, MasterItemDraft, MasterResource } from '@/shared/types';

/**
 * マスタ項目（カテゴリ・保管場所）を更新する。
 * ブラウザから BFF（PATCH /api/categories/{id} または /api/storages/{id}）を叩く。
 * @param resource - 更新対象の種別
 * @param id - 更新対象の項目ID
 * @param draft - 更新後の項目データ
 * @returns 更新後の項目
 */
export const updateMasterItem = (
  resource: MasterResource,
  id: string,
  draft: MasterItemDraft,
): Promise<MasterItem> =>
  fetchJson<MasterItem>(`${RESOURCE_PATHS[resource]}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  });
