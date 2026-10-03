import { Link } from 'react-router-dom';
// import { useState } from 'react';
import { Instagram, Facebook, Mail, MapPin, Phone } from 'lucide-react';

const XIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);
// import { Button } from '@/components/ui/Button';
// import { useToast } from '@/components/ui/Toast';

const columns = [
  {
    title: 'Explore',
    links: [
      { label: 'Shop All', to: '/shop' },
      { label: 'Categories', to: '/categories' },
      { label: 'About Us', to: '/about' },
      { label: 'Custom Orders', to: '/shop?category=custom-orders' },
      { label: 'Leave a Review', to: '/offline-review' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact', to: '/contact' },
      { label: 'FAQ', to: '/contact#faq' },
      { label: 'Shipping', to: '/contact' },
      { label: 'Returns', to: '/contact' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Our Story', to: '/about' },
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms', to: '/contact' },
    ],
  },
];

export function Footer() {
  /*
  const { notify } = useToast();
  const [email, setEmail] = useState('');

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      notify('Thank you for subscribing!');
      setEmail('');
    }
  };
  */

  return (
    <footer className="mt-20 bg-brown-dark text-beige">
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-5">
        {/* Brand + newsletter */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <img
              src="/logo-256.png"
              alt="Manju's Atelier logo"
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover ring-1 ring-gold/40"
            />
            <span className="font-serif text-2xl text-cream">Manju&apos;s Atelier</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-beige/70">
            Handcrafted with love, made to last. Every piece is created in small batches with care,
            intention, and a story worth sharing.
          </p>
          <div className="mt-6 rounded-xl bg-cream/5 p-4 max-w-sm ring-1 ring-cream/10">
            <h5 className="font-serif text-cream">Bulk Orders</h5>
            <p className="mt-1 text-xs text-beige/70">
              Planning a corporate event or wedding? For bulk orders, please{' '}
              <Link to="/bulk-orders" className="text-gold hover:underline font-medium">
                contact us here
              </Link>.
            </p>
          </div>

          {/* 
          <form onSubmit={subscribe} className="mt-6 max-w-sm">
            <label htmlFor="newsletter" className="text-sm font-medium text-cream">
              Join our newsletter
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="newsletter"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 rounded-full bg-cream/10 px-4 py-2.5 text-sm text-cream outline-none ring-1 ring-cream/20 placeholder:text-beige/50 focus:ring-gold"
              />
              <Button type="submit" variant="gold" size="sm">
                Subscribe
              </Button>
            </div>
          </form>
          */}
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-1 lg:col-span-3">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-serif text-lg text-cream">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-beige/70 transition-colors hover:text-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-sm text-beige/60 md:flex-row">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} /> Bengaluru, India
            </span>
            <span className="flex items-center gap-1.5">
              <Phone size={14} /> +91 93100 92966
            </span>
            <span className="flex items-center gap-1.5">
              <Mail size={14} /> help@manjusatelier.in
            </span>
          </div>
          <div className="flex items-center gap-3">
            {[
              { Icon: Instagram, href: 'https://www.instagram.com/manjusatelier' },
              { Icon: Facebook, href: 'https://www.facebook.com/manjusatelier' },
              { Icon: XIcon, href: 'https://x.com/manjusatelier' },
            ].map(({ Icon, href }, i) => (
              <a
                key={i}
                href={href}
                target={href !== '#' ? '_blank' : undefined}
                rel={href !== '#' ? 'noopener noreferrer' : undefined}
                aria-label="Social link"
                className="grid h-9 w-9 place-items-center rounded-full bg-cream/10 transition-colors hover:bg-gold hover:text-brown-dark"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 pb-6 text-xs text-beige/40 md:flex-row md:gap-4">
          <p>© {new Date().getFullYear()} Manju's Atelier. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/track" className="hover:text-gold transition-colors font-medium">
              Track Order
            </Link>
            <span>|</span>
            <Link to="/terms" className="hover:text-gold transition-colors">
              Terms & Conditions
            </Link>
            <span>|</span>
            <Link to="/privacy" className="hover:text-gold transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
