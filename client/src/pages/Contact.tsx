import { useState } from 'react';
import { Mail, Phone, MessageCircle, MapPin, Clock, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const faqs = [
  { q: 'Are all products truly handmade?', a: 'Yes! Every single piece is handcrafted in small batches at our studio. No mass production, ever.' },
  { q: 'Do you take custom orders?', a: 'Absolutely. Use the contact form or the "Request Custom Design" button and we\u2019ll work with you to create something special.' },
  { q: 'How long does shipping take?', a: 'Ready-made pieces ship within 2-3 business days. Custom orders typically take 1-2 weeks depending on complexity.' },
  { q: 'What is your return / exchange policy?', a: 'Returns and exchanges must be initiated within 7 days post-delivery. We cannot accept any requests after this period. Items must be in original condition, and custom pieces are non-returnable.' },
  { q: 'Which payment methods do you accept?', a: 'We accept all major cards, UPI, netbanking and wallets through our secure Razorpay checkout.' },
];

export default function Contact() {
  usePageMeta({ title: "Contact — Manju's Atelier" });
  const { notify } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contact', form);
      notify('Thank you! We\u2019ll get back to you soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (error: unknown) {
      const e = error as { response?: { data?: { error?: string } } };
      notify(e.response?.data?.error || 'Failed to send message.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="container-x py-12">
      <header className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Get in Touch
        </span>
        <h1 className="mt-3 font-serif text-4xl text-brown-dark dark:text-beige md:text-5xl">
          We&apos;d Love to Hear From You
        </h1>
        <p className="mt-4 text-brown/70 dark:text-beige/70">
          Questions, custom requests, or just a hello, reach out anytime.
        </p>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        {/* Info + map */}
        <Reveal className="space-y-4">
          {[
            { icon: Mail, label: 'Email', value: 'help@manjusatelier.in' },
            { icon: MessageCircle, label: 'WhatsApp', value: '+91 93100 92966' },
            { icon: MapPin, label: 'Studio', value: '42 Artisan Lane, Ghaziabad, India' },
            { icon: Clock, label: 'Hours', value: 'Mon–Sat, 10am – 7pm' },
          ].map((item) => (
            <div key={item.label} className="card-surface flex items-center gap-4 p-5">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-beige/60 text-brown dark:bg-beige/10">
                <item.icon size={20} />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-brown/50 dark:text-beige/50">
                  {item.label}
                </p>
                <p className="font-medium text-brown-dark dark:text-beige">{item.value}</p>
              </div>
            </div>
          ))}
          <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-beige/40">
            <iframe
              title="Studio location"
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.openstreetmap.org/export/embed.html?bbox=77.55%2C12.95%2C77.65%2C13.02&layer=mapnik"
            />
          </div>
        </Reveal>

        {/* Form */}
        <Reveal delay={0.1}>
          <form onSubmit={submit} className="card-surface space-y-4 p-6 md:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input required value={form.name} onChange={set('name')} className="input" />
              </Field>
              <Field label="Email">
                <input required type="email" value={form.email} onChange={set('email')} className="input" />
              </Field>
            </div>
            <Field label="Subject">
              <input value={form.subject} onChange={set('subject')} className="input" />
            </Field>
            <Field label="Message">
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={set('message')}
                className="input resize-none"
              />
            </Field>
            <Button type="submit" size="lg" fullWidth disabled={loading}>
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </Reveal>
      </div>

      {/* FAQ */}
      <section id="faq" className="mx-auto mt-20 max-w-3xl scroll-mt-24">
        <h2 className="text-center font-serif text-4xl text-brown-dark dark:text-beige">
          Frequently Asked Questions
        </h2>
        <div className="mt-8 space-y-3">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="card-surface overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left"
                aria-expanded={openFaq === i}
              >
                <span className="font-medium text-brown-dark dark:text-beige">{faq.q}</span>
                <ChevronDown
                  size={20}
                  className={cn(
                    'shrink-0 text-brown transition-transform',
                    openFaq === i && 'rotate-180'
                  )}
                />
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-brown/70 dark:text-beige/70">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-brown-dark dark:text-beige">
        {label}
      </span>
      {children}
    </label>
  );
}
