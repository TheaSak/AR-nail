import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ClawTry from './pages/ClawTry';
import ClawCheck from './pages/ClawCheck';
import ContactUs from './pages/ContactUs';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Main studio page with top-level tabs: NailAR Studio & ClawsFit Wardrobe */}
        <Route path="/" element={<ClawTry />} />
        <Route path="/clawsfit" element={<ClawTry initialTab="clawsfit" />} />
        
        {/* Dedicated routes for nail health & contact */}
        <Route path="/clawcheck" element={<ClawCheck />} />
        <Route path="/contact" element={<ContactUs />} />
      </Route>
    </Routes>
  );
}
