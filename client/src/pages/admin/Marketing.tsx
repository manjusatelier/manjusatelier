import { useState } from 'react';
import { Send, Loader2, Megaphone, QrCode, Download, Printer, Settings2, ExternalLink, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const DEFAULT_HEADLINE = 'Loved Our Handcrafted Creations?';
const DEFAULT_MESSAGE = `Every stitch, petal, and craft is made by hand with immense love and care.

As a homegrown artisan studio, your review means the world to us! Taking just 30 seconds to share your experience helps us reach more handmade craft lovers across India.`;

export default function Marketing() {
  usePageMeta({ title: "Marketing — Admin — Manju's Atelier" });
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    couponCode: '',
    discountPercentage: '',
  });

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [qrConfig, setQrConfig] = useState({
    headline: DEFAULT_HEADLINE,
    message: DEFAULT_MESSAGE,
    stallName: '',
  });

  const reviewUrl = `${window.location.origin}/offline-review`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        headline: qrConfig.headline,
        message: qrConfig.message,
        stallName: qrConfig.stallName,
        targetUrl: reviewUrl,
      });
      if (token) params.set('token', token);

      const response = await fetch(`/api/admin/marketing/stall-qr-pdf?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF. Please try again.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manjus-atelier-stall-review-qr${qrConfig.stallName ? `-${qrConfig.stallName.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : ''}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      notify('Printable A4 PDF downloaded successfully!', 'success');
    } catch (err: unknown) {
      const error = err as Error;
      notify(error.message || 'Failed to download PDF', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrintFlyer = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    if (!printWindow) {
      notify('Please allow popups to open the print view', 'error');
      return;
    }

    const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=10&data=${encodeURIComponent(reviewUrl)}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Manju's Atelier — Stall Review QR Standee Flyer</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Plus Jakarta Sans', sans-serif;
              background-color: #fcfaf5;
              color: #2d2015;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .flyer-container {
              width: 100%;
              max-width: 650px;
              background: #fcfaf5;
              border: 3px solid #b8860b;
              padding: 32px 24px;
              position: relative;
              text-align: center;
              box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            }
            .inner-frame {
              border: 1px solid #d8c1a6;
              padding: 24px 20px;
              position: relative;
            }
            .brand-title {
              font-family: 'Playfair Display', Georgia, serif;
              font-size: 20px;
              font-weight: 700;
              letter-spacing: 4px;
              color: #b8860b;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .brand-subtitle {
              font-size: 11px;
              font-style: italic;
              color: #695241;
              letter-spacing: 1px;
              margin-bottom: 12px;
            }
            .divider {
              width: 120px;
              height: 1.5px;
              background: #c19b6c;
              margin: 0 auto 16px;
              position: relative;
            }
            .divider::after {
              content: '◆';
              position: absolute;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              background: #fcfaf5;
              padding: 0 6px;
              font-size: 9px;
              color: #b8860b;
            }
            .stall-badge {
              display: inline-block;
              font-size: 10px;
              font-weight: 700;
              color: #b8860b;
              letter-spacing: 2px;
              border: 1px dashed #c19b6c;
              padding: 4px 14px;
              border-radius: 9999px;
              margin-bottom: 14px;
              background: rgba(193, 155, 108, 0.08);
            }
            .headline {
              font-family: 'Playfair Display', Georgia, serif;
              font-size: 26px;
              font-weight: 700;
              color: #2d2015;
              line-height: 1.25;
              margin-bottom: 12px;
            }
            .message {
              font-size: 12px;
              line-height: 1.6;
              color: #604c3d;
              max-width: 480px;
              margin: 0 auto 20px;
              white-space: pre-line;
            }
            .qr-card {
              background: #ffffff;
              border: 1.5px solid #d8c1a6;
              border-radius: 16px;
              padding: 16px 20px;
              display: inline-block;
              margin: 0 auto 20px;
              box-shadow: 0 4px 14px rgba(45, 32, 21, 0.06);
            }
            .qr-tag {
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 1.5px;
              color: #b8860b;
              text-transform: uppercase;
              margin-bottom: 10px;
            }
            .qr-img {
              width: 190px;
              height: 190px;
              display: block;
              margin: 0 auto;
            }
            .scan-hint {
              font-size: 11px;
              color: #2d2015;
              font-weight: 500;
              margin-top: 10px;
            }
            .url-hint {
              font-size: 10px;
              color: #b8860b;
              font-weight: 600;
              margin-top: 3px;
            }
            .social-highlight {
              font-size: 12px;
              font-weight: 700;
              color: #2d2015;
              margin-bottom: 6px;
            }
            .social-info {
              font-size: 11px;
              color: #695241;
              margin-bottom: 10px;
            }
            .thank-you {
              font-size: 12px;
              font-weight: 700;
              color: #b8860b;
              letter-spacing: 0.5px;
            }
            @media print {
              body {
                background: none;
              }
              .flyer-container {
                box-shadow: none;
                border-width: 2.5px;
                max-width: 100%;
                width: 100%;
                height: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="flyer-container">
            <div class="inner-frame">
              <div class="brand-title">M A N J U ' S &nbsp; A T E L I E R</div>
              <div class="brand-subtitle">Handcrafted with Love &bull; Pure Indian Artistry</div>
              <div class="divider"></div>

              ${qrConfig.stallName ? `<div class="stall-badge">[ ${qrConfig.stallName.toUpperCase()} ]</div>` : ''}

              <h1 class="headline">${qrConfig.headline}</h1>
              <p class="message">${qrConfig.message}</p>

              <div class="qr-card">
                <div class="qr-tag">&#9733; SCAN TO REVIEW & GET FEATURED &#9733;</div>
                <img src="${qrImageSrc}" alt="Review QR Code" class="qr-img" />
                <div class="scan-hint">Point your smartphone camera to scan</div>
                <div class="url-hint">manjusatelier.in/offline-review</div>
              </div>

              <div class="social-highlight">Share photos of your craft to get featured on our Instagram!</div>
              <div class="social-info">Instagram: @manjusatelier &nbsp;|&nbsp; Website: www.manjusatelier.in</div>
              <div class="thank-you">Thank You for Supporting Local & Handmade Artistry!</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      notify('Title and content are required', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to send this email to all subscribed users?')) return;

    setLoading(true);
    try {
      const res = await api.post<{ success: boolean; message: string; count: number }>('/admin/marketing/broadcast', {
        ...formData,
        discountPercentage: formData.discountPercentage ? Number(formData.discountPercentage) : undefined,
      });
      notify(res.message, 'success');
      setFormData({ title: '', content: '', couponCode: '', discountPercentage: '' });
    } catch (err: unknown) {
      const error = err as Error;
      notify(error.message || 'Failed to send broadcast', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brown-dark dark:text-beige">Marketing & Broadcasts</h1>
          <p className="mt-1 text-sm text-brown/70 dark:text-beige/70">
            Send promotional announcements, manage offline stall review standees, and connect with customers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-[#1c1712]">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-brown-dark dark:text-beige">
                  Email Subject / Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Flash Sale! Get 20% Off"
                  className="w-full rounded-xl border-none bg-cream px-4 py-3 text-brown-dark outline-none focus:ring-2 focus:ring-gold dark:bg-[#2c2621] dark:text-beige"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-brown-dark dark:text-beige">
                  Email Content *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Describe your offer, new collection, or announcement..."
                  className="w-full resize-none rounded-xl border-none bg-cream px-4 py-3 text-brown-dark outline-none focus:ring-2 focus:ring-gold dark:bg-[#2c2621] dark:text-beige"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-brown-dark dark:text-beige">
                    Coupon Code (Optional)
                  </label>
                  <input
                    type="text"
                    name="couponCode"
                    value={formData.couponCode}
                    onChange={handleChange}
                    placeholder="e.g. SUMMER20"
                    className="w-full rounded-xl border-none bg-cream px-4 py-3 text-brown-dark outline-none focus:ring-2 focus:ring-gold dark:bg-[#2c2621] dark:text-beige"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-brown-dark dark:text-beige">
                    Discount Percentage (Optional)
                  </label>
                  <input
                    type="number"
                    name="discountPercentage"
                    value={formData.discountPercentage}
                    onChange={handleChange}
                    placeholder="e.g. 20"
                    min="1"
                    max="100"
                    className="w-full rounded-xl border-none bg-cream px-4 py-3 text-brown-dark outline-none focus:ring-2 focus:ring-gold dark:bg-[#2c2621] dark:text-beige"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 font-medium text-brown-dark transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-5 w-5" /> Send Broadcast
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl bg-cream/50 p-6 dark:bg-[#1c1712]/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gold/20 text-gold rounded-full">
                <Megaphone className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl text-brown-dark dark:text-beige">Important info</h3>
            </div>
            <ul className="space-y-4 text-sm text-brown/70 dark:text-beige/70">
              <li>• Emails are only sent to users who have opted into promotional emails.</li>
              <li>• A legally compliant "Unsubscribe" link is automatically appended to the bottom of all promotional emails.</li>
              <li>• Emails are sent in batches to prevent server overload. Please wait while the broadcast processes.</li>
            </ul>
          </div>

          {/* Offline Stall QR & Standee Flyer Card */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-[#1c1712]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gold/20 text-gold rounded-full">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-brown-dark dark:text-beige">Offline Stall QR Flyer</h3>
                  <p className="text-xs text-brown/60 dark:text-beige/60">Printable A4 standee for counters & stalls</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-brown/70 dark:text-beige/70 mb-4 leading-relaxed">
              Print this standee flyer for your physical stalls. It includes a warm feedback request asking customers to review your handcrafted creations.
            </p>

            {/* Live Standee Preview Box */}
            <div className="relative rounded-xl border-2 border-gold/40 bg-[#fcfaf5] p-5 text-center text-brown-dark shadow-inner dark:bg-[#251f19] dark:text-beige dark:border-gold/30">
              <div className="rounded-lg border border-gold/30 p-4">
                <p className="font-serif text-[11px] font-bold tracking-[2px] text-gold uppercase">
                  M A N J U ' S &nbsp; A T E L I E R
                </p>
                <p className="text-[9px] italic text-brown/60 dark:text-beige/60 mt-0.5">
                  Handcrafted with Love • Pure Artistry
                </p>

                {qrConfig.stallName && (
                  <span className="mt-2 inline-block rounded-full bg-gold/15 px-2.5 py-0.5 text-[9px] font-bold text-brown-dark dark:text-gold uppercase tracking-wider">
                    {qrConfig.stallName}
                  </span>
                )}

                <h4 className="mt-2.5 font-serif text-sm font-bold text-brown-dark dark:text-beige leading-snug">
                  {qrConfig.headline}
                </h4>

                <p className="mt-1.5 text-[10px] text-brown/70 dark:text-beige/70 leading-relaxed line-clamp-3">
                  {qrConfig.message}
                </p>

                {/* QR Box in Preview */}
                <div className="my-3 inline-flex flex-col items-center rounded-xl border border-brown/10 bg-white p-3 shadow-sm dark:bg-white">
                  <span className="text-[8px] font-bold text-brown uppercase tracking-wider mb-1">
                    ★ Scan with Phone Camera ★
                  </span>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(reviewUrl)}`} 
                    alt="Offline Review QR" 
                    className="w-24 h-24" 
                  />
                  <span className="mt-1 text-[8px] font-semibold text-gold">
                    manjusatelier.in/offline-review
                  </span>
                </div>

                <p className="text-[9px] font-semibold text-brown-dark dark:text-beige">
                  Tag us on Instagram: @manjusatelier
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-semibold text-brown-dark transition-all hover:bg-gold-light hover:shadow disabled:opacity-50"
              >
                {downloadingPdf ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Generating PDF...
                  </>
                ) : (
                  <>
                    <Download size={15} /> Download PDF (A4)
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrintFlyer}
                className="flex items-center justify-center gap-2 rounded-xl border border-brown/20 bg-cream/50 px-4 py-2.5 text-xs font-semibold text-brown-dark transition-colors hover:bg-cream dark:border-beige/20 dark:bg-[#2c2621] dark:text-beige dark:hover:bg-[#342e28]"
              >
                <Printer size={15} /> Print Flyer
              </button>
            </div>

            {/* Customization Toggle */}
            <div className="mt-4 border-t border-brown/10 pt-3 dark:border-beige/10">
              <button
                type="button"
                onClick={() => setCustomizing(!customizing)}
                className="flex w-full items-center justify-between text-xs font-medium text-brown/70 hover:text-brown dark:text-beige/70 dark:hover:text-beige"
              >
                <span className="flex items-center gap-1.5">
                  <Settings2 size={13} className="text-gold" /> Customise Headline & Message
                </span>
                {customizing ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {customizing && (
                <div className="mt-3 space-y-3 rounded-xl border border-brown/10 bg-cream/40 p-3 text-xs dark:border-beige/10 dark:bg-[#251f19]">
                  <div>
                    <label className="block text-[11px] font-medium text-brown-dark dark:text-beige mb-1">
                      Stall / Exhibition Event Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dastkar Crafts Bazaar, Stall #14"
                      value={qrConfig.stallName}
                      onChange={(e) => setQrConfig({ ...qrConfig, stallName: e.target.value })}
                      className="w-full rounded-lg border border-brown/20 bg-white px-3 py-1.5 text-xs outline-none focus:border-gold dark:border-beige/20 dark:bg-[#1c1712] dark:text-beige"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-brown-dark dark:text-beige mb-1">
                      Flyer Headline
                    </label>
                    <input
                      type="text"
                      value={qrConfig.headline}
                      onChange={(e) => setQrConfig({ ...qrConfig, headline: e.target.value })}
                      className="w-full rounded-lg border border-brown/20 bg-white px-3 py-1.5 text-xs outline-none focus:border-gold dark:border-beige/20 dark:bg-[#1c1712] dark:text-beige"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-brown-dark dark:text-beige mb-1">
                      Customer Review Request Message
                    </label>
                    <textarea
                      rows={3}
                      value={qrConfig.message}
                      onChange={(e) => setQrConfig({ ...qrConfig, message: e.target.value })}
                      className="w-full resize-none rounded-lg border border-brown/20 bg-white px-3 py-1.5 text-xs outline-none focus:border-gold dark:border-beige/20 dark:bg-[#1c1712] dark:text-beige"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setQrConfig({ headline: DEFAULT_HEADLINE, message: DEFAULT_MESSAGE, stallName: '' })}
                    className="flex items-center gap-1 text-[11px] text-brown/60 hover:text-brown dark:text-beige/60 dark:hover:text-beige"
                  >
                    <RotateCcw size={11} /> Reset to Default
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3 text-right">
              <a
                href="/offline-review"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-brown/60 hover:text-gold dark:text-beige/60"
              >
                Test feedback page <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

