import { RotateCcw, AlertCircle, CheckCircle2, Clock, Mail } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function RefundPolicy() {
  usePageMeta({
    title: "Cancellation, Return & Refund Policy — Manju's Atelier",
    description: "Our 48-hour return window, cancellation terms, and refund policy for handcrafted goods at Manju's Atelier.",
  });

  return (
    <div className="container-x py-12 md:py-20">
      <div className="mx-auto max-w-3xl card-surface p-8 md:p-12">
        <header className="border-b border-brown/10 pb-6 dark:border-beige/10">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Customer Guarantee
          </span>
          <h1 className="mt-2 font-serif text-3xl text-brown-dark dark:text-beige md:text-4xl">
            Cancellation, Return & Refund Policy
          </h1>
          <p className="mt-2 text-xs text-brown/60 dark:text-beige/60">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </header>

        {/* Highlight cards */}
        <div className="my-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-cream/40 p-4 border border-brown/10 dark:bg-white/5 dark:border-beige/10">
            <Clock className="text-gold mb-2" size={24} />
            <h4 className="font-semibold text-sm text-brown-dark dark:text-beige">48-Hour Return Window</h4>
            <p className="text-xs text-brown/70 dark:text-beige/70 mt-1">Report damaged or incorrect items within 48 hours of delivery.</p>
          </div>
          <div className="rounded-2xl bg-cream/40 p-4 border border-brown/10 dark:bg-white/5 dark:border-beige/10">
            <RotateCcw className="text-gold mb-2" size={24} />
            <h4 className="font-semibold text-sm text-brown-dark dark:text-beige">24-Hour Cancellation</h4>
            <p className="text-xs text-brown/70 dark:text-beige/70 mt-1">Cancel before dispatch for a 100% full refund.</p>
          </div>
          <div className="rounded-2xl bg-cream/40 p-4 border border-brown/10 dark:bg-white/5 dark:border-beige/10">
            <CheckCircle2 className="text-gold mb-2" size={24} />
            <h4 className="font-semibold text-sm text-brown-dark dark:text-beige">Prompt Refunds</h4>
            <p className="text-xs text-brown/70 dark:text-beige/70 mt-1">Processed within 5-7 business days to your original payment method.</p>
          </div>
        </div>

        <div className="prose prose-brown dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-brown/85 dark:text-beige/85">
          <section>
            <h2 className="font-serif text-xl font-medium text-brown-dark dark:text-beige">
              1. Order Cancellations
            </h2>
            <p className="mt-2">
              You may cancel any standard ready-to-ship order within <strong>24 hours of placement</strong> or before the order has been handed over to our courier partner (whichever is earlier). Upon cancellation, a 100% full refund will be issued to your original payment method within 5 to 7 business days.
            </p>
            <p className="mt-2">
              Once an order is packed and dispatched with a courier tracking AWB, cancellations cannot be processed.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-brown-dark dark:text-beige">
              2. 48-Hour Return Window & Eligibility
            </h2>
            <p className="mt-2">
              At <strong>Manju's Atelier</strong>, each item is handcrafted with utmost care and checked for quality. If your product arrives damaged in transit, defective, or if an incorrect item was delivered:
            </p>
            <div className="mt-3 rounded-2xl bg-amber-500/10 p-4 border border-amber-500/20 text-xs text-brown-dark dark:text-beige space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                <AlertCircle size={16} />
                <span>Return Notice Period: Within 48 Hours of Delivery</span>
              </div>
              <p>
                You must notify our customer support team within <strong>48 hours of package delivery</strong> (as stamped by courier tracking) with an unboxing video or clear photographs of the package, shipping label, and the damaged product.
              </p>
            </div>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>Items must be unused, unaltered, and kept in their original packaging with all tags and bubble-wrap intact.</li>
              <li>Due to the nature of handmade goods, slight organic variations in resin swirl, flower placement, and wood grain are natural artistic features and are not classified as defects.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-brown-dark dark:text-beige">
              3. Non-Refundable Shipping Charges
            </h2>
            <div className="mt-2 rounded-2xl bg-cream/40 p-4 border border-brown/15 dark:bg-white/5 dark:border-beige/15">
              <p className="font-semibold text-brown-dark dark:text-beige">
                Important Policy Notice:
              </p>
              <p className="mt-1">
                <strong>Original shipping charges and return pickup shipping costs are strictly non-refundable.</strong> In the case of an approved return, the refunded amount will reflect the purchase value of the product minus the courier shipping fees incurred.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-brown-dark dark:text-beige">
              4. Customised & Personalised Products
            </h2>
            <p className="mt-2">
              <strong>Please Note:</strong> For customisable products, our team will always contact you directly to confirm all names, initials, text engravings, color preferences, and design specifications before crafting begins.
            </p>
            <p className="mt-2">
              Because custom and bespoke items are made specifically to order for an individual customer, <strong>customized and personalized products cannot be returned or cancelled once crafting has started</strong>, except in the rare instance of transit damage verified within 48 hours of delivery (in which case a replacement will be crafted for you).
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-brown-dark dark:text-beige">
              5. Refund Timeline & Processing
            </h2>
            <p className="mt-2">
              Once your return request is approved and the returned item is inspected at our studio:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Refunds are initiated within <strong>2 business days</strong> of inspection approval.</li>
              <li>The credited amount will reflect in your original payment mode (Bank Account, UPI, Debit/Credit Card) within <strong>5 to 7 business days</strong>, depending on your issuing bank.</li>
              <li>You will receive a refund confirmation notification via email and SMS with the transaction reference ID.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-brown/15 bg-cream/30 p-5 dark:border-beige/15 dark:bg-white/5">
            <div className="flex items-center gap-2 font-medium text-brown-dark dark:text-beige">
              <Mail size={18} className="text-gold" />
              <span>How to Initiate a Return</span>
            </div>
            <p className="mt-1 text-xs text-brown/75 dark:text-beige/75">
              To submit a return request, please email us at <a href="mailto:help@manjusatelier.in" className="text-gold hover:underline">help@manjusatelier.in</a> or message our WhatsApp support at <a href="https://wa.me/919310092966" className="text-gold hover:underline">+91 93100 92966</a> within 48 hours of delivery with your <strong>Order ID</strong> and <strong>unboxing photos/video</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
