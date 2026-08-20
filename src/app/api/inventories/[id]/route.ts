import { forwardInventoryRequest } from '../forwardInventoryRequest';

import { proxyToBackend } from '@/shared/api/proxyToBackend';

type Context = { params: Promise<{ id: string }> };

/** 在庫更新。カテゴリ名・保管場所名をIDに解決したうえで Go バックエンドへ中継する */
export const PATCH = async (request: Request, { params }: Context) => {
  const { id } = await params;
  return forwardInventoryRequest(request, `/api/inventories/${id}`);
};

/** 在庫削除。リクエスト・レスポンスの形が Go とフロントエンドで一致しているため純粋に中継する */
export const DELETE = async (request: Request, { params }: Context) => {
  const { id } = await params;
  return proxyToBackend(`/api/inventories/${id}`, request);
};
