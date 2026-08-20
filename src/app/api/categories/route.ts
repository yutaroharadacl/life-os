import { proxyToBackend } from '@/shared/api/proxyToBackend';

/** カテゴリ追加。Go バックエンドへそのまま中継する */
export const POST = (request: Request) => proxyToBackend('/api/categories', request);
