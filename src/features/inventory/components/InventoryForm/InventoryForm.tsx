'use client';

import { useActionState, useId, useRef, useState } from 'react';

import {
  InventoryDraft,
  InventoryFormErrors,
  InventoryFormMode,
  InventoryFormValues,
} from '../../types';
import { formatIsoDate } from '../../utils/isoDate';
import { toInventoryDraft } from '../../utils/toInventoryDraft';
import { validateInventoryForm } from '../../utils/validateInventoryForm';

import styles from './InventoryForm.module.scss';

import { Category, StorageLocation } from '@/shared/types';

/** 未選択を表す `<select>` の値 */
const UNSELECTED = '';

/** 入力欄の識別子 */
type FieldName = keyof InventoryFormValues;

/**
 * 入力欄の並び順。送信時に最初のエラー欄へフォーカスを移すために使う
 * （画面外にあるエラーに気づけるようにするため）。
 */
const FIELD_ORDER = [
  'name',
  'category',
  'storage',
  'quantity',
  'expirationDate',
  'purchaseDate',
  'memo',
] as const satisfies readonly FieldName[];

/** 入力欄の初期値。購入日だけは基準日から組み立てる */
const createInitialValues = (today: Date): InventoryFormValues => ({
  name: '',
  category: UNSELECTED,
  storage: UNSELECTED,
  quantity: '1',
  expirationDate: '',
  purchaseDate: formatIsoDate(today),
  memo: '',
});

/** mode ごとの送信ボタンのラベル */
const SUBMIT_LABELS: Record<InventoryFormMode, { idle: string; pending: string }> = {
  create: { idle: '登録する', pending: '登録中…' },
  edit: { idle: '更新する', pending: '更新中…' },
};

type Props = {
  categories?: Category[];
  storageLocations?: StorageLocation[];
  /** フォームの動作モード。ラベルの出し分けに使う。省略時は 'create' */
  mode?: InventoryFormMode;
  /** 編集対象の初期値。省略時は登録用の初期値（today から組み立てる）を使う */
  initialValues?: InventoryFormValues;
  /**
   * 入力が妥当だったときに呼ぶ。
   * Promise を返すと、解決するまで「登録中…」を表示して二重送信を防ぐ
   * （実 API 接続時にそのまま通信の完了待ちに使える）。
   */
  onSubmit: (draft: InventoryDraft) => void | Promise<void>;
  /** キャンセルボタンを押したときに呼ぶ */
  onCancel: () => void;
  /** 購入日の既定値の基準日。省略時は当日 */
  today?: Date;
};

export const InventoryForm = ({
  categories = [],
  storageLocations = [],
  mode = 'create',
  initialValues,
  onSubmit,
  onCancel,
  today = new Date(),
}: Props) => {
  const formId = useId();
  // 初期化は最初のレンダーだけで済ませる（再レンダーのたびに new Date() を評価しない）
  const [values, setValues] = useState<InventoryFormValues>(
    () => initialValues ?? createInitialValues(today),
  );
  // 送信後に利用者が直した欄。エラーを引っ込める判断に使う
  const [editedFields, setEditedFields] = useState<
    Partial<Record<keyof InventoryFormValues, true>>
  >({});
  const formRef = useRef<HTMLFormElement>(null);

  // 検証は送信時にまとめて行う（入力途中に赤字が出るのを避ける）。
  // 入力欄は制御コンポーネントなので、値は FormData ではなく values から読む
  const [submitErrors, submitAction, isPending] = useActionState<InventoryFormErrors>(async () => {
    setEditedFields({});

    const nextErrors = validateInventoryForm(values);

    // 画面外のエラーに気づけるよう、最初のエラー欄へフォーカスを移す
    const firstErrorField = FIELD_ORDER.find((field) => nextErrors[field] !== undefined);
    if (firstErrorField) {
      const element = formRef.current?.elements.namedItem(firstErrorField);
      if (element instanceof HTMLElement) {
        element.focus();
      }

      return nextErrors;
    }

    await onSubmit(toInventoryDraft(values));

    return {};
  }, {});

  // 直したそばから他の欄のエラーが増えないよう、引っ込めるのは触った欄の分だけにする
  const errors: InventoryFormErrors = Object.fromEntries(
    Object.entries(submitErrors).filter(([field]) => !editedFields[field as FieldName]),
  );

  const handleChange = (field: keyof InventoryFormValues) => (value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setEditedFields((previous) => ({ ...previous, [field]: true }));
  };

  /** 入力欄に共通で渡す属性。エラー時は読み上げにメッセージを結び付ける */
  const fieldProps = (field: keyof InventoryFormValues) => {
    const message = errors[field];

    return {
      id: `${formId}-${field}`,
      // name はフォーム送信ではなく、エラー欄をフォーム要素から引くために使う
      name: field,
      'aria-invalid': message !== undefined,
      'aria-describedby': message === undefined ? undefined : `${formId}-${field}-error`,
    };
  };

  const renderError = (field: keyof InventoryFormValues) => {
    const message = errors[field];
    if (message === undefined) {
      return null;
    }

    return (
      <p id={`${formId}-${field}-error`} className={styles.error}>
        {message}
      </p>
    );
  };

  return (
    <form ref={formRef} className={styles.form} action={submitAction} noValidate>
      <div className={styles.field}>
        <label htmlFor={`${formId}-name`}>食品名</label>
        <input
          {...fieldProps('name')}
          type="text"
          value={values.name}
          onChange={(event) => handleChange('name')(event.target.value)}
        />
        {renderError('name')}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${formId}-category`}>カテゴリ</label>
        <select
          {...fieldProps('category')}
          value={values.category}
          onChange={(event) => handleChange('category')(event.target.value)}
        >
          <option value={UNSELECTED}>選択してください</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
        {renderError('category')}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${formId}-storage`}>保管場所</label>
        <select
          {...fieldProps('storage')}
          value={values.storage}
          onChange={(event) => handleChange('storage')(event.target.value)}
        >
          <option value={UNSELECTED}>選択してください</option>
          {storageLocations.map((storageLocation) => (
            <option key={storageLocation.id} value={storageLocation.name}>
              {storageLocation.name}
            </option>
          ))}
        </select>
        {renderError('storage')}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${formId}-quantity`}>数量</label>
        <input
          {...fieldProps('quantity')}
          type="number"
          inputMode="numeric"
          value={values.quantity}
          onChange={(event) => handleChange('quantity')(event.target.value)}
        />
        {renderError('quantity')}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${formId}-expirationDate`}>期限</label>
        <input
          {...fieldProps('expirationDate')}
          type="date"
          value={values.expirationDate}
          onChange={(event) => handleChange('expirationDate')(event.target.value)}
        />
        {renderError('expirationDate')}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${formId}-purchaseDate`}>購入日</label>
        <input
          {...fieldProps('purchaseDate')}
          type="date"
          value={values.purchaseDate}
          onChange={(event) => handleChange('purchaseDate')(event.target.value)}
        />
        {renderError('purchaseDate')}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${formId}-memo`}>メモ</label>
        <textarea
          {...fieldProps('memo')}
          rows={3}
          value={values.memo}
          onChange={(event) => handleChange('memo')(event.target.value)}
        />
        {renderError('memo')}
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
