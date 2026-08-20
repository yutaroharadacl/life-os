import { InventoryResponse } from '@/features/inventory/types';
import { toInventory } from '@/features/inventory/utils/toInventory';
import { BACKEND_API_URL } from '@/shared/api/backendApiUrl';
import { getCategories } from '@/shared/api/getCategories';
import { getStorageLocations } from '@/shared/api/getStorageLocations';

/** ブラウザから送られてくるボディ（InventoryDraft と同一形状） */
type InventoryRequestBody = {
  name: string;
  category: string;
  storage: string;
  quantity: number;
  expirationDate: string | null;
  purchaseDate: string;
  memo: string;
};

/**
 * 在庫の登録（POST）・更新（PATCH）に共通する処理。
 * カテゴリ名・保管場所名をIDに解決したうえで Go バックエンドへ中継し、
 * レスポンスを Inventory 形状に変換して返す。
 * @param request - ブラウザからのリクエスト（InventoryRequestBody を JSON ボディに持つ）
 * @param backendPath - 中継先の Go バックエンドのパス（例: `/api/inventories`、`/api/inventories/{id}`）
 */
export const forwardInventoryRequest = async (
  request: Request,
  backendPath: string,
): Promise<Response> => {
  let body: InventoryRequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'リクエストの形式が不正です' }, { status: 400 });
  }

  const [categories, storageLocations] = await Promise.all([
    getCategories(),
    getStorageLocations(),
  ]);

  const categoryId = categories.find((category) => category.name === body.category)?.id;
  if (!categoryId) {
    return Response.json({ error: '指定されたカテゴリが見つかりません' }, { status: 400 });
  }

  const storageId = storageLocations.find((storage) => storage.name === body.storage)?.id;
  if (!storageId) {
    return Response.json({ error: '指定された保管場所が見つかりません' }, { status: 400 });
  }

  const backendResponse = await fetch(`${BACKEND_API_URL}${backendPath}`, {
    method: request.method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: body.name,
      category_id: categoryId,
      storage_id: storageId,
      quantity: body.quantity,
      expiration_date: body.expirationDate,
      purchase_date: body.purchaseDate,
      memo: body.memo,
    }),
  });

  if (!backendResponse.ok) {
    const text = await backendResponse.text();
    return new Response(text, {
      status: backendResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result: InventoryResponse = await backendResponse.json();
  return Response.json(toInventory(result), { status: backendResponse.status });
};
