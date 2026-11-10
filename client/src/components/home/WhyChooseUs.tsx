import { Hand, Leaf, Heart, PenTool, Truck, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionHeading } from './SectionHeading';
import { staggerContainer, staggerItem } from '@/components/ui/Reveal';

const features = [
  { icon: Hand, title: '100% Handmade', desc: 'Every piece crafted by hand, never mass-produced.' },
  { icon: Leaf, title: 'Eco Friendly', desc: 'Thoughtfully sourced, sustainable materials.' },
  { icon: Heart, title: 'Made with Love', desc: 'Care and intention poured into every detail.' },
  { icon: PenTool, title: 'Custom Orders', desc: 'Personalised creations made just for you.' },
  { icon: Truck, title: 'Fast Delivery', desc: 'Carefully packaged and shipped across India.' },
  { icon: ShieldCheck, title: 'Secure Payments', desc: 'Safe checkout powered by Cashfree Payments.' },
];

export function WhyChooseUs() {
  return (
    <section className="section container-x">
      <SectionHeading eyebrow="Why Manju's Atelier" title="Crafted Differently" />
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {features.map((f) => (
          <motion.div
            key={f.title}
            variants={staggerItem}
            className="card-surface flex items-start gap-4 p-6 transition-shadow hover:shadow-lift"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-beige/60 text-brown dark:bg-beige/10">
              <f.icon size={22} />
            </span>
            <div>
              <h3 className="font-serif text-xl text-brown-dark dark:text-beige">{f.title}</h3>
              <p className="mt-1 text-sm text-brown/60 dark:text-beige/60">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
