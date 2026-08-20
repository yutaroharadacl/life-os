import { proxyToBackend } from '@/shared/api/proxyToBackend';

/** 保管場所追加。Go バックエンドへそのまま中継する */
export const POST = (request: Request) => proxyToBackend('/api/storages', request);
