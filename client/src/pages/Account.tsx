import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Plus, Trash2, MapPin, Package } from 'lucide-react';
import { api } from '@/lib/api';
import type { Order, Address } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { usePageMeta } from '@/hooks/usePageMeta';
import { cn, formatPrice, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useSocket } from '@/hooks/useSocket';

const statusStyles: Record<string, string> = {
  processing: 'bg-gold/20 text-brown-dark',
  confirmed: 'bg-forest/15 text-forest',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-forest/20 text-forest-dark',
  cancelled: 'bg-red-100 text-red-600',
};

export default function Account() {
  const { user, loading, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  
  // Profile state
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newAddress, setNewAddress] = useState<Address | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
  
  // UTR Modal state
  const [utrPrompt, setUtrPrompt] = useState<string | null>(null);
  const [newUtr, setNewUtr] = useState('');
  const [updatingUtr, setUpdatingUtr] = useState(false);

  // Return Modal state
  const [returnPrompt, setReturnPrompt] = useState<string | null>(null);
  const [returnType, setReturnType] = useState<'return' | 'exchange'>('return');
  const [returnReason, setReturnReason] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  usePageMeta({ title: "My Account — Manju's Atelier" });

  useEffect(() => {
    if (!loading && !user) navigate('/login?redirect=/account');
    if (user) {
      setName(user.name || '');
      setBirthday(user.birthday || '');
      setGender(user.gender || '');
      setAddresses(user.addresses || []);
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user)
      api
        .get<{ orders: Order[] }>('/orders/mine')
        .then(({ orders }) => setOrders(orders))
        .catch(() => void 0)
        .finally(() => setLoadingOrders(false));
  }, [user]);

  const socket = useSocket();
  useEffect(() => {
    if (!socket || !user) return;
    const onOrderUpdate = () => {
      // Re-fetch when user's order updates
      api
        .get<{ orders: Order[] }>('/orders/mine')
        .then(({ orders }) => setOrders(orders))
        .catch(() => void 0);
    };
    socket.on('order_update', onOrderUpdate);
    return () => {
      socket.off('order_update', onOrderUpdate);
    };
  }, [socket, user]);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.put('/auth/profile', {
        name: name.trim() ? name.trim() : undefined,
        birthday: birthday ? birthday : undefined,
        gender: gender ? gender : undefined,
        addresses: addresses,
      });
      notify('Profile updated successfully.');
      await refresh();
    } catch (error: unknown) {
      const e = error as { response?: { data?: { error?: string } }; message?: string };
      console.error('Profile update failed:', e.response?.data || e);
      notify(e.response?.data?.error || e.message || 'Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const submitUtr = async (orderId: string, utr: string) => {
    setUpdatingUtr(true);
    try {
      const { order } = await api.put<{ order: Order }>(`/orders/${orderId}/edit-utr`, { utrNumber: utr });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? order : o)));
      notify('UTR updated successfully.');
    } catch (error: unknown) {
      const e = error as { response?: { data?: { error?: string } } };
      notify(e.response?.data?.error || 'Failed to update UTR.', 'error');
    } finally {
      setUpdatingUtr(false);
    }
  };

  const submitReturn = async () => {
    if (!returnPrompt) return;
    setSubmittingReturn(true);
    try {
      const { order } = await api.post<{ order: Order }>(`/orders/${returnPrompt}/request-return`, {
        actionType: returnType,
        reason: returnReason
      });
      setOrders((prev) => prev.map((o) => (o._id === returnPrompt ? order : o)));
      notify('Request submitted successfully.');
      setReturnPrompt(null);
      setReturnReason('');
    } catch (error: unknown) {
      const e = error as { response?: { data?: { error?: string } } };
      notify(e.response?.data?.error || 'Failed to submit request.', 'error');
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container-x py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-brown/10 pb-6 dark:border-beige/10">
        <h1 className="font-serif text-3xl text-brown-dark dark:text-beige">My Account</h1>
        <Button variant="secondary" onClick={() => logout().then(() => navigate('/'))}>
          <LogOut size={16} /> Logout
        </Button>
      </div>

      <div className="mb-8 flex border-b border-brown/10 dark:border-beige/10">
        <button 
          onClick={() => setActiveTab('orders')}
          className={cn(
            "px-5 py-3 font-medium border-b-2 transition-colors",
            activeTab === 'orders' ? "border-brown text-brown-dark dark:border-beige dark:text-beige" : "border-transparent text-brown/60 hover:text-brown dark:text-beige/60"
          )}
        >
          My Orders
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={cn(
            "px-5 py-3 font-medium border-b-2 transition-colors",
            activeTab === 'profile' ? "border-brown text-brown-dark dark:border-beige dark:text-beige" : "border-transparent text-brown/60 hover:text-brown dark:text-beige/60"
          )}
        >
          Profile Settings
        </button>
      </div>

      {activeTab === 'profile' && (
        <section className="card-surface p-6 max-w-2xl">
          {!user.birthday && (
            <div className="mb-6 rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm text-brown-dark dark:border-gold/20 dark:text-beige">
              <p className="font-medium text-gold-dark">🎉 Add your birthday!</p>
              <p className="mt-1 opacity-90">Set your birthday to receive an exclusive surprise coupon during your birth month. <strong>Note: You can only set your birthday once.</strong></p>
            </div>
          )}
          <div className="mb-6 flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-brown text-cream">
              <UserIcon size={28} />
            </span>
            <div>
              <p className="font-serif text-2xl text-brown-dark dark:text-beige">{user.name}</p>
              <p className="text-sm text-brown/60 dark:text-beige/60">{user.email}</p>
            </div>
          </div>
          
          <h2 className="mb-4 font-serif text-xl text-brown-dark dark:text-beige border-t border-brown/10 dark:border-beige/10 pt-6">
            Personal Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0 sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-brown-dark dark:text-beige">Full Name</label>
              <input 
                type="text" 
                className="input block w-full appearance-none" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1.5 flex items-center gap-2 min-h-[28px] text-sm font-medium text-brown-dark dark:text-beige">
                Birthday
                {user.birthday && <span className="text-[10px] uppercase tracking-wider text-brown/50 border border-brown/20 px-1.5 py-0.5 rounded">Locked</span>}
              </label>
              <input 
                type="date" 
                className={cn("input block w-full appearance-none", user.birthday && "opacity-60 cursor-not-allowed")} 
                value={birthday ? birthday.split('T')[0] : ''} 
                onChange={(e) => !user.birthday && setBirthday(e.target.value)}
                readOnly={!!user.birthday}
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1.5 flex items-center min-h-[28px] text-sm font-medium text-brown-dark dark:text-beige">Gender</label>
              <select className="input block w-full appearance-none" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <h2 className="mt-8 mb-4 font-serif text-xl text-brown-dark dark:text-beige border-t border-brown/10 dark:border-beige/10 pt-6">
            Saved Addresses
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            {addresses.map((addr, idx) => (
              <div key={idx} className="relative rounded-xl border border-brown/20 p-4 text-sm bg-cream dark:bg-beige/5 dark:border-beige/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-brown-dark dark:text-beige font-medium">
                    <MapPin size={16} /> Address {idx + 1}
                  </div>
                  <p className="text-brown/70 dark:text-beige/70">{addr.line1}</p>
                  {addr.line2 && <p className="text-brown/70 dark:text-beige/70">{addr.line2}</p>}
                  <p className="text-brown/70 dark:text-beige/70">{addr.city}, {addr.state}</p>
                  <p className="text-brown/70 dark:text-beige/70">{addr.postalCode}</p>
                </div>
                <button 
                  onClick={() => setAddresses(addresses.filter((_, i) => i !== idx))}
                  className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            
            {!newAddress && (
              <button 
                onClick={() => setNewAddress({ line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India' })}
                className="rounded-xl border-2 border-dashed border-brown/20 p-4 text-sm flex flex-col items-center justify-center gap-2 text-brown/60 hover:text-brown hover:border-brown hover:bg-brown/5 transition-all min-h-[140px] dark:border-beige/20 dark:text-beige/60 dark:hover:text-beige dark:hover:border-beige"
              >
                <Plus size={24} />
                <span className="font-medium">Add New Address</span>
              </button>
            )}
          </div>

          {newAddress && (
            <div className="rounded-xl border border-brown/20 p-5 bg-white shadow-sm dark:bg-[#2c2621] dark:border-beige/20 mb-6">
              <h3 className="font-medium text-brown-dark dark:text-beige mb-4">New Address</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <input className="input block w-full" placeholder="Address Line 1" value={newAddress.line1} onChange={e => setNewAddress({...newAddress, line1: e.target.value})} />
                </div>
                <div className="sm:col-span-2">
                  <input className="input block w-full" placeholder="Address Line 2 (Optional)" value={newAddress.line2} onChange={e => setNewAddress({...newAddress, line2: e.target.value})} />
                </div>
                <div>
                  <input className="input block w-full" placeholder="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} />
                </div>
                <div>
                  <input className="input block w-full" placeholder="State" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} />
                </div>
                <div>
                  <input className="input block w-full" placeholder="PIN Code" value={newAddress.postalCode} onChange={e => setNewAddress({...newAddress, postalCode: e.target.value})} />
                </div>
              </div>
              <div className="mt-4 flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setNewAddress(null)}>Cancel</Button>
                <Button onClick={() => {
                  if (!newAddress.line1 || !newAddress.city || !newAddress.state || !newAddress.postalCode) {
                    notify('Please fill all required address fields', 'error');
                    return;
                  }
                  setAddresses([...addresses, newAddress]);
                  setNewAddress(null);
                }}>Add Address</Button>
              </div>
            </div>
          )}

          <div className="mt-4 text-right pt-4 border-t border-brown/10 dark:border-beige/10">
            <Button disabled={savingProfile} onClick={saveProfile}>
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </section>
      )}

      {activeTab === 'orders' && (
        <section>

        {loadingOrders ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-brown/20 py-16 text-center">
            <p className="text-brown/60 dark:text-beige/60">You haven&apos;t placed any orders yet.</p>
            <Link to="/shop" className="mt-4">
              <Button>Start shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => {
              const deliveredDate = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.createdAt);
              const diffDays = Math.ceil(Math.abs(new Date().getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
              const canReturn = order.orderStatus === 'delivered' && diffDays <= 7 && !order.returnExchange;

              return (
              <div key={order._id} className="card-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brown/10 pb-3">
                  <div>
                    <p className="font-medium text-brown-dark dark:text-beige">
                      {order.customOrderId || `#${order._id.slice(-8).toUpperCase()}`}
                    </p>
                    <p className="text-xs text-brown/50">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-semibold capitalize',
                        statusStyles[order.orderStatus]
                      )}
                    >
                      {order.orderStatus}
                    </span>
                    <span className="font-semibold text-brown-dark dark:text-beige">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>
                {order.paymentStatus === 'UTR_MISMATCH_RETRY' && (
                  <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                    <p className="font-semibold">UTR Mismatch</p>
                    <p>Please check your bank statement and re-enter the correct 12-digit UTR.</p>
                  </div>
                )}
                {order.paymentMethod === 'UPI' &&
                 (order.paymentStatus === 'PENDING_UTR' || order.paymentStatus === 'UTR_VERIFICATION_PENDING' || order.paymentStatus === 'UTR_MISMATCH_RETRY') &&
                 !order.utrEdited && (
                  <div className="mt-2 text-right">
                    <button
                      onClick={() => {
                        setNewUtr('');
                        setUtrPrompt(order._id);
                      }}
                      className="text-xs font-medium text-gold hover:text-gold-light underline"
                    >
                      Edit UTR
                    </button>
                  </div>
                )}
                
                {order.returnExchange && (
                  <div className="mt-3 rounded-lg bg-orange-50 p-3 text-sm text-orange-800 border border-orange-200">
                    <p className="font-medium capitalize">{order.returnExchange.actionType} Request: {order.returnExchange.status}</p>
                    {order.returnExchange.adminNote && <p className="mt-1 opacity-80 text-xs">Note: {order.returnExchange.adminNote}</p>}
                  </div>
                )}
                
                {canReturn && (
                  <div className="mt-3">
                    <Button variant="secondary" size="sm" onClick={() => setReturnPrompt(order._id)}>
                      Request Return / Exchange
                    </Button>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-3">
                  {order.items.map((item) => (
                    <div key={item.product} className="flex items-center gap-2">
                      <img src={item.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      <div>
                        <p className="text-sm text-brown-dark dark:text-beige">{item.name}</p>
                        <p className="text-xs text-brown/50">
                          {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-3 border-t border-brown/10 dark:border-beige/10 flex justify-end">
                  <a
                    href={`${import.meta.env.VITE_API_URL || ''}/api/orders/${order._id}/invoice?token=${localStorage.getItem('token')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brown/10 px-3 py-1.5 text-xs font-semibold text-brown transition-colors hover:bg-brown/20 dark:bg-beige/10 dark:text-beige"
                  >
                    <Package size={14} /> Download Invoice
                  </a>
                </div>
              </div>
            )})}
          </div>
        )}
      </section>
      )}

      {/* UTR Modal */}
      {utrPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-brown-dark">
            <h3 className="mb-2 text-lg font-serif text-brown-dark dark:text-beige">Edit UTR Number</h3>
            <p className="mb-4 text-sm text-brown/70 dark:text-beige/70">
              Please enter the correct 12-digit UTR for this payment.
            </p>
            <input
              type="text"
              className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-2 mb-4 dark:border-beige/20 dark:bg-[#2c2621] outline-none focus:border-gold text-brown-dark dark:text-beige"
              value={newUtr}
              onChange={(e) => setNewUtr(e.target.value.replace(/\D/g, ''))}
              maxLength={12}
              placeholder="12-digit UTR"
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setUtrPrompt(null)}>Cancel</Button>
              <Button 
                disabled={newUtr.length !== 12 || updatingUtr}
                onClick={() => {
                  const id = utrPrompt;
                  setUtrPrompt(null);
                  submitUtr(id, newUtr);
                }}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Return/Exchange Modal */}
      {returnPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-brown-dark">
            <h3 className="mb-2 text-lg font-serif text-brown-dark dark:text-beige">Request Return / Exchange</h3>
            <p className="mb-4 text-sm text-brown/70 dark:text-beige/70">
              Please note that custom items cannot be returned.
            </p>
            
            <label className="block text-sm font-medium mb-1 dark:text-beige">Action</label>
            <select 
              className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-2 mb-4 dark:border-beige/20 dark:bg-[#2c2621] outline-none focus:border-gold text-brown-dark dark:text-beige"
              value={returnType}
              onChange={(e) => setReturnType(e.target.value as 'return' | 'exchange')}
            >
              <option value="return">Return</option>
              <option value="exchange">Exchange</option>
            </select>

            <label className="block text-sm font-medium mb-1 dark:text-beige">Reason</label>
            <textarea
              className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-2 mb-4 dark:border-beige/20 dark:bg-[#2c2621] outline-none focus:border-gold text-brown-dark dark:text-beige resize-none"
              rows={3}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Please explain why..."
            />

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setReturnPrompt(null)}>Cancel</Button>
              <Button 
                disabled={returnReason.trim().length === 0 || submittingReturn}
                onClick={submitReturn}
              >
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
