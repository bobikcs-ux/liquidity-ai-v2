'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

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
  // Monetization tracking
  freeReportsDownloaded: number;
  copilotQuestionsAsked: number;
  incrementReportDownload: () => boolean; // Returns false if limit exceeded
  incrementCopilotQuestion: () => boolean; // Returns false if limit exceeded
  // Stripe success tracking
  showConfetti: boolean;
  setShowConfetti: (show: boolean) => void;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

const FREE_REPORT_LIMIT = 1;
const FREE_COPILOT_LIMIT = 3;

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    // Check localStorage for PRO status (persisted after Stripe success)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userRole');
      return (saved === 'PRO' ? 'PRO' : 'FREE') as UserRole;
    }
    return 'FREE';
  });
  const [showProModal, setShowProModal] = useState(false);
  const [proModalFeature, setProModalFeature] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Monetization tracking
  const [freeReportsDownloaded, setFreeReportsDownloaded] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('freeReportsDownloaded') || '0', 10);
    }
    return 0;
  });
  
  const [copilotQuestionsAsked, setCopilotQuestionsAsked] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('copilotQuestionsAsked') || '0', 10);
    }
    return 0;
  });

  const isPro = userRole === 'PRO';

  // Check URL for Stripe success param on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      
      if (success === 'true') {
        // User returned from Stripe with success
        setUserRoleState('PRO');
        localStorage.setItem('userRole', 'PRO');
        setShowConfetti(true);
        
        // Clean up URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        
        // Hide confetti after 5 seconds
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
  }, []);

  // Persist role changes
  const setUserRole = useCallback((role: UserRole) => {
    setUserRoleState(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', role);
    }
  }, []);

  const openProModal = useCallback((feature: string) => {
    setProModalFeature(feature);
    setShowProModal(true);
  }, []);

  const closeProModal = useCallback(() => {
    setShowProModal(false);
    setProModalFeature('');
  }, []);

  // Monetization guards
  const incrementReportDownload = useCallback((): boolean => {
    if (isPro) return true;
    
    if (freeReportsDownloaded >= FREE_REPORT_LIMIT) {
      openProModal('Unlimited Report Downloads');
      return false;
    }
    
    const newCount = freeReportsDownloaded + 1;
    setFreeReportsDownloaded(newCount);
    if (typeof window !== 'undefined') {
      localStorage.setItem('freeReportsDownloaded', String(newCount));
    }
    return true;
  }, [isPro, freeReportsDownloaded, openProModal]);

  const incrementCopilotQuestion = useCallback((): boolean => {
    if (isPro) return true;
    
    if (copilotQuestionsAsked >= FREE_COPILOT_LIMIT) {
      openProModal('Unlimited AI Copilot Access');
      return false;
    }
    
    const newCount = copilotQuestionsAsked + 1;
    setCopilotQuestionsAsked(newCount);
    if (typeof window !== 'undefined') {
      localStorage.setItem('copilotQuestionsAsked', String(newCount));
    }
    return true;
  }, [isPro, copilotQuestionsAsked, openProModal]);

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
        freeReportsDownloaded,
        copilotQuestionsAsked,
        incrementReportDownload,
        incrementCopilotQuestion,
        showConfetti,
        setShowConfetti,
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
