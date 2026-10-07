import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useToast } from '@/components/ui/Toast';
import { Loader2, CheckCircle, Trash2, Clock } from 'lucide-react';
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

export default function AdminReviews() {
  usePageMeta({ title: "Reviews Moderation — Admin — Manju's Atelier" });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();

  const fetchPendingReviews = async () => {
    try {
      const res = await api.get<{ success: boolean; reviews: Review[] }>('/reviews/pending');
      setReviews(res.reviews);
    } catch (err: any) {
      notify(err.message || 'Failed to fetch pending reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReviews();
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brown-dark dark:text-beige">Reviews Moderation</h1>
          <p className="mt-1 text-sm text-brown/70 dark:text-beige/70">
            Review and approve offline reviews before they appear on the store.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-gold/20 px-4 py-2 text-sm font-medium text-brown-dark dark:text-beige">
          <Clock size={16} />
          {reviews.length} Pending
        </div>
      </div>

      {reviews.length === 0 ? (
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
              className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-[#1c1712] sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-brown-dark dark:text-beige">{review.name}</span>
                  <span className="text-xs text-brown/50 dark:text-beige/50">
                    • {formatDate(review.createdAt)}
                  </span>
                </div>
                {review.product && (
                  <div className="text-xs font-medium text-gold">
                    Product: {review.product.name}
                  </div>
                )}
                <Rating value={review.rating} count={0} size={16} />
                {review.comment && (
                  <p className="mt-2 text-sm text-brown/80 dark:text-beige/80 italic">
                    "{review.comment}"
                  </p>
                )}
                {review.image && (
                  <div className="mt-3">
                    <a href={review.image} target="_blank" rel="noopener noreferrer">
                      <img src={review.image} alt="Review attachment" className="h-24 w-24 rounded-lg object-cover hover:opacity-80 transition-opacity" />
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
      )}
    </div>
  );
}
