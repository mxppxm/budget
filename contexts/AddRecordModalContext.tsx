import React, { createContext, useCallback, useContext, useState } from 'react';
import { AddRecordModal } from '../components/AddRecordModal';

type AddRecordModalContextValue = {
  openAddModal: () => void;
  closeAddModal: () => void;
};

const AddRecordModalContext = createContext<AddRecordModalContextValue | null>(null);

export function AddRecordModalProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  const openAddModal = useCallback(() => setVisible(true), []);
  const closeAddModal = useCallback(() => setVisible(false), []);

  return (
    <AddRecordModalContext.Provider value={{ openAddModal, closeAddModal }}>
      {children}
      <AddRecordModal visible={visible} onClose={closeAddModal} />
    </AddRecordModalContext.Provider>
  );
}

export function useAddRecordModal() {
  const ctx = useContext(AddRecordModalContext);
  if (!ctx) {
    throw new Error('useAddRecordModal must be used within AddRecordModalProvider');
  }
  return ctx;
}
