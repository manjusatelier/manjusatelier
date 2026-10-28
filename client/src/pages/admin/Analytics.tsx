import { useState, useEffect } from 'react';
import {
  Eye,
  ShoppingCart,
  CreditCard,
  CheckCircle2,
  TrendingUp,
  Percent,
  Layers,
  ArrowRight,
  Info,
  Calendar,
} from 'lucide-react';
import { api } from '@/lib/api';
import { PageLoader } from '@/components/ui/PageLoader';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface FunnelData {
  count: number;
  uniqueCount: number;
}

interface Metrics {
  product_viewed: FunnelData;
  added_to_cart: FunnelData;
  checkout_started: FunnelData;
  order_placed: FunnelData;
}

export default function Analytics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<number>(30);
  const [showGuide, setShowGuide] = useState(true);
  const { notify } = useToast();

  useEffect(() => {
    setLoading(true);
    api
      .get<{ metrics: Metrics }>(`/analytics/funnel?days=${days}`)
      .then((res) => setMetrics(res.metrics))
      .catch((err) => notify(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [days, notify]);

  if (loading && !metrics) return <PageLoader />;

  const viewed = metrics?.product_viewed || { count: 0, uniqueCount: 0 };
  const cart = metrics?.added_to_cart || { count: 0, uniqueCount: 0 };
  const checkout = metrics?.checkout_started || { count: 0, uniqueCount: 0 };
  const order = metrics?.order_placed || { count: 0, uniqueCount: 0 };

  // Conversion calculations
  const overallConvRate = viewed.uniqueCount > 0
    ? ((order.uniqueCount / viewed.uniqueCount) * 100).toFixed(1)
    : '0.0';

  const cartConvRate = cart.uniqueCount > 0
    ? ((order.uniqueCount / cart.uniqueCount) * 100).toFixed(1)
    : '0.0';

  const avgViewsPerSession = viewed.uniqueCount > 0
    ? (viewed.count / viewed.uniqueCount).toFixed(1)
    : '0.0';

  const steps = [
    {
      key: 'product_viewed',
      stepNumber: 1,
      stage: '1. Discovery',
      title: 'Products Viewed',
      icon: Eye,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      data: viewed,
      unitLabel: 'Unique Shoppers',
      totalLabel: 'Total Page Views',
      description: 'Visitors who opened and inspected individual product detail pages in your store.',
      nextRateLabel: 'Added to Cart',
      nextRate: viewed.uniqueCount > 0 ? ((cart.uniqueCount / viewed.uniqueCount) * 100).toFixed(1) : null,
    },
    {
      key: 'added_to_cart',
      stepNumber: 2,
      stage: '2. Interest',
      title: 'Added to Cart',
      icon: ShoppingCart,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      data: cart,
      unitLabel: 'Unique Shoppers',
      totalLabel: 'Total Items Added',
      description: 'Visitors who showed strong purchase intent by adding handcrafted items to their bag.',
      nextRateLabel: 'Proceeded to Checkout',
      nextRate: cart.uniqueCount > 0 ? ((checkout.uniqueCount / cart.uniqueCount) * 100).toFixed(1) : null,
    },
    {
      key: 'checkout_started',
      stepNumber: 3,
      stage: '3. Intent to Buy',
      title: 'Checkout Started',
      icon: CreditCard,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      data: checkout,
      unitLabel: 'Unique Shoppers',
      totalLabel: 'Checkout Sessions',
      description: 'Customers who clicked checkout and reached the shipping address & payment stage.',
      nextRateLabel: 'Completed Purchase',
      nextRate: checkout.uniqueCount > 0 ? ((order.uniqueCount / checkout.uniqueCount) * 100).toFixed(1) : null,
    },
    {
      key: 'order_placed',
      stepNumber: 4,
      stage: '4. Final Sale',
      title: 'Orders Placed',
      icon: CheckCircle2,
      iconBg: 'bg-forest/15 text-forest',
      data: order,
      unitLabel: 'Confirmed Buyers',
      totalLabel: 'Completed Orders',
      description: 'Customers who successfully completed payment and finalized their purchase!',
      nextRateLabel: null,
      nextRate: null,
    },
  ];

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header and Time Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brown-dark dark:text-beige">Analytics & Funnel</h1>
          <p className="mt-1 text-sm text-brown/70 dark:text-beige/70">
            See how visitors discover your handcrafted products, add them to cart, and complete orders.
          </p>
        </div>

        {/* Days Filter Pills */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-brown/15 bg-white/70 p-1 shadow-sm backdrop-blur-sm dark:border-beige/15 dark:bg-[#201a15]">
          <Calendar size={14} className="ml-2 text-brown/50 dark:text-beige/50" />
          {[
            { label: 'Last 7 Days', value: 7 },
            { label: 'Last 30 Days', value: 30 },
            { label: 'Last 90 Days', value: 90 },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setDays(tab.value)}
              className={cn(
                'rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                days === tab.value
                  ? 'bg-gold text-brown-dark shadow-sm'
                  : 'text-brown/70 hover:bg-brown/5 dark:text-beige/70 dark:hover:bg-white/5'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top High-Level Summary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-surface flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forest/15 text-forest">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-brown/60 dark:text-beige/60">
              Overall Store Conversion
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-serif text-2xl font-bold text-brown-dark dark:text-beige">
                {overallConvRate}%
              </span>
              <span className="text-xs text-brown/60 dark:text-beige/60">
                ({order.uniqueCount} of {viewed.uniqueCount} shoppers bought)
              </span>
            </div>
            <p className="text-[11px] text-brown/50 dark:text-beige/50 mt-0.5">
              Percentage of product viewers who completed an order
            </p>
          </div>
        </div>

        <div className="card-surface flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Percent size={22} />
          </div>
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-brown/60 dark:text-beige/60">
              Cart-to-Order Conversion
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-serif text-2xl font-bold text-brown-dark dark:text-beige">
                {cartConvRate}%
              </span>
              <span className="text-xs text-brown/60 dark:text-beige/60">
                ({order.uniqueCount} of {cart.uniqueCount} carts bought)
              </span>
            </div>
            <p className="text-[11px] text-brown/50 dark:text-beige/50 mt-0.5">
              Percentage of cart adders who completed checkout
            </p>
          </div>
        </div>

        <div className="card-surface flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
            <Layers size={22} />
          </div>
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-brown/60 dark:text-beige/60">
              Avg. Items Viewed Per Shopper
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-serif text-2xl font-bold text-brown-dark dark:text-beige">
                {avgViewsPerSession}
              </span>
              <span className="text-xs text-brown/60 dark:text-beige/60">
                pages per session
              </span>
            </div>
            <p className="text-[11px] text-brown/50 dark:text-beige/50 mt-0.5">
              Shows how actively customers are exploring different products
            </p>
          </div>
        </div>
      </div>

      {/* Funnel Stage Cards */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl text-brown-dark dark:text-beige">Customer Journey Stages</h2>
            <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-medium text-brown-dark dark:text-gold">
              Funnel Flow
            </span>
          </div>
          <span className="text-xs text-brown/60 dark:text-beige/60">
            Showing metrics for the past {days} days
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => {
            const IconComponent = step.icon;
            return (
              <div
                key={step.key}
                className="card-surface relative flex flex-col justify-between overflow-hidden rounded-2xl border border-brown/10 p-5 shadow-sm transition-all hover:shadow-md dark:border-beige/10"
              >
                {/* Step Header */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gold">
                      {step.stage}
                    </span>
                    <span className={cn('flex h-8 w-8 items-center justify-center rounded-xl', step.iconBg)}>
                      <IconComponent size={16} />
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-semibold text-brown-dark dark:text-beige">
                    {step.title}
                  </h3>

                  {/* Big Unique Number */}
                  <div className="mt-3">
                    <span className="font-serif text-3xl font-bold text-brown-dark dark:text-beige">
                      {step.data.uniqueCount.toLocaleString()}
                    </span>
                    <span className="ml-2 text-xs font-medium text-brown/70 dark:text-beige/70">
                      {step.unitLabel}
                    </span>
                  </div>

                  {/* Total Event Counter */}
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-brown/60 dark:text-beige/60">
                    <span className="font-semibold text-brown/80 dark:text-beige/80">
                      {step.data.count.toLocaleString()}
                    </span>
                    <span>{step.totalLabel}</span>
                  </div>

                  {/* Plain Language Step Explanation */}
                  <p className="mt-3 border-t border-brown/10 pt-3 text-xs leading-relaxed text-brown/70 dark:border-beige/10 dark:text-beige/70">
                    {step.description}
                  </p>
                </div>

                {/* Next Step Conversion Badge */}
                {step.nextRate !== null && (
                  <div className="mt-4 rounded-xl bg-brown/5 p-2.5 text-xs dark:bg-white/5">
                    <div className="flex items-center justify-between text-[11px] font-medium text-brown/60 dark:text-beige/60">
                      <span>Conversion to Next Step</span>
                      <ArrowRight size={12} className="text-gold" />
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="font-semibold text-brown-dark dark:text-beige">
                        {step.nextRateLabel}
                      </span>
                      <span className="font-bold text-gold">
                        {step.nextRate}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Friendly Explainer Guide */}
      <div className="rounded-3xl border border-brown/15 bg-cream/35 p-6 shadow-sm dark:border-beige/15 dark:bg-[#1f1914]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gold/20 text-gold">
              <Info size={20} />
            </div>
            <div>
              <h3 className="font-serif text-lg text-brown-dark dark:text-beige">
                Admin Guide: How to Understand & Read This Funnel
              </h3>
              <p className="text-xs text-brown/60 dark:text-beige/60">
                Simple explanation of the metrics and tips on how to use them to grow your business.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs font-semibold text-brown/70 hover:text-brown dark:text-beige/70 dark:hover:text-beige underline"
          >
            {showGuide ? 'Hide Guide' : 'Show Guide'}
          </button>
        </div>

        {showGuide && (
          <div className="mt-6 grid gap-6 border-t border-brown/10 pt-6 text-xs leading-relaxed sm:grid-cols-3 dark:border-beige/10">
            {/* Guide Item 1 */}
            <div className="space-y-2 rounded-2xl border border-brown/10 bg-white/70 p-4 shadow-xs dark:border-beige/10 dark:bg-[#26201a]">
              <div className="flex items-center gap-1.5 font-bold text-brown-dark dark:text-beige">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-[10px] text-gold">
                  1
                </span>
                <span>What is a Sales Funnel?</span>
              </div>
              <p className="text-brown/75 dark:text-beige/75">
                Think of your website like a physical craft stall. 100 people may look at your display (<strong>Product Viewed</strong>), 15 pick up an item to admire it (<strong>Added to Cart</strong>), 8 walk up to the counter (<strong>Checkout Started</strong>), and 5 complete payment (<strong>Order Placed</strong>).
              </p>
              <p className="text-brown/60 dark:text-beige/60 italic">
                A funnel lets you see exactly where customers drop off along the way.
              </p>
            </div>

            {/* Guide Item 2 */}
            <div className="space-y-2 rounded-2xl border border-brown/10 bg-white/70 p-4 shadow-xs dark:border-beige/10 dark:bg-[#26201a]">
              <div className="flex items-center gap-1.5 font-bold text-brown-dark dark:text-beige">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-[10px] text-gold">
                  2
                </span>
                <span>"Unique Sessions" vs "Total"</span>
              </div>
              <p className="text-brown/75 dark:text-beige/75">
                <strong>Unique Sessions</strong> represents individual customer shopping visits. If one customer browses 5 different products in 20 minutes, they count as <strong>1 Unique Shopper</strong>, but generate <strong>5 Total Views</strong>.
              </p>
              <p className="text-brown/60 dark:text-beige/60 italic">
                Always look at Unique Sessions to know how many actual people reached each stage.
              </p>
            </div>

            {/* Guide Item 3 */}
            <div className="space-y-2 rounded-2xl border border-brown/10 bg-white/70 p-4 shadow-xs dark:border-beige/10 dark:bg-[#26201a]">
              <div className="flex items-center gap-1.5 font-bold text-brown-dark dark:text-beige">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-[10px] text-gold">
                  3
                </span>
                <span>Actionable Tips to Improve</span>
              </div>
              <ul className="space-y-1.5 text-brown/75 dark:text-beige/75">
                <li>
                  • <strong>Low View-to-Cart?</strong> Add clearer photos, dimensions, and customer reviews.
                </li>
                <li>
                  • <strong>High Cart Abandonment?</strong> Remind users about free shipping (over ₹1499) and secure payments.
                </li>
                <li>
                  • <strong>Note on "Buy Now":</strong> When a customer clicks "Buy Now", they jump directly into Checkout, which is why checkout numbers can occasionally exceed cart additions.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
