import { Inventory } from '../types';

/** Date を ISO 形式（YYYY-MM-DD）の文字列にする。ローカルタイムの年月日を使う */
const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/** 当日から指定日数だけずらした日付を ISO 形式で返す（モックデータ用） */
const shiftDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return toIsoDate(date);
};

/**
 * 在庫一覧を取得する。
 * Go バックエンド（GET /api/inventories）が未実装のためモックデータを返す。
 * 期限切れ・期限間近・余裕あり・期限なしの各パターンを含む。
 * 日付は当日からの相対で生成しており、いつ動かしても同じ見え方になる。
 */
export const getInventories = (): Inventory[] => [
  {
    id: '1',
    name: '豚こま肉',
    category: '肉',
    storage: '冷蔵庫',
    quantity: 2,
    // 期限切れ
    expirationDate: shiftDays(-2),
    purchaseDate: shiftDays(-5),
  },
  {
    id: '2',
    name: '牛乳',
    category: '乳製品',
    storage: '冷蔵庫',
    quantity: 1,
    // 期限間近
    expirationDate: shiftDays(2),
    purchaseDate: shiftDays(-3),
  },
  {
    id: '3',
    name: '白菜',
    category: '野菜',
    storage: '冷蔵庫',
    quantity: 1,
    // 期限なし
    expirationDate: null,
    purchaseDate: shiftDays(-3),
  },
  {
    id: '4',
    name: '冷凍うどん',
    category: '冷凍食品',
    storage: '冷凍庫',
    quantity: 5,
    // 余裕あり
    expirationDate: shiftDays(116),
    purchaseDate: shiftDays(-17),
  },
  {
    id: '5',
    name: 'パスタ',
    category: '麺',
    storage: 'パントリー',
    quantity: 3,
    expirationDate: shiftDays(221),
    purchaseDate: shiftDays(-3),
  },
  {
    id: '6',
    name: '醤油',
    category: '調味料',
    storage: 'パントリー',
    quantity: 1,
    expirationDate: null,
    purchaseDate: shiftDays(-57),
  },
];
