import { useState } from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Button } from '@/components/ui/Button';
import { Search, CheckCircle2, Clock, Package, Truck, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface TrackData {
  customOrderId: string;
  orderStatus: 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: string;
  createdAt: string;
  items: { name: string; image?: string; quantity: number }[];
}

export default function OrderTracking() {
  usePageMeta({ title: 'Track Order — Manju\'s Atelier' });
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrackData | null>(null);
  const { notify } = useToast();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    
    setLoading(true);
    setData(null);
    try {
      const res = await api.get<{ success: boolean; tracking: TrackData }>(`/orders/track/${orderId.trim().toUpperCase()}`);
      setData(res.tracking);
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Order not found. Please check your Order ID.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-x py-16 md:py-24">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <h1 className="font-serif text-3xl text-brown-dark md:text-4xl dark:text-beige">
            Track Your Order
          </h1>
          <p className="mt-3 text-brown/70 dark:text-beige/70">
            Enter your Order ID (e.g. MA10024) to see the real-time status of your handcrafted items.
          </p>
        </div>

        <form onSubmit={handleTrack} className="mt-8 flex gap-3">
          <input
            type="text"
            placeholder="e.g. MA10024"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="input flex-1 font-mono uppercase"
          />
          <Button type="submit" disabled={!orderId.trim() || loading}>
            {loading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Search size={18} className="mr-2" />} Track
          </Button>
        </form>

        {data && (
          <div className="mt-12 rounded-2xl bg-white p-6 shadow-soft dark:bg-[#26201a] md:p-8">
            <div className="flex items-center justify-between border-b border-brown/10 pb-4">
              <div>
                <p className="text-sm text-brown/60 dark:text-beige/60">Order ID</p>
                <p className="font-mono text-lg font-bold text-brown-dark dark:text-beige">
                  {data.customOrderId}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-brown/60 dark:text-beige/60">Status</p>
                <p className={cn("font-medium capitalize", data.orderStatus === 'cancelled' ? 'text-red-500' : 'text-forest')}>
                  {data.orderStatus}
                </p>
              </div>
            </div>

            {data.orderStatus === 'cancelled' ? (
              <div className="mt-8 rounded-lg bg-red-50 p-6 text-center text-red-600 dark:bg-red-500/10">
                <AlertCircle size={32} className="mx-auto mb-3" />
                <h3 className="text-lg font-bold">Order Cancelled</h3>
                <p className="mt-1 text-sm">This order has been cancelled.</p>
              </div>
            ) : (
              <div className="mt-8 space-y-8 pl-4">
                {/* Timeline Items */}
                <div className="relative flex gap-6">
                  <div className="absolute -bottom-8 left-3 top-8 w-px bg-forest" />
                  <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-forest text-white">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brown-dark dark:text-beige">Order Placed</h3>
                    <p className="text-sm text-brown/60 dark:text-beige/60">{new Date(data.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="relative flex gap-6">
                  <div className={cn("absolute -bottom-8 left-3 top-8 w-px", ['confirmed', 'shipped', 'delivered'].includes(data.orderStatus) ? "bg-forest" : "bg-brown/20")} />
                  <div className={cn("relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-white", ['confirmed', 'shipped', 'delivered'].includes(data.orderStatus) ? "bg-forest" : "bg-brown/20 text-transparent")}>
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <h3 className={cn("font-semibold", ['confirmed', 'shipped', 'delivered'].includes(data.orderStatus) ? "text-brown-dark dark:text-beige" : "text-brown/40")}>Payment Verified</h3>
                    {['confirmed', 'shipped', 'delivered'].includes(data.orderStatus) && <p className="text-sm text-brown/60 dark:text-beige/60">UTR successfully verified.</p>}
                  </div>
                </div>

                <div className="relative flex gap-6">
                  <div className={cn("absolute -bottom-8 left-3 top-8 w-px", ['shipped', 'delivered'].includes(data.orderStatus) ? "bg-forest" : "bg-brown/20")} />
                  <div className={cn("relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-white", ['shipped', 'delivered'].includes(data.orderStatus) ? "bg-forest" : "bg-brown/20 text-transparent", data.orderStatus === 'confirmed' && "bg-gold text-brown-dark")}>
                    {data.orderStatus === 'confirmed' ? <Clock size={14} /> : <CheckCircle2 size={14} />}
                  </div>
                  <div>
                    <h3 className={cn("font-semibold", ['confirmed', 'shipped', 'delivered'].includes(data.orderStatus) ? "text-brown-dark dark:text-beige" : "text-brown/40")}>Crafting in Progress</h3>
                    {data.orderStatus === 'confirmed' && <p className="text-sm text-brown/60 dark:text-beige/60">Manju is handcrafting your items.</p>}
                  </div>
                </div>

                <div className="relative flex gap-6">
                  <div className={cn("absolute -bottom-8 left-3 top-8 w-px", data.orderStatus === 'delivered' ? "bg-forest" : "bg-brown/20")} />
                  <div className={cn("relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-white", data.orderStatus === 'delivered' ? "bg-forest" : "bg-brown/20 text-transparent", data.orderStatus === 'shipped' && "bg-gold text-brown-dark")}>
                    {data.orderStatus === 'shipped' ? <Truck size={14} /> : <CheckCircle2 size={14} />}
                  </div>
                  <div>
                    <h3 className={cn("font-semibold", ['shipped', 'delivered'].includes(data.orderStatus) ? "text-brown-dark dark:text-beige" : "text-brown/40")}>Shipped</h3>
                  </div>
                </div>

                <div className="relative flex gap-6">
                  <div className={cn("relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-white", data.orderStatus === 'delivered' ? "bg-forest" : "bg-brown/20 text-transparent")}>
                    <Package size={14} />
                  </div>
                  <div>
                    <h3 className={cn("font-semibold", data.orderStatus === 'delivered' ? "text-brown-dark dark:text-beige" : "text-brown/40")}>Delivered</h3>
                  </div>
                </div>
              </div>
            )}
            
            {data.orderStatus !== 'cancelled' && (
              <div className="mt-8 rounded-lg bg-beige/30 p-4 text-sm text-brown/80 dark:bg-beige/10 dark:text-beige/80 flex items-start gap-3">
                 <AlertCircle size={18} className="shrink-0 text-brown/50 mt-0.5" />
                 <p>Updates might be slightly delayed. Please wait 24-48 hours after payment for tracking details to sync.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
