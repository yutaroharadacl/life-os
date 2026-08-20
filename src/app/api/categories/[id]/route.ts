import { proxyToBackend } from '@/shared/api/proxyToBackend';

type Context = { params: Promise<{ id: string }> };

/** カテゴリ編集。Go バックエンドへそのまま中継する */
export const PATCH = async (request: Request, { params }: Context) => {
  const { id } = await params;
  return proxyToBackend(`/api/categories/${id}`, request);
};

/** カテゴリ削除。Go バックエンドへそのまま中継する */
export const DELETE = async (request: Request, { params }: Context) => {
  const { id } = await params;
  return proxyToBackend(`/api/categories/${id}`, request);
};
