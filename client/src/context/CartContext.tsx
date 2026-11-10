import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import { finalPrice } from '@/lib/utils';
import { useAuth } from './AuthContext';
import type { CartItem, Product } from '@/types';
import { isTestDummyProduct } from '@/utils/testProduct';

interface CartContextType {
  items: CartItem[];
  add: (product: Product, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  shippingFee: number;
  freeShippingThreshold: number;
  lastAddedId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncedOnce, setSyncedOnce] = useState(false);
  
  const { user } = useAuth();
  
  const [shippingFlat, setShippingFlat] = useState(79);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(1499);

  // Load cart from DB if logged in, otherwise from local storage
  useEffect(() => {
    if (user && !syncedOnce) {
      // Get DB items
      const dbItems: CartItem[] = (user.cart || [])
        .filter((c: any) => c && c.product && c.product._id)
        .map((c: { product: Product; quantity: number }) => ({
          product: c.product,
          quantity: c.quantity,
        }));

      // Get Local items (guest cart)
      let localItems: CartItem[] = [];
      try {
        const saved = localStorage.getItem('manjus_cart');
        if (saved) localItems = JSON.parse(saved);
      } catch (e) {}

      // Authoritative cart calculation:
      // If user has saved cart in DB, use DB items as the base.
      // NEVER sum (dbQty + localQty) for the same product to prevent doubling!
      const mergedMap = new Map<string, CartItem>();

      if (dbItems.length > 0) {
        // Use DB cart as authoritative
        dbItems.forEach((item) => mergedMap.set(item.product._id, item));

        // If there were guest items added before logging in that are NOT in DB, include them:
        localItems.forEach((item) => {
          if (item?.product?._id && !mergedMap.has(item.product._id)) {
            mergedMap.set(item.product._id, item);
          }
        });
      } else {
        // DB cart was empty; migrate any existing local items
        localItems.forEach((item) => {
          if (item?.product?._id) {
            mergedMap.set(item.product._id, item);
          }
        });
      }

      const finalItems = Array.from(mergedMap.values());
      setItems(finalItems);
      setSyncedOnce(true);
      setLoaded(true);

      // Save to localStorage immediately so it stays strictly in sync
      localStorage.setItem('manjus_cart', JSON.stringify(finalItems));

      // Sync merged cart to backend
      api.post('/auth/cart/sync', {
        items: finalItems.map((i) => ({ productId: i.product._id, quantity: i.quantity })),
      }).catch(console.error);
    } else if (!user) {
      setSyncedOnce(false);
    }
  }, [user, syncedOnce]);

  useEffect(() => {
    if (user) return; // DB handles it
    try {
      const saved = localStorage.getItem('manjus_cart');
      if (saved) setItems(JSON.parse(saved));
    } catch {
      // ignore
    }
    setLoaded(true);
  }, [user]);

  // Fetch global shipping settings
  useEffect(() => {
    api.get<{ setting: { shippingFlat: number, freeShippingThreshold: number } }>('/settings')
      .then(res => {
        if (res.setting) {
          setShippingFlat(res.setting.shippingFlat);
          setFreeShippingThreshold(res.setting.freeShippingThreshold);
        }
      })
      .catch(console.error);
  }, []);

  // Save cart to local storage & DB
  useEffect(() => {
    if (!loaded) return;
    
    localStorage.setItem('manjus_cart', JSON.stringify(items));
    
    // Sync up to backend if logged in
    if (user && syncedOnce) {
      const payload = {
        items: items.map(i => ({ productId: i.product._id, quantity: i.quantity }))
      };
      api.post('/auth/cart/sync', payload).catch(console.error);
    }
  }, [items, loaded, user, syncedOnce]);

  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const add = (product: Product, quantity = 1) => {
    setItems((curr) => {
      const existing = curr.find((i) => i.product._id === product._id);
      if (existing) {
        return curr.map((i) =>
          i.product._id === product._id
            ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock, 10) }
            : i
        );
      }
      return [...curr, { product, quantity: Math.min(quantity, product.stock, 10) }];
    });
    setLastAddedId(product._id);
    setTimeout(() => setLastAddedId(null), 600);
  };

  const remove = (productId: string) => {
    setItems((curr) => curr.filter((i) => i.product._id !== productId));
  };

  const setQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((curr) =>
      curr.map((i) =>
        i.product._id === productId ? { ...i, quantity: Math.min(quantity, i.product.stock, 10) } : i
      )
    );
  };

  const clear = () => setItems([]);

  const regularItems = items.filter((item) => !isTestDummyProduct(item.product));
  const count = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + finalPrice(item.product) * item.quantity, 0);
  const shippingFee =
    regularItems.length === 0 || subtotal === 0 || subtotal >= freeShippingThreshold
      ? 0
      : shippingFlat;

  return (
    <CartContext.Provider
      value={{
        items,
        add,
        remove,
        setQuantity,
        clear,
        count,
        subtotal,
        shippingFee,
        freeShippingThreshold,
        lastAddedId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
