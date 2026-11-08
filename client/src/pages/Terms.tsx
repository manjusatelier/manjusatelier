import { usePageMeta } from '@/hooks/usePageMeta';

export default function Terms() {
  usePageMeta({
    title: 'Terms & Conditions',
    description: 'Terms, conditions, and policies for Manju\'s Atelier.',
  });

  return (
    <div className="container-x py-24 md:py-32">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 font-serif text-4xl text-brown-dark md:text-5xl dark:text-beige">
          Terms & Conditions
        </h1>

        <div className="prose prose-brown dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-brown-dark dark:text-beige">
              1. Acceptance of Terms
            </h2>
            <p className="text-brown/80 dark:text-beige/80">
              By accessing and using the website of Manju's Atelier, you accept and agree to be bound by the terms and provision of this agreement. Any participation in this service will constitute acceptance of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-brown-dark dark:text-beige">
              2. Product Descriptions & Handmade Variations
            </h2>
            <p className="text-brown/80 dark:text-beige/80">
              All items at Manju's Atelier are meticulously handcrafted. Due to the nature of handmade goods, slight variations in color, texture, and size are to be expected and celebrated as part of the unique charm of the craft. These natural variations are not considered defects.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-brown-dark dark:text-beige">
              3. Pricing & Payments
            </h2>
            <p className="text-brown/80 dark:text-beige/80">
              All prices displayed on our website are in Indian Rupees (INR ₹) inclusive of applicable taxes unless stated otherwise. We accept payments through secure online payment gateway services (supporting UPI Apps like Google Pay, PhonePe, Paytm, CRED, Debit/Credit Cards from Visa, Mastercard, RuPay, and Net Banking), as well as direct UPI transfers with UTR verification.
              <br /><br />
              All online payment processing is encrypted with industry-standard 256-bit SSL protocols. In the case of manual UPI payments, orders are placed on hold and confirmed once the 12-digit UTR is verified by our team.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-brown-dark dark:text-beige">
              4. Shipping & Delivery Terms
            </h2>
            <p className="text-brown/80 dark:text-beige/80">
              Standard ready-to-ship products are dispatched within 2 to 4 business days. Customized or personalized creations require 7 to 10 business days for handcrafting and curing. Once dispatched, domestic delivery across India typically takes between 4 to 7 business days depending on customer location.
              <br /><br />
              Standard domestic shipping is charged at a flat ₹79 for orders under ₹1499, and free shipping is offered on orders of ₹1499 and above. <strong>Please note that shipping charges are strictly non-refundable under all circumstances once an order has been dispatched.</strong> For complete details, please review our dedicated <a href="/shipping-policy" className="text-gold underline">Shipping & Delivery Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-brown-dark dark:text-beige">
              5. Cancellations, Returns & Refunds (48-Hour Return Window)
            </h2>
            <p className="text-brown/80 dark:text-beige/80">
              <strong>Order Cancellations:</strong> You may cancel any ready-made order within 24 hours of placing it (or before courier dispatch) for a 100% full refund.
              <br /><br />
              <strong>48-Hour Return Window:</strong> Customers may submit a return or replacement request within <strong>48 hours of delivery</strong> if an item arrives damaged in transit, defective, or incorrect. Unboxing photos or video evidence must be provided via email or WhatsApp within 48 hours of delivery.
              <br /><br />
              <strong>Non-Refundable Shipping:</strong> Shipping charges incurred are strictly non-refundable. Approved refunds will cover the product purchase price minus any courier shipping costs.
              <br /><br />
              <strong>Customisable & Personalized Products:</strong> For customisable products, our team will always contact you directly to confirm all customization details, names, and color requirements before crafting begins. Due to the bespoke nature of these products, customized items are non-returnable and non-refundable unless damaged upon arrival.
              <br /><br />
              <strong>Refund Settlement:</strong> Approved refunds are initiated within 2 business days and credited to the customer's original payment method within 5 to 7 business days. For full terms, please visit our <a href="/refund-policy" className="text-gold underline">Refund & Return Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-brown-dark dark:text-beige">
              6. Intellectual Property
            </h2>
            <p className="text-brown/80 dark:text-beige/80">
              All content on this website, including but not limited to designs, text, graphics, logos, photos, and handcrafted patterns, is the property of Manju's Atelier. Unauthorized use, commercial reproduction, or imitation of our designs is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-brown-dark dark:text-beige">
              7. Contact & Operational Address
            </h2>
            <p className="text-brown/80 dark:text-beige/80">
              For any legal notices, queries, or assistance, you can reach out to us at:
              <br />
              <strong>Entity Name:</strong> Manju's Atelier
              <br />
              <strong>Studio Location:</strong> Ghaziabad, Uttar Pradesh, India
              <br />
              <strong>Customer Support Email:</strong> help@manjusatelier.in
              <br />
              <strong>WhatsApp / Support Phone:</strong> +91 93100 92966
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
