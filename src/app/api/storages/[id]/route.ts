import { proxyToBackend } from '@/shared/api/proxyToBackend';

type Context = { params: Promise<{ id: string }> };

/** 保管場所編集。Go バックエンドへそのまま中継する */
export const PATCH = async (request: Request, { params }: Context) => {
  const { id } = await params;
  return proxyToBackend(`/api/storages/${id}`, request);
};

/** 保管場所削除。Go バックエンドへそのまま中継する */
export const DELETE = async (request: Request, { params }: Context) => {
  const { id } = await params;
  return proxyToBackend(`/api/storages/${id}`, request);
};
