import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, ShoppingBag, Package, Users, AlertTriangle, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice, formatDate, formatOrderId } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Order, Product } from '@/types';

interface Stats {
  revenue: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  productCount: number;
  customerCount: number;
  lowStock: Pick<Product, '_id' | 'name' | 'stock' | 'slug'>[];
  recentOrders: Order[];
}

const statusColor: Record<string, string> = {
  processing: 'bg-gold/20 text-brown-dark',
  confirmed: 'bg-forest/15 text-forest',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-forest/20 text-forest',
  cancelled: 'bg-red-100 text-red-600',
};

export default function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ stats: Stats }>('/admin/stats')
      .then(({ stats }) => setStats(stats))
      .catch(() => void 0)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Revenue', value: stats ? formatPrice(stats.revenue) : '—', icon: IndianRupee, accent: 'text-forest' },
    { label: 'Orders', value: stats?.totalOrders ?? '—', icon: ShoppingBag, accent: 'text-brown' },
    { label: 'Products', value: stats?.productCount ?? '—', icon: Package, accent: 'text-brown' },
    { label: 'Customers', value: stats?.customerCount ?? '—', icon: Users, accent: 'text-brown' },
  ];

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-brown-dark dark:text-beige">Dashboard</h1>
        <p className="mt-1 text-brown/60 dark:text-beige/60">
          Welcome back, Manju. Here&apos;s how the shop is doing.
        </p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card-surface p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-brown/60 dark:text-beige/60">{c.label}</span>
              <c.icon size={18} className={c.accent} />
            </div>
            {loading ? (
              <Skeleton className="mt-3 h-8 w-24" />
            ) : (
              <p className="mt-2 font-serif text-3xl text-brown-dark dark:text-beige">{c.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="card-surface flex items-center gap-4 p-5">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/15 text-brown">
            <Clock size={20} />
          </span>
          <div>
            <p className="text-sm text-brown/60 dark:text-beige/60">Pending orders</p>
            <p className="font-serif text-2xl text-brown-dark dark:text-beige">
              {stats?.pendingOrders ?? '—'}
            </p>
          </div>
        </div>
        <div className="card-surface flex items-center gap-4 p-5">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle size={20} />
          </span>
          <div>
            <p className="text-sm text-brown/60 dark:text-beige/60">Low stock items</p>
            <p className="font-serif text-2xl text-brown-dark dark:text-beige">
              {stats?.lowStock.length ?? '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Recent orders */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-xl text-brown-dark dark:text-beige">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm text-brown hover:underline">
              View all
            </Link>
          </div>
          <div className="card-surface divide-y divide-brown/10">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="m-3 h-12" />)
            ) : stats && stats.recentOrders.length > 0 ? (
              stats.recentOrders.map((o) => (
                <div key={o._id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-brown-dark dark:text-beige">
                      {formatOrderId(o)}
                    </p>
                    <p className="truncate text-xs text-brown/50 dark:text-beige/50">
                      {typeof o.user === 'object' && o.user
                        ? (o.user as { name?: string }).name
                        : 'Customer'}{' '}
                      · {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusColor[o.orderStatus]}`}
                    >
                      {o.orderStatus}
                    </span>
                    <span className="font-semibold text-brown-dark dark:text-beige">
                      {formatPrice(o.total)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-sm text-brown/50 dark:text-beige/50">
                No orders yet.
              </p>
            )}
          </div>
        </section>

        {/* Low stock */}
        <section>
          <h2 className="mb-3 font-serif text-xl text-brown-dark dark:text-beige">Low Stock</h2>
          <div className="card-surface divide-y divide-brown/10">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="m-3 h-10" />)
            ) : stats && stats.lowStock.length > 0 ? (
              stats.lowStock.map((p) => (
                <div key={p._id} className="flex items-center justify-between p-4">
                  <span className="truncate text-sm text-brown-dark dark:text-beige">{p.name}</span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      p.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-gold/20 text-brown-dark'
                    }`}
                  >
                    {p.stock} left
                  </span>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-sm text-brown/50 dark:text-beige/50">
                All products well stocked.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
