import { useEffect, useState } from 'react';
import {
  ChevronDown,
  Package,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Eye,
  FileSpreadsheet,
  Download,
  Calendar,
  X,
  Loader2,
  Check,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import type { Order } from '@/types';
import { useSocket } from '@/hooks/useSocket';

interface AdminOrder extends Omit<Order, 'user'> {
  user?: { _id: string; name: string; email: string } | string;
  customOrderId?: string;
  utrNumber?: string;
  deliveredAt?: string;
  returnExchange?: {
    actionType: 'return' | 'exchange';
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    requestedAt: string;
    adminNote?: string;
  };
}

const getIndianFYLabel = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const fyStart = month >= 3 ? year : year - 1;
  return `FY ${fyStart}-${String(fyStart + 1).slice(-2)}`;
};

const EXPORT_PRESETS = [
  { id: 'last_week', label: 'Last Week', desc: 'Last 7 days' },
  { id: 'last_month', label: 'Last Month', desc: 'Last 30 days' },
  { id: 'last_3_months', label: 'Last 3 Months', desc: 'Last 90 days' },
  { id: 'last_6_months', label: 'Last 6 Months', desc: 'Last 180 days' },
  { id: 'last_12_months', label: 'Last 12 Months', desc: 'Last 365 days / 1 yr' },
  { id: 'this_financial_year', label: 'This Financial Year', desc: `${getIndianFYLabel()} (Apr 1 – Mar 31)` },
  { id: 'custom', label: 'Random Dates', desc: 'Pick start & end date' },
  { id: 'all_time', label: 'All Time', desc: 'Full history of payments' },
] as const;

type ExportPresetId = typeof EXPORT_PRESETS[number]['id'];

const statuses = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;

const statusColor: Record<string, string> = {
  processing: 'bg-gold/20 text-brown-dark',
  confirmed: 'bg-forest/15 text-forest',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-forest/20 text-forest',
  cancelled: 'bg-red-100 text-red-600',
};

const payColor: Record<string, string> = {
  SUCCESSFUL: 'bg-forest/15 text-forest',
  UTR_VERIFIED: 'bg-forest/15 text-forest',
  PAYMENT_PENDING: 'bg-gold/20 text-brown-dark',
  PENDING_UTR: 'bg-orange-100 text-orange-700',
  UTR_MISMATCH_RETRY: 'bg-orange-100 text-orange-700',
  UTR_VERIFICATION_PENDING: 'bg-purple-100 text-purple-700',
  FAILED: 'bg-red-100 text-red-600',
};

