import { BACKEND_API_URL } from './backendApiUrl';
import { fetchJson } from './fetchJson';

/**
 * サーバー側（Server Component・Route Handler）専用。
 * Go バックエンドへ直接 fetch する。ブラウザからは呼ばない。
 * 常に最新のデータを取るため cache: 'no-store' を付ける。
 */
export const backendFetch = <T>(path: string, init?: RequestInit): Promise<T> =>
  fetchJson<T>(`${BACKEND_API_URL}${path}`, { ...init, cache: 'no-store' });
