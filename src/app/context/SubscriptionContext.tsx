import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type SubscriptionStatus = 'FREE' | 'SUBSCRIBED' | 'TRIAL';

// Admin users who always have full access
const ADMIN_USERS = ['Admin_Bobikcs', 'admin@bobikcs.com', 'bobikcs'];

interface SubscriptionState {
  status: SubscriptionStatus;
  isPaid: boolean;
  tier: 'BASIC' | 'INSTITUTIONAL' | null;
  expiresAt: Date | null;
  isAdmin: boolean;
}

interface SubscriptionContextType {
  subscription: SubscriptionState;
  checkAccess: (feature: 'intelligence' | 'deepRisk' | 'dossier' | 'blackSwan' | 'narrativeShock' | 'deepShipping') => boolean;
  upgradeTier: (tier: 'INSTITUTIONAL') => void;
  setAdminUser: (username: string) => void;
  // For testing/demo
  setMockPaid: (isPaid: boolean) => void;
}

const defaultState: SubscriptionState = {
  status: 'FREE',
  isPaid: false, // MOCK: Set to false to see paywall
  tier: null,
  expiresAt: null,
  isAdmin: false,
};

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultState);
  
  // Check for admin user in localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('bobikcs_user');
    if (storedUser && ADMIN_USERS.includes(storedUser)) {
      setSubscription(prev => ({
        ...prev,
        isAdmin: true,
        isPaid: true,
        status: 'SUBSCRIBED',
        tier: 'INSTITUTIONAL',
      }));
    }
  }, []);
  
  // Admin user setter
  const setAdminUser = (username: string) => {
    if (ADMIN_USERS.includes(username)) {
      localStorage.setItem('bobikcs_user', username);
      setSubscription(prev => ({
        ...prev,
        isAdmin: true,
        isPaid: true,
        status: 'SUBSCRIBED',
        tier: 'INSTITUTIONAL',
      }));
    }
  };

  const checkAccess = (feature: 'intelligence' | 'deepRisk' | 'dossier' | 'blackSwan' | 'narrativeShock' | 'deepShipping'): boolean => {
    // Admins always have access
    if (subscription.isAdmin) {
      return true;
    }
    
    // Premium features require paid subscription
    const premiumFeatures = ['intelligence', 'deepRisk', 'dossier', 'blackSwan', 'narrativeShock', 'deepShipping'];
    
    if (premiumFeatures.includes(feature)) {
      return subscription.isPaid && subscription.status === 'SUBSCRIBED';
    }
    
    return true; // Free features
  };

  const upgradeTier = (tier: 'INSTITUTIONAL') => {
    setSubscription({
      status: 'SUBSCRIBED',
      isPaid: true,
      tier,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
  };

  // Mock function for testing paywall UI
  const setMockPaid = (isPaid: boolean) => {
    setSubscription(prev => ({
      ...prev,
      isPaid,
      status: isPaid ? 'SUBSCRIBED' : 'FREE',
      tier: isPaid ? 'INSTITUTIONAL' : null,
    }));
  };

  return (
    <SubscriptionContext.Provider value={{ subscription, checkAccess, upgradeTier, setMockPaid, setAdminUser }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
