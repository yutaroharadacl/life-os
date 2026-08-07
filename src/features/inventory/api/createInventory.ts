import { Inventory, InventoryDraft } from '../types';

/** 採番の連番。同じミリ秒に複数回呼ばれても衝突しないようにする */
let sequence = 0;

/**
 * 在庫の ID を採番する。
 * `crypto.randomUUID` は secure context（https / localhost）でしか公開されないため、
 * スマホから `http://<LAN-IP>:3000` で開いた場合などに備えて代替経路を用意する。
 */
const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  sequence += 1;

  return `inventory-${Date.now()}-${sequence}`;
};

/**
 * 在庫を登録する。
 * Go バックエンド（POST /api/inventories）が未実装のためモック。
 * 採番して返すだけで永続化はしないため、リロードすると登録内容は失われる。
 * @param draft - 登録する在庫データ
 * @returns ID を採番した在庫
 */
export const createInventory = (draft: InventoryDraft): Inventory => ({
  ...draft,
  id: createId(),
});
