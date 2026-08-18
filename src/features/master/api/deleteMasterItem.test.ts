import { describe, expect, it } from 'vitest';

import { deleteMasterItem } from './deleteMasterItem';

describe('deleteMasterItem', () => {
  describe('正常系', () => {
    it('idを渡して呼び出しても例外を投げない', () => {
      expect(() => deleteMasterItem('1')).not.toThrow();
    });
  });

  describe('境界値', () => {
    it('空文字のidを渡しても例外を投げない', () => {
      expect(() => deleteMasterItem('')).not.toThrow();
    });
  });
});
