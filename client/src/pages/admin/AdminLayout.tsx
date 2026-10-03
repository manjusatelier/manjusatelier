import { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Ticket,
  LogOut,
  Menu,
  X,
  Users,
  Store,
  Settings2,
  Megaphone,
  BarChart,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePageMeta } from '@/hooks/usePageMeta';
import { PageLoader } from '@/components/ui/PageLoader';
import { cn } from '@/lib/utils';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';

const nav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
  { to: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  { to: '/admin/settings', label: 'Settings', icon: Settings2 },
];

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [newOrderId, setNewOrderId] = useState<string | null>(null);
  
  const socket = useSocket();
  usePageMeta({ title: "Admin — Manju's Atelier" });

  const fetchPendingCount = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const data = await api.get<{success: boolean, count: number}>('/orders/pending-count');
      setPendingCount(data.count || 0);
    } catch (err) {
      console.error('Failed to fetch pending count', err);
    }
  }, [user]);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  useEffect(() => {
    if (!socket || !user || user.role !== 'admin') return;

    const onOrderUpdate = (data: any) => {
      fetchPendingCount();
      if (data.type === 'NEW_ORDER') {
        setNewOrderId(data.orderId);
      }
    };

    socket.on('order_update', onOrderUpdate);
    return () => {
      socket.off('order_update', onOrderUpdate);
    };
  }, [socket, user, fetchPendingCount]);

  if (loading) return <PageLoader />;

  if (!user || user.role !== 'admin') {
    return (
      <div className="grid min-h-screen place-items-center bg-cream px-6 text-center dark:bg-[#1c1712]">
        <div>
          <h1 className="font-serif text-3xl text-brown-dark dark:text-beige">
            Admin access required
          </h1>
          <p className="mt-2 text-brown/60 dark:text-beige/60">
            Please log in with an administrator account to continue.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/login?redirect=/admin"
              className="btn bg-brown px-6 py-3 text-sm text-cream hover:bg-brown-dark"
            >
              Log in
            </Link>
            <Link
              to="/"
              className="btn border border-brown/30 px-6 py-3 text-sm text-brown hover:bg-brown/10"
            >
              Back to store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const SidebarContent = (
    <>
      <Link to="/admin" className="flex items-center gap-2.5 px-2">
        <img src="/logo-256.png" alt="" className="h-10 w-10 rounded-full ring-1 ring-gold/40" />
        <div>
          <p className="font-serif text-lg leading-none text-brown-dark dark:text-beige">
            Manju&apos;s Atelier
          </p>
          <p className="text-xs text-brown/50 dark:text-beige/50">Admin Panel</p>
        </div>
      </Link>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brown text-cream'
                  : 'text-brown-dark hover:bg-beige/50 dark:text-beige dark:hover:bg-beige/10'
              )
            }
          >
            <div className="flex items-center gap-3">
              <item.icon size={18} />
              {item.label}
            </div>
            {item.label === 'Orders' && (
              <div className={cn("h-2 w-2 rounded-full", pendingCount > 0 ? "bg-red-500 animate-pulse" : "bg-green-500")} />
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-brown/10 pt-3">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-brown-dark hover:bg-beige/50 dark:text-beige dark:hover:bg-beige/10"
        >
          <Store size={18} /> View Store
        </Link>
        <button
          onClick={() => logout().then(() => navigate('/'))}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-cream dark:bg-[#1c1712]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-brown/10 bg-white p-4 dark:bg-[#26201a] lg:flex">
        {SidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-brown/10 bg-white p-4 dark:bg-[#26201a] lg:hidden">
        <span className="font-serif text-lg text-brown-dark dark:text-beige">Admin Panel</span>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="relative">
          <Menu />
          {pendingCount > 0 && (
            <div className="absolute -top-1 -right-1 h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 border border-white dark:border-[#26201a]" />
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-brown-dark/40" />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white p-4 dark:bg-[#26201a]">
            <button
              onClick={() => setOpen(false)}
              className="mb-4 self-end text-brown-dark dark:text-beige"
              aria-label="Close menu"
            >
              <X />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl p-5 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* New Order Prompt */}
      <AnimatePresence>
        {newOrderId && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-[100] flex w-80 flex-col gap-3 rounded-2xl bg-white p-5 shadow-lift dark:bg-[#26201a] border border-brown/10 dark:border-beige/10"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-red-500">
                <Megaphone size={20} className="animate-pulse" />
                <h3 className="font-bold">New Order Arrived!</h3>
              </div>
              <button 
                onClick={() => setNewOrderId(null)}
                className="text-brown-dark/50 hover:text-brown-dark dark:text-beige/50 dark:hover:text-beige transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-brown-dark/80 dark:text-beige/80">
              A new order has been placed. Please verify the UTR on top priority!
            </p>
            <div className="mt-2 flex justify-end gap-2">
              <button 
                onClick={() => setNewOrderId(null)}
                className="rounded-full px-4 py-2 text-xs font-medium text-brown-dark hover:bg-beige/50 dark:text-beige dark:hover:bg-beige/10 transition-colors"
              >
                Dismiss
              </button>
              <button 
                onClick={() => {
                  setNewOrderId(null);
                  navigate('/admin/orders');
                }}
                className="rounded-full bg-red-500 px-4 py-2 text-xs font-medium text-white hover:bg-red-600 transition-colors"
              >
                View Orders
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
