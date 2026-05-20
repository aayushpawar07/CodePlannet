import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from '../components/Footer';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <main className="ml-64 p-8">
        <Outlet />
        <Footer />
      </main>
    </div>
  );
}
