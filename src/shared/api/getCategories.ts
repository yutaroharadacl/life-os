import { Category } from '../types';

import { backendFetch } from './backendFetch';

/**
 * カテゴリマスタを取得する。
 * サーバー側（Server Component・Route Handler）専用。Go バックエンド（GET /api/categories）へ直接 fetch する。
 */
export const getCategories = (): Promise<Category[]> => backendFetch<Category[]>('/api/categories');
