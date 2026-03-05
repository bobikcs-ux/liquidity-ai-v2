'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';

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
  // Admin toggle
  toggleAdminAccess: () => void;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

const FREE_REPORT_LIMIT = 1;
const FREE_COPILOT_LIMIT = 3;

// Admin secret: Type "bobikcs" anywhere to toggle PRO status
const ADMIN_SECRET = 'bobikcs';

export function UserRoleProvider({ children }: { children: ReactNode }) {
  // Start with FREE, then hydrate from localStorage in useEffect
  const [userRole, setUserRoleState] = useState<UserRole>('FREE');
  const [showProModal, setShowProModal] = useState(false);
  const [proModalFeature, setProModalFeature] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Monetization tracking
  const [freeReportsDownloaded, setFreeReportsDownloaded] = useState(0);
  const [copilotQuestionsAsked, setCopilotQuestionsAsked] = useState(0);
  
  // Admin keyboard sequence tracker
  const keySequenceRef = useRef('');

  const isPro = userRole === 'PRO';
  
  // Hydrate from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('userRole');
      if (savedRole === 'PRO') {
        setUserRoleState('PRO');
      }
      
      const savedReports = localStorage.getItem('freeReportsDownloaded');
      if (savedReports) {
        setFreeReportsDownloaded(parseInt(savedReports, 10));
      }
      
      const savedCopilot = localStorage.getItem('copilotQuestionsAsked');
      if (savedCopilot) {
        setCopilotQuestionsAsked(parseInt(savedCopilot, 10));
      }
    }
  }, []);
  
  // Admin keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only track lowercase letters
      if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
        keySequenceRef.current += e.key.toLowerCase();
        
        // Keep only last N characters (length of secret)
        if (keySequenceRef.current.length > ADMIN_SECRET.length) {
          keySequenceRef.current = keySequenceRef.current.slice(-ADMIN_SECRET.length);
        }
        
        // Check if secret typed
        if (keySequenceRef.current === ADMIN_SECRET) {
          toggleAdminAccess();
          keySequenceRef.current = '';
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userRole]);
  
  // Toggle admin access function
  const toggleAdminAccess = useCallback(() => {
    const newRole = userRole === 'PRO' ? 'FREE' : 'PRO';
    setUserRoleState(newRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', newRole);
    }
    // Show brief visual feedback
    if (newRole === 'PRO') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [userRole]);

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
        toggleAdminAccess,
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
