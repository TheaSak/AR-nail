import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ClawsTry from './pages/ClawsTry';
import ClawsCheck from './pages/ClawsCheck';
import ContactUs from './pages/ContactUs';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Main studio page with top-level tabs: NailAR Studio & ClawsFit Wardrobe */}
        <Route path="/" element={<ClawsTry />} />
        <Route path="/clawsfit" element={<ClawsTry initialTab="clawsfit" />} />
        
        {/* Dedicated routes for nail health & contact */}
        <Route path="/clawscheck" element={<ClawsCheck />} />
        <Route path="/contact" element={<ContactUs />} />
      </Route>
    </Routes>
  );
}
