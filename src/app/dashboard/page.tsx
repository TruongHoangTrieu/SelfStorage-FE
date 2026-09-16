import CustomerDashboard from '@/components/CustomerDashboard';
import Navbar from '@/components/Navbar';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar />
      <div className="pt-20">
        <CustomerDashboard />
      </div>
    </main>
  );
}
