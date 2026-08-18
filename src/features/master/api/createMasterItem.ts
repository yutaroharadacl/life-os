import { MasterItem, MasterItemDraft } from '@/shared/types';

/** 採番の連番。同じミリ秒に複数回呼ばれても衝突しないようにする */
let sequence = 0;

/**
 * マスタ項目の ID を採番する。
 * `crypto.randomUUID` は secure context（https / localhost）でしか公開されないため、
 * スマホから `http://<LAN-IP>:3000` で開いた場合などに備えて代替経路を用意する。
 */
const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  sequence += 1;

  return `master-item-${Date.now()}-${sequence}`;
};

/**
 * マスタ項目（カテゴリ・保管場所）を追加する。
 * Go バックエンド（POST /api/categories, /api/storages）が未実装のためモック。
 * 採番して返すだけで永続化はしないため、ページを離れると内容は失われる。
 * @param draft - 追加する項目データ
 * @returns ID を採番した項目
 */
export const createMasterItem = (draft: MasterItemDraft): MasterItem => ({
  ...draft,
  id: createId(),
});
