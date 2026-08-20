import { RESOURCE_PATHS } from './resourcePath';

import { fetchJson } from '@/shared/api/fetchJson';
import { MasterItem, MasterItemDraft, MasterResource } from '@/shared/types';

/**
 * マスタ項目（カテゴリ・保管場所）を追加する。
 * ブラウザから BFF（POST /api/categories または /api/storages）を叩く。
 * @param resource - 追加対象の種別
 * @param draft - 追加する項目データ
 * @returns 追加された項目（IDが採番された状態）
 */
export const createMasterItem = (
  resource: MasterResource,
  draft: MasterItemDraft,
): Promise<MasterItem> =>
  fetchJson<MasterItem>(RESOURCE_PATHS[resource], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  });
