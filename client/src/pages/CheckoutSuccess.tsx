import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Package } from 'lucide-react';
import { api } from '@/lib/api';
import type { Order } from '@/types';
import { usePageMeta } from '@/hooks/usePageMeta';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export default function CheckoutSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  usePageMeta({ title: "Order Confirmed — Manju's Atelier" });

  useEffect(() => {
    if (id) {
      // If returning from Cashfree redirect, verify payment status first
      api.post(`/orders/${id}/verify-cashfree`)
        .catch(() => void 0)
        .finally(() => {
          api.get<{ order: Order }>(`/orders/${id}`).then(({ order }) => setOrder(order)).catch(() => void 0);
        });
    }
  }, [id]);

  return (
    <div className="container-x grid place-items-center py-20 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <CheckCircle2 className="text-forest" size={80} strokeWidth={1.5} />
      </motion.div>
      <h1 className="mt-6 font-serif text-4xl text-brown-dark dark:text-beige">
        Thank You for Your Order!
      </h1>
      <p className="mt-3 max-w-md text-brown/70 dark:text-beige/70">
        Your handmade treasures are being lovingly prepared. A confirmation has been sent to your
        email.
      </p>

      {order && (
        <div className="card-surface mt-8 w-full max-w-md p-6 text-left">
          <div className="flex items-center justify-between border-b border-brown/10 pb-3">
            <span className="flex items-center gap-2 font-medium text-brown-dark dark:text-beige">
              <Package size={18} /> Order {order.customOrderId || `#${order._id.slice(-8).toUpperCase()}`}
            </span>
            <span className="rounded-full bg-forest/15 px-3 py-1 text-xs font-semibold text-forest">
              {order.paymentStatus === 'SUCCESSFUL' ? 'Paid' : order.paymentStatus.replace(/_/g, ' ')}
            </span>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-brown/60 dark:text-beige/60">Items</dt>
              <dd>{order.items.reduce((s, i) => s + i.quantity, 0)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-forest">
                <dt>Discount</dt>
                <dd>-{formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-brown/60 dark:text-beige/60">Shipping</dt>
              <dd>{order.shippingFee === 0 ? 'Free' : formatPrice(order.shippingFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-brown/10 pt-2 font-semibold text-brown-dark dark:text-beige">
              <dt>Total Paid</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Link to="/account">
          <Button variant="secondary">View My Orders</Button>
        </Link>
        <Link to="/shop">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}
