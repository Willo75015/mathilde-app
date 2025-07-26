// 🚀 CHUNK 8: OPTIMIZED PROVIDERS ARCHITECTURE
// Orchestration optimisée des providers via GlobalCoordinator
// Date: 26 Juillet 2025

import React from 'react';
import { DashboardProvider } from '@/contexts/DashboardContext';
import { CalendarProvider } from '@/contexts/CalendarContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { FloristProvider } from '@/contexts/FloristContext';
import { AnalyticsProvider } from '@/contexts/AnalyticsContext';
import { GlobalCoordinatorProvider } from '@/contexts/GlobalCoordinator';

// 🎯 WRAPPER OPTIMISÉ pour tous les contexts métier
const OptimizedBusinessContexts: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <DashboardProvider>
      <CalendarProvider>
        <ClientProvider>
          <FloristProvider>
            <AnalyticsProvider>
              {children}
            </AnalyticsProvider>
          </FloristProvider>
        </ClientProvider>
      </CalendarProvider>
    </DashboardProvider>
  );
};

// 🎯 PROVIDER PRINCIPAL avec GlobalCoordinator
export const MathildeAppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <GlobalCoordinatorProvider>
      <OptimizedBusinessContexts>
        {children}
      </OptimizedBusinessContexts>
    </GlobalCoordinatorProvider>
  );
};

export default MathildeAppProviders;