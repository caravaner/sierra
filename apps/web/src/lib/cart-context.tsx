"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { trpc } from "./trpc";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "sierra-cart";

function readLocalCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const prevAuth = useRef(false);

  const [localItems, setLocalItems] = useState<CartItem[]>([]);

  // Initialize local cart from localStorage
  useEffect(() => {
    setLocalItems(readLocalCart());
  }, []);

  // Persist local cart changes
  useEffect(() => {
    if (!isAuthenticated) {
      writeLocalCart(localItems);
    }
  }, [localItems, isAuthenticated]);

  // tRPC queries/mutations for authenticated users
  const utils = trpc.useUtils();
  const cartQuery = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const addItemMut = trpc.cart.addItem.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });
  const removeItemMut = trpc.cart.removeItem.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });
  const updateQtyMut = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });
  const clearMut = trpc.cart.clear.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });
  const mergeMut = trpc.cart.merge.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
  });

  // Merge localStorage cart into DB on login
  useEffect(() => {
    if (isAuthenticated && !prevAuth.current) {
      const local = readLocalCart();
      if (local.length > 0) {
        mergeMut.mutate(
          {
            items: local.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            })),
          },
          {
            onSuccess: () => {
              localStorage.removeItem(STORAGE_KEY);
              setLocalItems([]);
            },
          },
        );
      }
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = isAuthenticated ? (cartQuery.data?.items ?? []) : localItems;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      const qty = item.quantity ?? 1;
      if (isAuthenticated) {
        addItemMut.mutate({ productId: item.productId, quantity: qty });
      } else {
        setLocalItems((prev) => {
          const existing = prev.find((i) => i.productId === item.productId);
          if (existing) {
            return prev.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + qty }
                : i,
            );
          }
          return [...prev, { ...item, quantity: qty }];
        });
      }
    },
    [isAuthenticated, addItemMut],
  );

  const removeItem = useCallback(
    (productId: string) => {
      if (isAuthenticated) {
        removeItemMut.mutate({ productId });
      } else {
        setLocalItems((prev) => prev.filter((i) => i.productId !== productId));
      }
    },
    [isAuthenticated, removeItemMut],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }
      if (isAuthenticated) {
        updateQtyMut.mutate({ productId, quantity });
      } else {
        setLocalItems((prev) =>
          prev.map((i) =>
            i.productId === productId ? { ...i, quantity } : i,
          ),
        );
      }
    },
    [isAuthenticated, updateQtyMut, removeItem],
  );

  const clearCart = useCallback(() => {
    if (isAuthenticated) {
      clearMut.mutate();
    } else {
      setLocalItems([]);
    }
  }, [isAuthenticated, clearMut]);

  return (
    <CartContext.Provider
      value={{ items, itemCount, total, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
