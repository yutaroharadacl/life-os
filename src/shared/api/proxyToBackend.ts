import { BACKEND_API_URL } from './backendApiUrl';

/**
 * ブラウザからのリクエストをそのまま Go バックエンドへ中継する（純粋なプロキシ）。
 * リクエストボディ・レスポンスボディの形が Go とフロントエンドで一致しているエンドポイント
 * （カテゴリ・保管場所の追加／編集／削除）にのみ使う。ステータスコードはそのまま転送する。
 */
export const proxyToBackend = async (path: string, request: Request): Promise<Response> => {
  const hasBody = request.method !== 'GET' && request.method !== 'DELETE';
  const body = hasBody ? await request.text() : undefined;

  const backendResponse = await fetch(`${BACKEND_API_URL}${path}`, {
    method: request.method,
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
    body,
  });

  if (backendResponse.status === 204) {
    return new Response(null, { status: 204 });
  }

  const responseBody = await backendResponse.text();

  return new Response(responseBody, {
    status: backendResponse.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
