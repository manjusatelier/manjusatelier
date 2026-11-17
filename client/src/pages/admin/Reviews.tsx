import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useToast } from '@/components/ui/Toast';
import { Loader2, CheckCircle, Trash2, Clock, ShieldAlert, MapPin, Globe } from 'lucide-react';
import { Rating } from '@/components/ui/Rating';
import { formatDate } from '@/lib/utils';

interface Review {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  image?: string;
  status: 'pending' | 'approved';
  createdAt: string;
  product?: {
    _id: string;
    name: string;
  };
}

interface SecurityIncident {
  _id: string;
  incidentType: string;
  userName: string;
  userEmail: string;
  ipAddress: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
    isp?: string;
  };
  productName?: string;
  reviewComment?: string;
  aiVerdict?: string;
  aiReason?: string;
  aiCategories?: string[];
  aiModelUsed?: string;
  createdAt: string;
}

export default function AdminReviews() {
  usePageMeta({ title: "Reviews Moderation — Admin — Manju's Atelier" });
  const [activeTab, setActiveTab] = useState<'pending' | 'incidents'>('pending');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();

  const fetchPendingReviews = async () => {
    try {
      const res = await api.get<{ success: boolean; reviews: Review[] }>('/reviews/pending');
      setReviews(res.reviews);
    } catch (err: any) {
      notify(err.message || 'Failed to fetch pending reviews', 'error');
    }
  };

  const fetchIncidents = async () => {
    try {
      const res = await api.get<{ success: boolean; incidents: SecurityIncident[] }>('/reviews/incidents');
      setIncidents(res.incidents);
    } catch (err: any) {
      console.warn('Failed to fetch security incidents', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPendingReviews(), fetchIncidents()]).finally(() => setLoading(false));
  }, []);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'pending') => {
    try {
      await api.patch(`/reviews/${id}/status`, { status });
      notify(`Review ${status} successfully!`, 'success');
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch (err: any) {
      notify(err.message || 'Failed to update review status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      notify('Review deleted', 'success');
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch (err: any) {
      notify(err.message || 'Failed to delete review', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brown-dark dark:text-beige" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brown-dark dark:text-beige">Reviews & Content Safety</h1>
          <p className="mt-1 text-sm text-brown/70 dark:text-beige/70">
            Moderate customer reviews and inspect AI-blocked security incidents.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-full bg-brown/10 p-1 dark:bg-beige/10">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-brown-dark shadow-sm dark:bg-[#26201a] dark:text-beige'
                : 'text-brown/60 hover:text-brown dark:text-beige/60 dark:hover:text-beige'
            }`}
          >
            <Clock size={14} />
            <span>Pending ({reviews.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'incidents'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-red-600 hover:text-red-700 dark:text-red-400'
            }`}
          >
            <ShieldAlert size={14} />
            <span>Blocked Incidents ({incidents.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'pending' ? (
        reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-sm dark:bg-[#1c1712]">
            <div className="rounded-full bg-green-100 p-4 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle size={32} />
            </div>
            <h3 className="mt-4 font-serif text-xl text-brown-dark dark:text-beige">All caught up!</h3>
            <p className="mt-2 text-sm text-brown/70 dark:text-beige/70">
              There are no pending reviews to moderate right now.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="flex min-w-0 flex-col gap-4 overflow-hidden rounded-2xl bg-white p-5 shadow-sm dark:bg-[#1c1712] sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 truncate font-medium text-brown-dark dark:text-beige">{review.name}</span>
                    <span className="text-xs text-brown/50 dark:text-beige/50">
                      • {formatDate(review.createdAt)}
                    </span>
                  </div>
                  {review.product && (
                    <div className="break-words text-xs font-medium text-gold">
                      Product: {review.product.name}
                    </div>
                  )}
                  <Rating value={review.rating} count={0} size={16} />
                  {review.comment && (
                    <p className="mt-2 text-sm text-brown/80 dark:text-beige/80 italic break-words whitespace-pre-wrap">
                      "{review.comment}"
                    </p>
                  )}
                  {review.image && (
                    <div className="mt-3">
                      <a href={review.image} target="_blank" rel="noopener noreferrer">
                        <img src={review.image} alt="Review attachment" className="h-24 w-24 rounded-lg object-cover hover:opacity-80 transition-opacity border border-brown/10" />
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                  <button
                    onClick={() => handleUpdateStatus(review._id, 'approved')}
                    className="flex items-center gap-2 rounded-xl bg-forest/10 px-4 py-2 text-sm font-medium text-forest transition-colors hover:bg-forest/20"
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleDelete(review._id)}
                    className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/20"
                  >
                    <Trash2 size={16} />
                    Reject & Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Blocked Incidents Tab */
        incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-sm dark:bg-[#1c1712]">
            <div className="rounded-full bg-green-100 p-4 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle size={32} />
            </div>
            <h3 className="mt-4 font-serif text-xl text-brown-dark dark:text-beige">No Security Incidents</h3>
            <p className="mt-2 text-sm text-brown/70 dark:text-beige/70">
              Zero obscene or prohibited uploads have been attempted. The AI moderation shield is active 24/7.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-red-50 p-4 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs text-red-800 dark:text-red-300">
              <strong>Zero-Tolerance Policy Active:</strong> All listed submissions were blocked before saving to the database, images were shredded, and alert emails were sent to manjusatelier@gmail.com.
            </div>

            <div className="grid gap-4">
              {incidents.map((inc) => (
                <div
                  key={inc._id}
                  className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm dark:border-red-900/40 dark:bg-[#1c1611] space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brown/10 pb-3 dark:border-beige/10">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                        {inc.aiVerdict || 'BLOCKED'}
                      </span>
                      <span className="text-sm font-semibold text-brown-dark dark:text-beige">
                        {inc.userName}
                      </span>
                      <span className="text-xs text-brown/50 dark:text-beige/50">
                        ({inc.userEmail || 'Guest'})
                      </span>
                    </div>
                    <span className="text-xs text-brown/50 dark:text-beige/50">
                      {formatDate(inc.createdAt)}
                    </span>
                  </div>

                  <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex items-center gap-2 text-brown/80 dark:text-beige/80">
                      <Globe size={14} className="text-red-500 shrink-0" />
                      <span>IP: <code className="font-bold text-red-600">{inc.ipAddress}</code></span>
                    </div>
                    <div className="flex items-center gap-2 text-brown/80 dark:text-beige/80">
                      <MapPin size={14} className="text-red-500 shrink-0" />
                      <span>
                        {[inc.location?.city, inc.location?.region, inc.location?.country].filter(Boolean).join(', ') || 'Unknown'}
                      </span>
                    </div>
                    <div className="text-brown/80 dark:text-beige/80 truncate">
                      <span>ISP: {inc.location?.isp || 'Unknown'}</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-brown/5 p-3 dark:bg-beige/5 text-xs space-y-1">
                    <p className="font-semibold text-red-700 dark:text-red-400">
                      AI Reason: {inc.aiReason}
                    </p>
                    <p className="text-brown/60 dark:text-beige/60">
                      Target Product: <strong>{inc.productName || 'N/A'}</strong>
                    </p>
                    {inc.reviewComment && (
                      <p className="italic text-brown/70 dark:text-beige/70">
                        Text submitted: "{inc.reviewComment}"
                      </p>
                    )}
                    <p className="text-[11px] text-brown/40 dark:text-beige/40">
                      Engine: {inc.aiModelUsed || 'OpenRouter Vision'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
