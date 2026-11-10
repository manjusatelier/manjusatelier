import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CreditCard, ShieldCheck, Zap, ArrowRight, Smartphone } from 'lucide-react';
import { Button } from './Button';

const STORAGE_KEY = 'manjus_release_note_cashfree_v1';

export function ReleaseNoteModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen this release note
    const hasSeen = localStorage.getItem(STORAGE_KEY);
    if (!hasSeen) {
      // Show after a brief delay for a polished experience
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1f1914] sm:p-8 z-10 border border-gold/20"
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              aria-label="Close announcement"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-beige/60 text-brown transition hover:bg-beige dark:bg-white/10 dark:text-beige dark:hover:bg-white/20"
            >
              <X size={18} />
            </button>

            {/* Header Badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold-dark dark:text-gold">
                <Sparkles size={14} className="text-gold" />
                What's New in Manju's Atelier
              </span>
            </div>

            {/* Title */}
            <h2 className="mt-4 font-serif text-2xl font-normal text-brown-dark dark:text-beige sm:text-3xl">
              Instant Online Payments Are Live!
            </h2>

            <p className="mt-2 text-sm text-brown/70 dark:text-beige/70 leading-relaxed">
              We&apos;ve upgraded our checkout experience! You can now complete your orders instantly and securely with zero wait time.
            </p>

            {/* Features List */}
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3.5 rounded-2xl bg-beige/30 p-3.5 dark:bg-white/5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-brown-dark dark:text-beige">
                    All Major UPI Apps
                  </h3>
                  <p className="text-xs text-brown/70 dark:text-beige/70 mt-0.5">
                    Pay seamlessly with Google Pay, PhonePe, Paytm, CRED & BHIM.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl bg-beige/30 p-3.5 dark:bg-white/5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-brown-dark dark:text-beige">
                    Cards & Net Banking
                  </h3>
                  <p className="text-xs text-brown/70 dark:text-beige/70 mt-0.5">
                    Debit & Credit Cards (Visa, Mastercard, RuPay) plus 50+ Net Banking options.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl bg-beige/30 p-3.5 dark:bg-white/5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest/15 text-forest">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-brown-dark dark:text-beige">
                    Instant Automatic Confirmation
                  </h3>
                  <p className="text-xs text-brown/70 dark:text-beige/70 mt-0.5">
                    Orders are verified immediately—no need to wait for manual verification or enter 12-digit UTR numbers!
                  </p>
                </div>
              </div>
            </div>

            {/* Footer / CTA */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-brown/10 dark:border-beige/10">
              <p className="flex items-center gap-1.5 text-xs text-brown/50 dark:text-beige/50">
                <ShieldCheck size={14} className="text-forest" />
                100% Encrypted & RBI Authorized
              </p>
              <Button onClick={handleDismiss} size="lg" className="w-full sm:w-auto">
                <span>Start Shopping</span>
                <ArrowRight size={16} className="ml-1.5" />
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

