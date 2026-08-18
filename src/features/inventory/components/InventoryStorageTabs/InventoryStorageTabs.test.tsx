import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useInventoryFilterStore } from '../../stores/useInventoryFilterStore';
import { InventoryFilterState } from '../../types';

import { InventoryStorageTabs } from './InventoryStorageTabs';

import { StorageLocation } from '@/shared/types';

const storageLocations: StorageLocation[] = [
  { id: 's1', name: '冷蔵庫' },
  { id: 's2', name: '冷凍庫' },
];

/** ストアの初期状態。テストごとにこの状態へリセットする */
const initialFilterState: InventoryFilterState = {
  category: '',
  keyword: '',
  sortOrder: 'expirationAsc',
  storage: '',
};

beforeEach(() => {
  useInventoryFilterStore.setState(initialFilterState);
});

describe('InventoryStorageTabs', () => {
  describe('正常系', () => {
    it('すべてタブが先頭に表示される', () => {
      render(<InventoryStorageTabs storageLocations={storageLocations} />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAccessibleName('すべて');
    });

    it('storageLocationsの各名称がタブとして表示される', () => {
      render(<InventoryStorageTabs storageLocations={storageLocations} />);

      expect(screen.getByRole('tab', { name: '冷蔵庫' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: '冷凍庫' })).toBeInTheDocument();
    });

    it('初期状態ではすべてタブが選択状態になっている', () => {
      render(<InventoryStorageTabs storageLocations={storageLocations} />);

      expect(screen.getByRole('tab', { name: 'すべて' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: '冷蔵庫' })).toHaveAttribute('aria-selected', 'false');
    });

    it('保管場所タブを選ぶとuseInventoryFilterStoreのstorageがその保管場所名に更新される', async () => {
      const user = userEvent.setup();
      render(<InventoryStorageTabs storageLocations={storageLocations} />);

      await user.click(screen.getByRole('tab', { name: '冷蔵庫' }));

      expect(useInventoryFilterStore.getState().storage).toBe('冷蔵庫');
      expect(screen.getByRole('tab', { name: '冷蔵庫' })).toHaveAttribute('aria-selected', 'true');
    });

    it('すべてタブを選ぶとstorageが空文字に戻る', async () => {
      const user = userEvent.setup();
      useInventoryFilterStore.setState({ storage: '冷蔵庫' });
      render(<InventoryStorageTabs storageLocations={storageLocations} />);

      await user.click(screen.getByRole('tab', { name: 'すべて' }));

      expect(useInventoryFilterStore.getState().storage).toBe('');
    });
  });

  describe('境界値', () => {
    it('storageLocationsを省略するとすべてタブのみでクラッシュしない', () => {
      render(<InventoryStorageTabs />);

      expect(screen.getAllByRole('tab')).toHaveLength(1);
      expect(screen.getByRole('tab', { name: 'すべて' })).toBeInTheDocument();
    });

    it('storageがストア側で既に特定の保管場所に設定されている状態でマウントすると対応するタブが選択状態で表示される', () => {
      useInventoryFilterStore.setState({ storage: '冷凍庫' });

      render(<InventoryStorageTabs storageLocations={storageLocations} />);

      expect(screen.getByRole('tab', { name: '冷凍庫' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: 'すべて' })).toHaveAttribute('aria-selected', 'false');
    });
  });
});
