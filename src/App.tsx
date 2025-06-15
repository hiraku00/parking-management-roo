import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/owner/Dashboard';
import ContractorPage from './pages/contractor/ContractorPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/contractor/:name" element={<ContractorPage />} />
        <Route
          path="/contractor/:contractorName/payment/success"
          element={<PaymentSuccessPage />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
