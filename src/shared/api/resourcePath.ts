import { MasterResource } from '@/shared/types';

/** マスタ項目の種別ごとの BFF パス */
export const RESOURCE_PATHS: Record<MasterResource, string> = {
  category: '/api/categories',
  storage: '/api/storages',
};
