import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AdaptiveThemeProvider } from './context/AdaptiveThemeContext';
import { UserRoleProvider } from './context/UserRoleContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { AppContextProvider } from './context/AppContext';
import { ProModal, EmailCollectionModal, ConfettiEffect } from './components/ProModal';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary componentName="App">
      <AdaptiveThemeProvider>
        <UserRoleProvider>
          <SubscriptionProvider>
            <AppContextProvider>
              <RouterProvider router={router} />
              <ProModal />
              <EmailCollectionModal />
              <ConfettiEffect />
            </AppContextProvider>
          </SubscriptionProvider>
        </UserRoleProvider>
      </AdaptiveThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
