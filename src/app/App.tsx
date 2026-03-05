import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AdaptiveThemeProvider } from './context/AdaptiveThemeContext';
import { UserRoleProvider } from './context/UserRoleContext';
import { ProModal, EmailCollectionModal } from './components/ProModal';

function App() {
  return (
    <AdaptiveThemeProvider>
      <UserRoleProvider>
        <RouterProvider router={router} />
        <ProModal />
        <EmailCollectionModal />
      </UserRoleProvider>
    </AdaptiveThemeProvider>
  );
}

export default App;
