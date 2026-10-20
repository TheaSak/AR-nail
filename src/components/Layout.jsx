import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import LipstickCursor from '../LipstickCursor';

export default function Layout() {
  return (
    <>
      <LipstickCursor />
      {/* Ambient background blobs */}
      <div className="blob blob-rose" aria-hidden="true" />
      <div className="blob blob-gold" aria-hidden="true" />

      <Navbar />

      {/* Page content rendered here by React Router */}
      <main>
        <Outlet />
      </main>
    </>
  );
}
