import { Category } from '../types';

/**
 * カテゴリマスタを取得する。
 * Go バックエンド（GET /api/categories）とマスタ管理画面（要件 5-2）が未実装のためモック。
 * 要件定義書「5-2. カテゴリマスター管理機能」の初期値をそのまま返す。
 */
export const getCategories = (): Category[] => [
  { id: 'c1', name: '野菜' },
  { id: 'c2', name: '肉' },
  { id: 'c3', name: '魚' },
  { id: 'c4', name: '乳製品' },
  { id: 'c5', name: '調味料' },
  { id: 'c6', name: '冷凍食品' },
  { id: 'c7', name: '麺' },
  { id: 'c8', name: 'その他' },
];
