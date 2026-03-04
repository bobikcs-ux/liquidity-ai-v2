import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AdaptiveThemeProvider } from './context/AdaptiveThemeContext';

function App() {
  return (
    <AdaptiveThemeProvider>
      <RouterProvider router={router} />
    </AdaptiveThemeProvider>
  );
}

export default App;
