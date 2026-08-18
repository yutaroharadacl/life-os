'use client';

import { useActionState, useId, useState } from 'react';

import { MasterItemFormMode } from '../../types';
import { validateMasterItemForm } from '../../utils/validateMasterItemForm';

import styles from './MasterItemForm.module.scss';

import { MasterItemDraft } from '@/shared/types';

/** mode ごとの送信ボタンのラベル */
const SUBMIT_LABELS: Record<MasterItemFormMode, { idle: string; pending: string }> = {
  create: { idle: '追加する', pending: '追加中…' },
  edit: { idle: '更新する', pending: '更新中…' },
};

type Props = {
  /** 項目種別のラベル（例: 'カテゴリ' / '保管場所'）。入力欄ラベル・ボタン文言・バリデーションメッセージに使う */
  itemLabel: string;
  /** フォームの動作モード。ラベルの出し分けに使う。省略時は 'create' */
  mode?: MasterItemFormMode;
  /** 編集対象の現在の名称。省略時は空欄から始まる */
  initialValue?: string;
  /** 重複チェック対象の既存名称。編集時は呼び出し元が対象自身の名称を除いて渡す */
  existingNames: string[];
  /**
   * 入力が妥当だったときに呼ぶ。
   * Promise を返すと、解決するまで送信中表示にして二重送信を防ぐ。
   */
  onSubmit: (draft: MasterItemDraft) => void | Promise<void>;
  /** キャンセルボタンを押したときに呼ぶ */
  onCancel: () => void;
};

export const MasterItemForm = ({
  itemLabel,
  mode = 'create',
  initialValue = '',
  existingNames,
  onSubmit,
  onCancel,
}: Props) => {
  const inputId = useId();
  const [name, setName] = useState(initialValue);
  const [error, setError] = useState<string | undefined>(undefined);

  // 検証は送信時に行う（入力途中に赤字が出るのを避ける）
  const [, submitAction, isPending] = useActionState<null>(async () => {
    const message = validateMasterItemForm(name, itemLabel, existingNames);
    setError(message);

    if (message !== undefined) {
      return null;
    }

    await onSubmit({ name: name.trim() });

    return null;
  }, null);

  const handleChange = (value: string) => {
    setName(value);
    // 直したそばからエラーを引っ込める（単一項目のため送信を待たず即時に消してよい）
    setError(undefined);
  };

  const errorId = `${inputId}-error`;

  return (
    <form className={styles.form} action={submitAction} noValidate>
      <div className={styles.field}>
        <label htmlFor={inputId}>{itemLabel}名</label>
        <input
          id={inputId}
          type="text"
          value={name}
          aria-invalid={error !== undefined}
          aria-describedby={error === undefined ? undefined : errorId}
          onChange={(event) => handleChange(event.target.value)}
        />
        {error !== undefined && (
          <p id={errorId} className={styles.error}>
            {error}
          </p>
        )}
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={onCancel} disabled={isPending}>
          キャンセル
        </button>
        <button type="submit" className={styles.primary} disabled={isPending}>
          {isPending ? SUBMIT_LABELS[mode].pending : SUBMIT_LABELS[mode].idle}
        </button>
      </div>
    </form>
  );
};
