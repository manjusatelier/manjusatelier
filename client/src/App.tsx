import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { PageLoader } from '@/components/ui/PageLoader';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Chatbot } from '@/components/ui/Chatbot';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ProductModal } from '@/components/product/ProductModal';

// const Home = lazy(() => import('@/pages/Home'));
const intentionallyBroken: number = "this is a string to fail the build";
const Shop = lazy(() => import('@/pages/Shop'));
const ProductDetails = lazy(() => import('@/pages/ProductDetails'));
const Categories = lazy(() => import('@/pages/Categories'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const BulkOrders = lazy(() => import('@/pages/BulkOrders'));
const OfflineReview = lazy(() => import('@/pages/OfflineReview'));
const Cart = lazy(() => import('@/pages/Cart'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const CheckoutSuccess = lazy(() => import('@/pages/CheckoutSuccess'));
const Wishlist = lazy(() => import('@/pages/Wishlist'));
const Login = lazy(() => import('@/pages/Login'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Account = lazy(() => import('@/pages/Account'));
const Terms = lazy(() => import('@/pages/Terms'));
const OrderTracking = lazy(() => import('@/pages/OrderTracking'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Privacy = lazy(() => import('@/pages/Privacy'));

// Admin
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminOverview = lazy(() => import('@/pages/admin/Overview'));
const AdminAnalytics = lazy(() => import('@/pages/admin/Analytics'));
const AdminOrders = lazy(() => import('@/pages/admin/Orders'));
const AdminProducts = lazy(() => import('@/pages/admin/Products'));
const AdminCategories = lazy(() => import('@/pages/admin/Categories'));
const AdminCoupons = lazy(() => import('@/pages/admin/Coupons'));
const AdminSettings = lazy(() => import('@/pages/admin/Settings'));
const AdminCustomers = lazy(() => import('@/pages/admin/Customers'));
const Marketing = lazy(() => import('@/pages/admin/Marketing'));
const AdminReviews = lazy(() => import('@/pages/admin/Reviews'));

export default function App() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  return (
    <Suspense fallback={<PageLoader />}>
      <OfflineBanner />
      <Chatbot />
      <ProductModal />
      {needRefresh && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between bg-gold px-4 py-3 text-brown-dark shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
          <p className="text-sm font-medium">A new version of Manju's Atelier is available.</p>
          <button
            onClick={() => updateServiceWorker(true)}
            className="rounded bg-white px-4 py-1.5 text-xs font-bold transition-transform hover:scale-105"
          >
            Update
          </button>
        </div>
      )}
      <ErrorBoundary>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Shop />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetails />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/bulk-orders" element={<BulkOrders />} />
            <Route path="/offline-review" element={<OfflineReview />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/success/:id" element={<CheckoutSuccess />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/login" element={<Login />} />
            <Route path="/account" element={<Account />} />
            <Route path="/track" element={<OrderTracking />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Admin dashboard — own layout, admin-only */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </Suspense>
  );
}
