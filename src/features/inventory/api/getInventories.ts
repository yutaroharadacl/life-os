import { Inventory } from '../types';
import { formatIsoDate } from '../utils/isoDate';

/** 当日から指定日数だけずらした日付を ISO 形式で返す（モックデータ用） */
const shiftDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return formatIsoDate(date);
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
    memo: '火曜までに使い切る',
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
    memo: '',
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
    memo: '半分使用済み',
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
    memo: '',
  },
  {
    id: '5',
    name: 'パスタ',
    category: '麺',
    storage: 'パントリー',
    quantity: 3,
    expirationDate: shiftDays(221),
    purchaseDate: shiftDays(-3),
    memo: '',
  },
  {
    id: '6',
    name: '醤油',
    category: '調味料',
    storage: 'パントリー',
    quantity: 1,
    expirationDate: null,
    purchaseDate: shiftDays(-57),
    memo: '開封済み',
  },
];
