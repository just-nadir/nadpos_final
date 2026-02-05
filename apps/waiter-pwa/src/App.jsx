import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import TablesPage from './pages/TablesPage';
import OrderPage from './pages/OrderPage';
import { getUser } from './utils/storage';

// Protected Route komponenti
function ProtectedRoute({ children }) {
  const user = getUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route path="/tables" element={
          <ProtectedRoute>
            <TablesPage />
          </ProtectedRoute>
        } />

        <Route path="/order/:tableId" element={
          <ProtectedRoute>
            <OrderPage />
          </ProtectedRoute>
        } />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/tables" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
