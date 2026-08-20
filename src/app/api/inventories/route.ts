import { forwardInventoryRequest } from './forwardInventoryRequest';

/** 在庫登録。カテゴリ名・保管場所名をIDに解決したうえで Go バックエンドへ中継する */
export const POST = (request: Request) => forwardInventoryRequest(request, '/api/inventories');
