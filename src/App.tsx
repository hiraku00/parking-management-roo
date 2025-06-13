import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { OwnerDashboard } from './pages/owner/Dashboard';
import { ContractorDetails } from './pages/owner/ContractorDetails';
import { ContractorPage } from './pages/contractor/ContractorPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            className: 'text-sm',
          }}
        />
        <Routes>
          {/* オーナー関連のルート */}
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/owner/contractor/:id" element={<ContractorDetails />} />

          {/* 契約者関連のルート */}
          <Route path="/contractor/:name" element={<ContractorPage />} />

          {/* その他のルートはオーナーダッシュボードにリダイレクト */}
          <Route path="*" element={<Navigate to="/owner" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
