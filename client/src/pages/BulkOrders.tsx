import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Mail, MessageCircle, Building, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function BulkOrders() {
  const [searchParams] = useSearchParams();
  const initialProduct = searchParams.get('product') || '';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    productsOfInterest: initialProduct,
    expectedQuantity: '',
    details: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      await api.post('/contact/bulk-order', formData);
      setStatus('success');
    } catch (error: any) {
      console.error('Bulk order submission error:', error);
      setStatus('error');
      setErrorMessage(error.response?.data?.error || 'Failed to submit inquiry. Please try again.');
    }
  };

  return (
    <div className="container-x py-16">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="font-serif text-4xl text-brown-dark md:text-5xl">Bulk Orders</h1>
        <p className="mx-auto mt-4 max-w-2xl text-brown/80 text-lg">
          Planning a corporate event, wedding, or need customized gifts in large quantities? 
          We'd love to help you bring your vision to life.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-5xl gap-12 lg:grid-cols-[1fr_2fr]">
        {/* Contact Info */}
        <div className="space-y-8">
          <div>
            <h3 className="font-serif text-2xl text-brown-dark">Get in Touch</h3>
            <p className="mt-2 text-brown/80">
              Fill out the form, and our team will get back to you within 24-48 hours to discuss your requirements.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                <Mail size={24} />
              </div>
              <div>
                <p className="font-medium text-brown-dark">Email Us</p>
                <a href="mailto:queries@manjusatelier.in" className="text-brown/80 hover:text-gold transition-colors">
                  queries@manjusatelier.in
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                <MessageCircle size={24} />
              </div>
              <div>
                <p className="font-medium text-brown-dark">WhatsApp</p>
                <a href="https://wa.me/919310092966" target="_blank" rel="noopener noreferrer" className="text-brown/80 hover:text-gold transition-colors">
                  +91 93100 92966
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                <Building size={24} />
              </div>
              <div>
                <p className="font-medium text-brown-dark">Business Hours</p>
                <p className="text-brown/80">8:00 AM – 10:00 PM, Daily</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-xl bg-beige p-6 border border-brown/10">
            <h4 className="font-medium text-brown-dark mb-2">Customizable Products Note</h4>
            <p className="text-sm text-brown/80">
              For customizable products, please submit your request and our team will contact you directly to discuss specific details, designs, and personalization options.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-8">
          {status === 'success' ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-500">
                <CheckCircle size={40} />
              </div>
              <h3 className="font-serif text-3xl text-brown-dark">Thank You!</h3>
              <p className="mt-4 max-w-md text-lg text-brown/80">
                We've received your bulk order inquiry. An acknowledgment email has been sent to your address. Our team will review your requirements and get back to you shortly!
              </p>
              <Button
                className="mt-8"
                onClick={() => setStatus('idle')}
                variant="secondary"
              >
                Submit Another Inquiry
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-brown-dark">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-brown/20 px-4 py-2.5 text-brown outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-brown-dark">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-brown/20 px-4 py-2.5 text-brown outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-brown-dark">
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-brown/20 px-4 py-2.5 text-brown outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold"
                    placeholder="+91 93100 92966"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="organization" className="text-sm font-medium text-brown-dark">
                    Organization / Company
                  </label>
                  <input
                    id="organization"
                    name="organization"
                    type="text"
                    value={formData.organization}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-brown/20 px-4 py-2.5 text-brown outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold"
                    placeholder="Your Company (Optional)"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="productsOfInterest" className="text-sm font-medium text-brown-dark">
                    Products of Interest *
                  </label>
                  <input
                    id="productsOfInterest"
                    name="productsOfInterest"
                    type="text"
                    required
                    value={formData.productsOfInterest}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-brown/20 px-4 py-2.5 text-brown outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold"
                    placeholder="e.g. Candles, Lip Balms"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="expectedQuantity" className="text-sm font-medium text-brown-dark">
                    Expected Quantity
                  </label>
                  <input
                    id="expectedQuantity"
                    name="expectedQuantity"
                    type="text"
                    value={formData.expectedQuantity}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-brown/20 px-4 py-2.5 text-brown outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold"
                    placeholder="e.g. 50-100 units"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="details" className="text-sm font-medium text-brown-dark">
                  Additional Details & Requirements
                </label>
                <textarea
                  id="details"
                  name="details"
                  rows={5}
                  value={formData.details}
                  onChange={handleChange}
                  className="w-full resize-none rounded-lg border border-brown/20 px-4 py-3 text-brown outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold"
                  placeholder="Tell us more about your event, timeline, or any specific customization requirements..."
                />
              </div>

              {status === 'error' && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Submitting...' : 'Submit Inquiry'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
