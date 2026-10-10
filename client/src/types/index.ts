export type Badge = 'New' | 'Sale' | 'Limited' | 'Handmade';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  featured?: boolean;
  productCount?: number;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount: number;
  finalPrice: number;
  images: string[];
  category: Category[] | string[] | Category | string;
  material?: string;
  dimensions?: string;
  careInstructions?: string;
  color?: string;
  stock: number;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  badges: Badge[];
  featured?: boolean;
}

export interface Review {
  _id: string;
  product: string;
  user: string;
  name: string;
  rating: number;
  comment?: string;
  image?: string;
  status?: 'pending' | 'approved';
  createdAt: string;
}

export interface Address {
  fullName?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  addresses?: Address[];
  wishlist: string[];
  cart?: { product: Product; quantity: number }[];
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  product: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  user?: string | { _id: string; name: string; email: string };
  items: OrderItem[];
  shippingAddress: Address;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  couponCode?: string;
  paymentStatus: 'PAYMENT_PENDING' | 'PENDING_UTR' | 'UTR_MISMATCH_RETRY' | 'UTR_VERIFICATION_PENDING' | 'UTR_VERIFIED' | 'SUCCESSFUL' | 'FAILED';
  orderStatus: 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod?: string;
  utrNumber?: string;
  utrEdited?: boolean;
  customOrderId?: string;
  razorpayOrderId?: string;
  createdAt: string;
  deliveredAt?: string;
  returnExchange?: {
    actionType: 'return' | 'exchange';
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    requestedAt: string;
    adminNote?: string;
  };
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface Paginated<T> {
  products: T[];
  total: number;
  page: number;
  pages: number;
  facets?: {
    categoryCounts?: Record<string, number>;
  };
}
