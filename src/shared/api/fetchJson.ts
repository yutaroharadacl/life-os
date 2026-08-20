/** レスポンスの { error } を読み取れないときに使う既定のエラーメッセージ */
const DEFAULT_ERROR_MESSAGE = '通信に失敗しました';

/**
 * fetch を実行し、成功時はレスポンスボディを JSON パースして返す。
 * status: 204（No Content）のときは undefined を返す。
 * 失敗時（res.ok が false）は、ボディの { error: string } を読み取り Error として投げる。
 * 読み取れない場合は既定のメッセージにする。
 */
export const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, init);

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    const message =
      typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
        ? body.error
        : DEFAULT_ERROR_MESSAGE;

    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new Error(DEFAULT_ERROR_MESSAGE);
  }
};
