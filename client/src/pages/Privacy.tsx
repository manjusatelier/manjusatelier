import { usePageMeta } from '@/hooks/usePageMeta';

export default function Privacy() {
  usePageMeta({ title: 'Privacy Policy — Manju\'s Atelier' });

  return (
    <div className="container-x py-12 md:py-20">
      <div className="mx-auto max-w-3xl card-surface p-8 md:p-12">
        <h1 className="mb-8 font-serif text-3xl text-brown-dark dark:text-beige md:text-4xl">
          Privacy Policy
        </h1>

        <div className="prose prose-brown dark:prose-invert max-w-none space-y-6">
          <p className="text-sm text-brown/60 dark:text-beige/60">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section>
            <h2 className="font-serif text-xl font-medium text-brown-dark dark:text-beige">
              1. Introduction
            </h2>
            <p className="mt-2 leading-relaxed text-brown/80 dark:text-beige/80">
              Welcome to Manju's Atelier. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and safeguard your information when you visit our website 
              or make a purchase from us.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-brown-dark dark:text-beige">
              2. Information We Collect
            </h2>
            <p className="mt-2 leading-relaxed text-brown/80 dark:text-beige/80">
              We may collect the following types of information:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-brown/80 dark:text-beige/80">
              <li><strong>Personal Identification Information:</strong> Name, email address, phone number, shipping and billing addresses.</li>
              <li><strong>Payment Information:</strong> Online payments are processed securely through RBI-authorized payment gateway partners (such as Cashfree Payments) supporting UPI, Debit/Credit Cards, and Net Banking. All transactions are encrypted via 256-bit SSL encryption. We do not capture, process, or store your credit/debit card numbers, CVVs, or Net Banking credentials on our servers. For manual UPI transactions, we only collect the reference transaction UTR number to verify the order.</li>
              <li><strong>Account Data:</strong> Order history, wishlist items, and preferences. If you log in via Google, we receive your basic profile information (name and email) from Google.</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, and usage patterns collected via cookies.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-brown-dark dark:text-beige">
              3. How We Use Your Information
            </h2>
            <p className="mt-2 leading-relaxed text-brown/80 dark:text-beige/80">
              We use the collected information for various purposes, including:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-brown/80 dark:text-beige/80">
              <li>Processing and fulfilling your orders.</li>
              <li>Providing customer support and responding to inquiries.</li>
              <li>Sending order updates, shipping notifications, and promotional offers (if you opted in).</li>
              <li>Improving our website, products, and overall customer experience.</li>
              <li>Preventing fraudulent transactions and ensuring security.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-brown-dark dark:text-beige">
              4. Data Sharing and Third Parties
            </h2>
            <p className="mt-2 leading-relaxed text-brown/80 dark:text-beige/80">
              We do not sell your personal data. However, we may share your information with trusted third parties 
              who assist us in operating our website and conducting our business, such as:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-brown/80 dark:text-beige/80">
              <li>Banking and financial institutions (only to the extent necessary to verify your manual UPI transaction references).</li>
              <li>Shipping and delivery partners to deliver your handmade orders.</li>
              <li>Service providers for email communications and analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-brown-dark dark:text-beige">
              5. Data Security
            </h2>
            <p className="mt-2 leading-relaxed text-brown/80 dark:text-beige/80">
              We implement industry-standard security measures to protect your personal data from unauthorized access, 
              alteration, disclosure, or destruction. However, please note that no method of transmission over the 
              internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-brown-dark dark:text-beige">
              6. Your Rights
            </h2>
            <p className="mt-2 leading-relaxed text-brown/80 dark:text-beige/80">
              Depending on your location, you may have the right to access, update, or request the deletion of your 
              personal data. You can manage your account information directly from your profile or contact us for assistance.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-medium text-brown-dark dark:text-beige">
              7. Contact Us & Grievance Officer
            </h2>
            <p className="mt-2 leading-relaxed text-brown/80 dark:text-beige/80">
              If you have any questions, privacy concerns, or data requests regarding this Privacy Policy, please contact our Grievance Officer at:
              <br /><br />
              <strong>Entity:</strong> Manju's Atelier
              <br />
              <strong>Registered Studio Address:</strong> Neelam Apartments, Mansarovar Park, Lal Kuan, Ghaziabad, Uttar Pradesh - 201009, India
              <br />
              <strong>Email:</strong> <a href="mailto:help@manjusatelier.in" className="text-gold hover:underline">help@manjusatelier.in</a>
              <br />
              <strong>WhatsApp / Support Phone:</strong> +91 93100 92966
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
