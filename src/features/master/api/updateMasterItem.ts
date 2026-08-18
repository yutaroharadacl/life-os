import { MasterItem, MasterItemDraft } from '@/shared/types';

/**
 * マスタ項目（カテゴリ・保管場所）を更新する。
 * Go バックエンド（PATCH /api/categories/:id, /api/storages/:id）が未実装のためモック。
 * 更新後の内容を組み立てて返すだけで永続化はしない。
 * @param id - 更新対象の項目ID
 * @param draft - 更新後の項目データ
 * @returns 更新後の項目
 */
export const updateMasterItem = (id: string, draft: MasterItemDraft): MasterItem => ({
  ...draft,
  id,
});
