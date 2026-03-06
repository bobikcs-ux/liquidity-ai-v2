import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SubscriptionStatus = 'FREE' | 'SUBSCRIBED' | 'TRIAL';

interface SubscriptionState {
  status: SubscriptionStatus;
  isPaid: boolean;
  tier: 'BASIC' | 'INSTITUTIONAL' | null;
  expiresAt: Date | null;
}

interface SubscriptionContextType {
  subscription: SubscriptionState;
  checkAccess: (feature: 'intelligence' | 'deepRisk' | 'dossier') => boolean;
  upgradeTier: (tier: 'INSTITUTIONAL') => void;
  // For testing/demo
  setMockPaid: (isPaid: boolean) => void;
}

const defaultState: SubscriptionState = {
  status: 'FREE',
  isPaid: false, // MOCK: Set to false to see paywall
  tier: null,
  expiresAt: null,
};

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultState);

  const checkAccess = (feature: 'intelligence' | 'deepRisk' | 'dossier'): boolean => {
    // Premium features require paid subscription
    const premiumFeatures = ['intelligence', 'deepRisk', 'dossier'];
    
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
    <SubscriptionContext.Provider value={{ subscription, checkAccess, upgradeTier, setMockPaid }}>
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