export default function Orders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const { notify } = useToast();

  const load = () => {
    setLoading(true);
    api
      .get<{ orders: AdminOrder[] }>(`/orders${filter ? `?status=${filter}` : ''}`)
      .then(({ orders }) => setOrders(orders))
      .catch((e) => notify(e.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const socket = useSocket();
  useEffect(() => {
    if (!socket) return;
    const onOrderUpdate = () => {
      // Re-fetch when any order updates
      api
        .get<{ orders: AdminOrder[] }>(`/orders${filter ? `?status=${filter}` : ''}`)
        .then(({ orders }) => setOrders(orders))
        .catch(() => void 0);
    };
    socket.on('order_update', onOrderUpdate);
    return () => {
      socket.off('order_update', onOrderUpdate);
    };
  }, [socket, filter]);

  const changeStatus = async (id: string, orderStatus: string) => {
    setUpdating(id);
    try {
      const { order } = await api.patch<{ order: AdminOrder }>(`/orders/${id}/status`, {
        orderStatus,
      });
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, orderStatus: order.orderStatus } : o)));
      notify('Order status updated');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Update failed', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const [utrPrompt, setUtrPrompt] = useState<{ id: string; action: 'verify' } | null>(null);
  const [adminUtr, setAdminUtr] = useState('');

  const initiateVerify = (id: string, verified: boolean) => {
    if (verified) {
      setAdminUtr('');
      setUtrPrompt({ id, action: 'verify' });
    } else {
      verifyUtrSubmit(id, false, '');
    }
  };

  const verifyUtrSubmit = async (id: string, verified: boolean, providedUtr: string) => {
    setUpdating(id);
    try {
      const { order } = await api.patch<{ order: AdminOrder }>(`/orders/${id}/verify-utr`, {
        verified,
        adminUtr: providedUtr,
      });
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, paymentStatus: order.paymentStatus, orderStatus: order.orderStatus } : o)));
      notify(verified ? 'UTR Verified! Stock deducted.' : 'UTR Rejected.');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Verification failed', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const [returnStatus, setReturnStatus] = useState<'pending' | 'approved' | 'rejected' | 'completed'>('pending');
  const [adminNote, setAdminNote] = useState('');

  const processReturn = async (id: string) => {
    setUpdating(id);
    try {
      const { order } = await api.patch<{ order: AdminOrder }>(`/orders/${id}/return-status`, {
        status: returnStatus,
        adminNote
      });
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, returnExchange: order.returnExchange } : o)));
      notify('Return/Exchange request updated.');
      setAdminNote('');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Update failed', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const customerName = (o: AdminOrder) =>
    typeof o.user === 'object' && o.user ? o.user.name : o.shippingAddress.fullName || 'Customer';

  const getWhatsAppLink = (o: AdminOrder) => {
    const phone = o.shippingAddress.phone?.replace(/\D/g, '') || '';
    const countryCode = phone.length === 10 ? '91' : '';
    const number = `${countryCode}${phone}`;
    const text = encodeURIComponent(`Hi ${customerName(o)}, this is Manju's Atelier! We are reaching out regarding your order #${o.customOrderId}.`);
    return `https://wa.me/${number}?text=${text}`;
  };

  // Excel Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportRange, setExportRange] = useState<ExportPresetId>('last_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [successfulOnly, setSuccessfulOnly] = useState(true);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [previewStats, setPreviewStats] = useState<{ count: number; totalRevenue: number; rangeLabel: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Live count preview
  useEffect(() => {
    if (!showExportModal) return;
    let cancelled = false;
    setPreviewLoading(true);

    const params = new URLSearchParams({
      range: exportRange,
      successfulOnly: String(successfulOnly),
    });
    if (exportRange === 'custom') {
      if (customStartDate) params.set('startDate', customStartDate);
      if (customEndDate) params.set('endDate', customEndDate);
    }

    api
      .get<{ count: number; totalRevenue: number; rangeLabel: string }>(`/admin/orders/export-count?${params.toString()}`)
      .then((res) => {
        if (!cancelled) setPreviewStats(res);
      })
      .catch(() => {
        if (!cancelled) setPreviewStats(null);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showExportModal, exportRange, customStartDate, customEndDate, successfulOnly]);

  const handleDownloadExcel = async () => {
    if (exportRange === 'custom' && !customStartDate && !customEndDate) {
      notify('Please pick at least a start or end date for custom range', 'error');
      return;
    }

    setDownloadingExcel(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        range: exportRange,
        successfulOnly: String(successfulOnly),
      });
      if (exportRange === 'custom') {
        if (customStartDate) params.set('startDate', customStartDate);
        if (customEndDate) params.set('endDate', customEndDate);
      }
      if (token) params.set('token', token);

      const BASE = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${BASE}/api/admin/orders/export-excel?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error('Failed to generate Excel file. Please try again.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `manjus-atelier-successful-orders-${exportRange}-${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      notify('Excel spreadsheet generated and downloaded successfully!', 'success');
      setShowExportModal(false);
    } catch (err: unknown) {
      const error = err as Error;
      notify(error.message || 'Download failed', 'error');
    } finally {
      setDownloadingExcel(false);
    }
  };

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-brown-dark dark:text-beige">Orders</h1>
          <p className="mt-1 text-brown/60 dark:text-beige/60">
            {loading ? 'Loading…' : `${orders.length} order${orders.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-full border border-brown/15 bg-white px-4 py-2 text-sm outline-none focus:border-brown dark:bg-[#26201a]"
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
          <Button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 rounded-full border border-[#825028]/30 bg-[#825028] px-4 py-2 text-sm font-medium text-white hover:bg-[#6c401d] shadow-sm transition-all dark:bg-[#C19B6C] dark:text-[#26201a] dark:hover:bg-[#b08b5c]"
          >
            <FileSpreadsheet size={16} />
            <span>Download Excel</span>
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card-surface grid place-items-center py-20 text-center">
          <Package className="text-brown/40" size={40} />
          <p className="mt-3 font-serif text-xl text-brown-dark dark:text-beige">No orders yet</p>
          <p className="mt-1 text-sm text-brown/50 dark:text-beige/50">
            Orders will appear here once customers check out.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o._id} className={cn("card-surface overflow-hidden", 
              o.paymentStatus === 'UTR_VERIFICATION_PENDING' && "border-2 border-purple-400",
              o.returnExchange?.status === 'pending' && "border-2 border-orange-400"
            )}>
              <button
                onClick={() => setExpanded(expanded === o._id ? null : o._id)}
                className="flex w-full items-center gap-4 p-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-brown-dark dark:text-beige">
                    {o.customOrderId || `#${o._id.slice(-8).toUpperCase()}`}
                  </p>
                  <p className="truncate text-xs text-brown/50 dark:text-beige/50">
                    {customerName(o)} · {new Date(o.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
                <span className={cn('hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline', payColor[o.paymentStatus] || 'bg-gray-100 text-gray-700')}>
                  {o.paymentStatus.replace(/_/g, ' ')}
                </span>
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold capitalize', statusColor[o.orderStatus])}>
                  {o.orderStatus}
                </span>
                {o.returnExchange && o.returnExchange.status === 'pending' && (
                  <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 capitalize hidden sm:inline">
                    {o.returnExchange.actionType} Req
                  </span>
                )}
                <span className="w-24 text-right font-semibold text-brown-dark dark:text-beige">
                  {formatPrice(o.total)}
                </span>
                <ChevronDown
                  size={18}
                  className={cn('shrink-0 text-brown/40 transition-transform', expanded === o._id && 'rotate-180')}
                />
              </button>

              {expanded === o._id && (
                <div className="grid gap-6 border-t border-brown/10 p-4 md:grid-cols-2">
                  {/* Items */}
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-brown-dark dark:text-beige">
                      Items
                    </h3>
                    <div className="space-y-2">
                      {o.items.map((it) => (
                        <div key={it.product} className="flex items-center gap-3">
                          <img src={it.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                          <span className="flex-1 text-sm text-brown-dark dark:text-beige">
                            {it.name}
                          </span>
                          <span className="text-xs text-brown/50">
                            {it.quantity} × {formatPrice(it.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <dl className="mt-3 space-y-1 border-t border-brown/10 pt-3 text-sm">
                      <div className="flex justify-between text-brown/60 dark:text-beige/60">
                        <dt>Subtotal</dt>
                        <dd>{formatPrice(o.subtotal)}</dd>
                      </div>
                      {o.discount > 0 && (
                        <div className="flex justify-between text-forest">
                          <dt>Discount {o.couponCode ? `(${o.couponCode})` : ''}</dt>
                          <dd>-{formatPrice(o.discount)}</dd>
                        </div>
                      )}
                      <div className="flex justify-between text-brown/60 dark:text-beige/60">
                        <dt>Shipping</dt>
                        <dd>{o.shippingFee === 0 ? 'Free' : formatPrice(o.shippingFee)}</dd>
                      </div>
                      <div className="flex justify-between font-semibold text-brown-dark dark:text-beige">
                        <dt>Total</dt>
                        <dd>{formatPrice(o.total)}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Shipping + status control */}
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-brown-dark dark:text-beige">
                      Shipping & Payment Info
                    </h3>
                    <div className="rounded-xl bg-beige/30 p-3 text-sm text-brown/80 dark:bg-beige/10 dark:text-beige/80">
                      <p className="font-medium">{o.shippingAddress.fullName}</p>
                      <p>{o.shippingAddress.phone}</p>
                      <p>
                        {o.shippingAddress.line1}
                        {o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ''}
                      </p>
                      <p>
                        {o.shippingAddress.city}, {o.shippingAddress.state} -{' '}
                        {o.shippingAddress.postalCode}
                      </p>
                      {typeof o.user === 'object' && o.user && (
                        <p className="mt-2 text-xs text-brown/50">{o.user.email}</p>
                      )}
                      
                      {o.shippingAddress.phone && (
                        <a
                          href={getWhatsAppLink(o)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#25D366]/10 px-3 py-1.5 text-xs font-semibold text-[#128C7E] transition-colors hover:bg-[#25D366]/20 dark:bg-[#25D366]/10 dark:text-[#25D366]"
                        >
                          <MessageCircle size={14} /> Message
                        </a>
                      )}
                      
                      <div className="mt-3 flex gap-2 flex-wrap">
                        <a
                          href={`${import.meta.env.VITE_API_URL || ''}/api/orders/${o._id}/invoice?action=view&token=${localStorage.getItem('token')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brown/10 px-3 py-1.5 text-xs font-semibold text-brown transition-colors hover:bg-brown/20 dark:bg-beige/10 dark:text-beige"
                        >
                          <Eye size={14} /> View Invoice
                        </a>
                        <a
                          href={`${import.meta.env.VITE_API_URL || ''}/api/orders/${o._id}/invoice?token=${localStorage.getItem('token')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brown/10 px-3 py-1.5 text-xs font-semibold text-brown transition-colors hover:bg-brown/20 dark:bg-beige/10 dark:text-beige"
                        >
                          <Package size={14} /> Download
                        </a>
                      </div>
                      
                      <div className="mt-3 border-t border-brown/10 pt-2">
                         <p className="text-xs text-brown/50">Method: {o.paymentMethod || 'UPI'}</p>
                         {o.utrNumber && (
                           <p className="font-mono text-sm mt-1">
                             UTR: <span className="font-bold text-brown-dark dark:text-beige">{o.utrNumber}</span>
                           </p>
                         )}
                      </div>
                    </div>
                    
                    {o.paymentStatus === 'UTR_VERIFICATION_PENDING' && (
                      <div className="mt-4 flex gap-2">
                        <Button
                          size="sm"
                          className="bg-forest text-cream hover:bg-forest/90"
                          disabled={updating === o._id}
                          onClick={() => initiateVerify(o._id, true)}
                        >
                          <CheckCircle2 size={16} className="mr-1" /> Approve UTR
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          disabled={updating === o._id}
                          onClick={() => initiateVerify(o._id, false)}
                        >
                          <XCircle size={16} className="mr-1" /> Reject UTR
                        </Button>
                      </div>
                    )}

                    <label className="mt-4 block text-sm font-semibold text-brown-dark dark:text-beige">
                      Update Shipping Status
                    </label>
                    <select
                      value={o.orderStatus}
                      disabled={updating === o._id}
                      onChange={(e) => changeStatus(o._id, e.target.value)}
                      className="input mt-1.5 capitalize"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s} className="capitalize">
                          {s}
                        </option>
                      ))}
                    </select>

                    {o.returnExchange && (
                      <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4 dark:bg-orange-900/10 dark:border-orange-900/30">
                        <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-200 mb-2 capitalize">
                          {o.returnExchange.actionType} Request ({o.returnExchange.status})
                        </h3>
                        <p className="text-sm text-orange-800 dark:text-orange-300/80 mb-1">
                          <span className="font-medium">Reason:</span> {o.returnExchange.reason}
                        </p>
                        {o.returnExchange.adminNote && (
                          <p className="text-sm text-orange-800 dark:text-orange-300/80 mb-3">
                            <span className="font-medium">Admin Note:</span> {o.returnExchange.adminNote}
                          </p>
                        )}
                        
                        <div className="mt-3 space-y-2 border-t border-orange-200 pt-3 dark:border-orange-900/30">
                          <label className="text-xs font-semibold text-orange-900 dark:text-orange-200">Update Request Status</label>
                          <div className="flex gap-2">
                            <select 
                              className="input flex-1 text-sm py-1.5"
                              value={returnStatus}
                              onChange={(e) => setReturnStatus(e.target.value as any)}
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approve</option>
                              <option value="rejected">Reject</option>
                              <option value="completed">Complete</option>
                            </select>
                          </div>
                          <input 
                            type="text" 
                            className="input w-full text-sm py-1.5" 
                            placeholder="Add a note for the user (optional)" 
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                          />
                          <Button 
                            size="sm" 
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                            disabled={updating === o._id}
                            onClick={() => processReturn(o._id)}
                          >
                            Update Request
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* UTR Modal */}
      {utrPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-brown-dark">
            <h3 className="mb-2 text-lg font-serif text-brown-dark dark:text-beige">Enter UTR Number</h3>
            <p className="mb-4 text-sm text-brown/70 dark:text-beige/70">
              Please enter the 12-digit UTR from your bank statement to verify this payment.
            </p>
            <input
              type="text"
              className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-2 mb-4 dark:border-beige/20 dark:bg-[#2c2621] outline-none focus:border-gold text-brown-dark dark:text-beige"
              value={adminUtr}
              onChange={(e) => setAdminUtr(e.target.value.replace(/\D/g, ''))}
              maxLength={12}
              placeholder="12-digit UTR"
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setUtrPrompt(null)}>Cancel</Button>
              <Button 
                disabled={adminUtr.length !== 12 || updating === utrPrompt.id}
                onClick={() => {
                  const id = utrPrompt.id;
                  setUtrPrompt(null);
                  verifyUtrSubmit(id, true, adminUtr);
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#201a15] border border-brown/10 dark:border-beige/10 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-brown/10 dark:border-beige/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest/10 text-forest dark:bg-forest/25 dark:text-emerald-400">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-brown-dark dark:text-beige">
                    Download Successful Orders & Payments
                  </h3>
                  <p className="text-xs text-brown/65 dark:text-beige/65 mt-0.5">
                    Generate an official multi-sheet Excel spreadsheet with order details, itemized breakdown, and audit overview.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="rounded-full p-1.5 text-brown/50 hover:bg-brown/10 dark:text-beige/50 dark:hover:bg-beige/10 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Presets Grid */}
            <div className="mt-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-brown/70 dark:text-beige/70 mb-2.5">
                Select Date Range
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {EXPORT_PRESETS.map((preset) => {
                  const isSelected = exportRange === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setExportRange(preset.id)}
                      className={cn(
                        "flex flex-col items-start p-3 rounded-xl border text-left transition-all relative overflow-hidden",
                        isSelected
                          ? "border-[#825028] bg-[#825028]/10 text-brown-dark dark:border-[#C19B6C] dark:bg-[#C19B6C]/15 dark:text-beige shadow-sm"
                          : "border-brown/15 bg-cream/40 text-brown/80 hover:border-brown/30 hover:bg-cream dark:border-beige/10 dark:bg-[#28211b] dark:text-beige/75 dark:hover:border-beige/30"
                      )}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#825028] text-white dark:bg-[#C19B6C] dark:text-[#26201a]">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                      <span className="font-semibold text-xs leading-tight pr-4">
                        {preset.label}
                      </span>
                      <span className="text-[10px] text-brown/60 dark:text-beige/60 mt-1">
                        {preset.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Dates Input (Revealed if 'custom' is chosen) */}
            {exportRange === 'custom' && (
              <div className="mt-4 p-4 rounded-xl border border-gold/30 bg-gold/5 dark:bg-[#2a221a] dark:border-gold/20 animate-in fade-in">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-brown-dark dark:text-beige">
                  <Calendar size={14} className="text-[#825028] dark:text-gold" />
                  <span>Specify Custom / Random Date Interval</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-brown/70 dark:text-beige/70 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full rounded-lg border border-brown/20 bg-white px-3 py-2 text-xs outline-none focus:border-[#825028] dark:border-beige/20 dark:bg-[#1f1914] dark:text-beige"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-brown/70 dark:text-beige/70 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full rounded-lg border border-brown/20 bg-white px-3 py-2 text-xs outline-none focus:border-[#825028] dark:border-beige/20 dark:bg-[#1f1914] dark:text-beige"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Filter Toggle */}
            <div className="mt-4 p-3.5 rounded-xl border border-brown/10 bg-cream/30 dark:bg-[#261f18] dark:border-beige/10 flex items-center justify-between">
              <div>
                <label htmlFor="successful-only" className="text-xs font-semibold text-brown-dark dark:text-beige cursor-pointer flex items-center gap-2">
                  <span>Only Successful Payments</span>
                  <span className="rounded-full bg-forest/15 px-2 py-0.5 text-[10px] font-bold text-forest uppercase tracking-wider">
                    Recommended
                  </span>
                </label>
                <p className="text-[11px] text-brown/60 dark:text-beige/60 mt-0.5">
                  Filters for verified UPI & successful payments (UTR_VERIFIED & SUCCESSFUL). Uncheck to include all orders.
                </p>
              </div>
              <input
                id="successful-only"
                type="checkbox"
                checked={successfulOnly}
                onChange={(e) => setSuccessfulOnly(e.target.checked)}
                className="h-4 w-4 rounded accent-[#825028] cursor-pointer"
              />
            </div>

            {/* Live Data Matching Summary */}
            <div className="mt-4 rounded-xl border border-forest/20 bg-forest/5 p-4 dark:border-emerald-500/20 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-forest dark:text-emerald-400">
                    Data Summary Preview
                  </p>
                  <p className="text-sm font-medium text-brown-dark dark:text-beige mt-0.5">
                    {previewLoading ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-brown/60 dark:text-beige/60">
                        <Loader2 className="animate-spin" size={13} />
                        Calculating matching orders...
                      </span>
                    ) : previewStats ? (
                      <span>
                        Found <strong className="text-forest dark:text-emerald-400 font-bold">{previewStats.count}</strong> {successfulOnly ? 'successful' : ''} order{previewStats.count === 1 ? '' : 's'} totaling <strong className="text-brown-dark dark:text-beige font-bold">₹{previewStats.totalRevenue.toLocaleString('en-IN')}</strong>
                      </span>
                    ) : (
                      'Ready to export'
                    )}
                  </p>
                </div>
                <div className="hidden sm:block text-right text-[11px] text-brown/50 dark:text-beige/50">
                  <p>Includes: Orders, Items & Executive sheets</p>
                  <p>Format: Microsoft Excel (.xlsx)</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-brown/10 dark:border-beige/10">
              <Button
                variant="secondary"
                disabled={downloadingExcel}
                onClick={() => setShowExportModal(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={downloadingExcel || (exportRange === 'custom' && !customStartDate && !customEndDate)}
                onClick={handleDownloadExcel}
                className="flex items-center gap-2 bg-[#825028] hover:bg-[#6c401d] text-white px-5 dark:bg-[#C19B6C] dark:text-[#26201a] dark:hover:bg-[#b08b5c]"
              >
                {downloadingExcel ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Preparing Spreadsheet...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Download Excel Sheet</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
