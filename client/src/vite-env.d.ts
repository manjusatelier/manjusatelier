/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_UPI_ID?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_CASHFREE_MODE?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Razorpay checkout is loaded from a script tag at runtime.
interface Window {
  Razorpay: new (options: Record<string, unknown>) => { open: () => void };
}

declare module '@cashfreepayments/cashfree-js' {
  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: '_modal' | '_self' | '_blank';
    values?: Record<string, string>;
  }

  export interface CashfreeCheckoutResult {
    error?: {
      message?: string;
      code?: string;
      type?: string;
    };
    redirect?: boolean;
    paymentDetails?: {
      paymentMessage?: string;
    };
  }

  export interface CashfreeInstance {
    checkout: (options: CashfreeCheckoutOptions) => Promise<CashfreeCheckoutResult>;
  }

  export function load(config: { mode: 'sandbox' | 'production' }): Promise<CashfreeInstance>;
}
