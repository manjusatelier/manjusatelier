import { Truck, Clock, ShieldCheck, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function ShippingPolicy() {
  usePageMeta({
    title: "Shipping & Delivery Policy — Manju's Atelier",
    description: "Detailed shipping timelines, delivery process, and courier information for Manju's Atelier.",
  });

  return (
    <div className="container-x py-12 md:py-20">
      <div className="mx-auto max-w-3xl card-surface p-8 md:p-12">
        <header className="border-b border-brown/10 pb-6 dark:border-beige/10">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Transparent & Reliable
          </span>
          <h1 className="mt-2 font-serif text-3xl text-brown-dark dark:text-beige md:text-4xl">
            Shipping & Delivery Policy
          </h1>
          <p className="mt-2 text-xs text-brown/60 dark:text-beige/60">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </header>

        {/* Highlights / Badges */}
        <div className="my-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-cream/40 p-4 border border-brown/10 dark:bg-white/5 dark:border-beige/10">
            <Clock className="text-gold mb-2" size={24} />
            <h4 className="font-semibold text-sm text-brown-dark dark:text-beige">Dispatched in 2-4 Days</h4>
            <p className="text-xs text-brown/70 dark:text-beige/70 mt-1">Each artisan piece is packed with immense care.</p>
          </div>
          <div className="rounded-2xl bg-cream/40 p-4 border border-brown/10 dark:bg-white/5 dark:border-beige/10">
            <Truck className="text-gold mb-2" size={24} />
            <h4 className="font-semibold text-sm text-brown-dark dark:text-beige">All-India Delivery</h4>
            <p className="text-xs text-brown/70 dark:text-beige/70 mt-1">Shipped via trusted courier partners across India.</p>
          </div>
          <div className="rounded-2xl bg-cream/40 p-4 border border-brown/10 dark:bg-white/5 dark:border-beige/10">
            <ShieldCheck className="text-gold mb-2" size={24} />
            <h4 className="font-semibold text-sm text-brown-dark dark:text-beige">Tracked Shipments</h4>
            <p className="text-xs text-brown/70 dark:text-beige/70 mt-1">Real-time SMS & email tracking on every order.</p>
          </div>
        </div>

        <div className="prose prose-brown dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-brown/85 dark:text-beige/85">
          <section>
            <h2 className="font-serif text-xl font-medium text-brown-dark dark:text-beige">
              1. Order Processing & Crafting Times
            </h2>
            <p className="mt-2">
              Every creation at <strong>Manju's Atelier</strong> is handmade in small batches using premium materials (epoxy resin, preserved florals, wood, and handcrafted textiles). 
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>Ready-to-Ship Products:</strong> Processed and packed within <strong>2 to 4 business days</strong>.</li>
              <li><strong>Custom / Personalized Products:</strong> Take <strong>7 to 10 business days</strong> to craft, cure, and personalize. <em>For customisable products, our team will personally contact you via WhatsApp or phone to confirm all your customized names, initials, color palettes, and design details before crafting begins.</em></li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-brown-dark dark:text-beige">
              2. Delivery Timelines Across India
            </h2>
            <p className="mt-2">
              Once handed over to our courier partners, delivery takes:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>Metro Cities & NCR:</strong> 3 to 5 business days post-dispatch.</li>
              <li><strong>Rest of India:</strong> 4 to 7 business days post-dispatch.</li>
              <li><strong>Remote / North-East Regions:</strong> 6 to 10 business days post-dispatch.</li>
            </ul>
            <p className="mt-2 text-xs text-brown/60 dark:text-beige/60">
              *Business days exclude Sundays and national public holidays. Delivery timelines may occasionally be impacted by weather conditions, festival surges, or regional courier constraints.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-brown-dark dark:text-beige">
              3. Shipping Charges
            </h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>Standard Shipping:</strong> A flat fee of <strong>₹79</strong> is applicable on orders below ₹1499.</li>
              <li><strong>Free Shipping:</strong> Automatically applied to all domestic orders of <strong>₹1499 and above</strong>.</li>
              <li className="font-semibold text-brown-dark dark:text-beige"><strong>Non-Refundable Shipping:</strong> Please note that all shipping fees are strictly non-refundable under all circumstances once an order has been dispatched.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-brown-dark dark:text-beige">
              4. Order Tracking
            </h2>
            <p className="mt-2">
              As soon as your package is dispatched from our Ghaziabad studio, you will receive an email and WhatsApp/SMS alert with your unique <strong>AWB Tracking Number</strong> and direct tracking link. You can also track your order status anytime on our <Link to="/track" className="text-gold font-medium hover:underline">Order Tracking Page</Link>.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-brown-dark dark:text-beige">
              5. Packaging & Transit Safety
            </h2>
            <p className="mt-2">
              Because resin and handcrafted crafts are delicate, all items are secured with multi-layer bubble wrap, protective corner guards, and rigid carton boxes. In the rare event of damage in transit, please report it within <strong>48 hours of delivery</strong> as outlined in our <Link to="/refund-policy" className="text-gold font-medium hover:underline">Refund & Return Policy</Link>.
            </p>
          </section>

          <section className="rounded-2xl border border-brown/15 bg-cream/30 p-5 dark:border-beige/15 dark:bg-white/5">
            <div className="flex items-center gap-2 font-medium text-brown-dark dark:text-beige">
              <HelpCircle size={18} className="text-gold" />
              <span>Questions About Your Shipment?</span>
            </div>
            <p className="mt-1 text-xs text-brown/75 dark:text-beige/75">
              Email us at <a href="mailto:help@manjusatelier.in" className="text-gold hover:underline">help@manjusatelier.in</a> or message us on WhatsApp at <a href="https://wa.me/919310092966" className="text-gold hover:underline">+91 93100 92966</a> (8:00 AM – 10:00 PM Daily).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
