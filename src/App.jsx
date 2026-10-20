import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ClawTry from './pages/ClawTry';
import ClawCheck from './pages/ClawCheck';
import ContactUs from './pages/ContactUs';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<ClawTry />} />
        <Route path="/clawcheck" element={<ClawCheck />} />
        <Route path="/contact" element={<ContactUs />} />
      </Route>
    </Routes>
  );
}