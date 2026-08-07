import { describe, expect, it } from 'vitest';

import { deleteInventory } from './deleteInventory';

describe('deleteInventory', () => {
  describe('正常系', () => {
    it('idを渡して呼び出しても例外を投げない', () => {
      expect(() => deleteInventory('1')).not.toThrow();
    });
  });

  describe('境界値', () => {
    it('空文字のidを渡しても例外を投げない', () => {
      expect(() => deleteInventory('')).not.toThrow();
    });
  });
});
