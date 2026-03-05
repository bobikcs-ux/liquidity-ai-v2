'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type UserRole = 'FREE' | 'PRO';

interface UserRoleContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isPro: boolean;
  showProModal: boolean;
  setShowProModal: (show: boolean) => void;
  proModalFeature: string;
  setProModalFeature: (feature: string) => void;
  showEmailModal: boolean;
  setShowEmailModal: (show: boolean) => void;
  openProModal: (feature: string) => void;
  closeProModal: () => void;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>('FREE');
  const [showProModal, setShowProModal] = useState(false);
  const [proModalFeature, setProModalFeature] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  const isPro = userRole === 'PRO';

  const openProModal = useCallback((feature: string) => {
    setProModalFeature(feature);
    setShowProModal(true);
  }, []);

  const closeProModal = useCallback(() => {
    setShowProModal(false);
    setProModalFeature('');
  }, []);

  return (
    <UserRoleContext.Provider
      value={{
        userRole,
        setUserRole,
        isPro,
        showProModal,
        setShowProModal,
        proModalFeature,
        setProModalFeature,
        showEmailModal,
        setShowEmailModal,
        openProModal,
        closeProModal,
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
}
