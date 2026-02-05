import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage.tsx';
import DashboardLayout from './layouts/DashboardLayout.tsx';
import DashboardPage from './pages/DashboardPage.tsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<div className="text-slate-500">Buyurtmalar tarixi (Tez orada)</div>} />
          <Route path="menu" element={<div className="text-slate-500">Menu boshqaruvi (Tez orada)</div>} />
          <Route path="settings" element={<div className="text-slate-500">Sozlamalar (Tez orada)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
