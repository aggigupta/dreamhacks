"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { PredictionInput, Product, RecommendResponse } from "@/lib/types";
import { products as initialProducts } from "@/lib/mockProducts";

export interface CartItem {
  product: Product;
  quantity: number;
  pricePerUnit: number;
  sustainabilityNote?: string | null;
}

export const DEFAULT_QUIZ_INPUT: PredictionInput = {
  purpose: "personal",
  householdSize: 4,
  usageFrequency: "regular",
  sustainabilityPriority: 5,
};

interface CartContextType {
  cart: CartItem[];
  allProducts: Product[];
  addProduct: (product: Product) => void;
  addToCart: (
    product: Product,
    quantity?: number,
    pricePerUnit?: number,
    sustainabilityNote?: string | null
  ) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  resetDemoState: () => void;
  cartCount: number;
  cartTotal: number;
  ecoBackhaulMode: boolean;
  setEcoBackhaulMode: (active: boolean) => void;
  backhaulRebate: number;
  backhaulCo2SavedKg: number;
  quizInput: PredictionInput;
  setQuizInput: (input: PredictionInput) => void;
  recommendationsResponse: RecommendResponse | null;
  setRecommendationsResponse: (resp: RecommendResponse | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);
  const [ecoBackhaulMode, setEcoBackhaulModeState] = useState<boolean>(true);
  const [quizInput, setQuizInputState] = useState<PredictionInput>(DEFAULT_QUIZ_INPUT);
  const [recommendationsResponse, setRecommendationsResponse] = useState<RecommendResponse | null>(null);

  // Load cart, products, and backhaul mode from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("shopyland_cart");
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedProducts = localStorage.getItem("shopyland_products");
      if (savedProducts) {
        const customProds = JSON.parse(savedProducts);
        const existingIds = new Set(initialProducts.map((p) => p.id));
        const newOnes = customProds.filter((p: Product) => !existingIds.has(p.id));
        setAllProducts([...initialProducts, ...newOnes]);
      }

      const savedBackhaul = localStorage.getItem("shopyland_backhaul");
      if (savedBackhaul !== null) setEcoBackhaulModeState(JSON.parse(savedBackhaul));

      const savedQuiz = localStorage.getItem("shopyland_quiz");
      if (savedQuiz) setQuizInputState(JSON.parse(savedQuiz));

      const savedRecs = localStorage.getItem("shopyland_recs");
      if (savedRecs) setRecommendationsResponse(JSON.parse(savedRecs));
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const saveCart = (items: CartItem[]) => {
    setCart(items);
    try {
      localStorage.setItem("shopyland_cart", JSON.stringify(items));
    } catch {
      /* ignore */
    }
  };

  const resetDemoState = () => {
    try {
      localStorage.removeItem("shopyland_cart");
      localStorage.removeItem("shopyland_products");
      localStorage.removeItem("shopyland_backhaul");
      localStorage.removeItem("shopyland_quiz");
      localStorage.removeItem("shopyland_recs");
      localStorage.removeItem("shopyland_user");
    } catch {
      /* ignore */
    }
    setCart([]);
    setAllProducts(initialProducts);
    setEcoBackhaulModeState(true);
    setQuizInputState(DEFAULT_QUIZ_INPUT);
    setRecommendationsResponse(null);
  };

  const setEcoBackhaulMode = (active: boolean) => {
    setEcoBackhaulModeState(active);
    try {
      localStorage.setItem("shopyland_backhaul", JSON.stringify(active));
    } catch {
      /* ignore */
    }
  };

  const addProduct = (newProduct: Product) => {
    setAllProducts((prev) => {
      const updated = [newProduct, ...prev];
      try {
        const customItems = updated.filter((p) => !initialProducts.some((ip) => ip.id === p.id));
        localStorage.setItem("shopyland_products", JSON.stringify(customItems));
      } catch {
        /* ignore */
      }
      return updated;
    });
  };

  const setQuizInput = (input: PredictionInput) => {
    setQuizInputState(input);
    try {
      localStorage.setItem("shopyland_quiz", JSON.stringify(input));
    } catch {
      /* ignore */
    }
  };

  const setRecsResponse = (resp: RecommendResponse | null) => {
    setRecommendationsResponse(resp);
    try {
      if (resp) {
        localStorage.setItem("shopyland_recs", JSON.stringify(resp));
      } else {
        localStorage.removeItem("shopyland_recs");
      }
    } catch {
      /* ignore */
    }
  };

  const addToCart = (
    product: Product,
    quantity = 1,
    pricePerUnit?: number,
    sustainabilityNote?: string | null
  ) => {
    const unitPrice = pricePerUnit ?? product.price ?? product.basePrice ?? 0;
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      let updated: CartItem[];
      if (existingIndex > -1) {
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          pricePerUnit: unitPrice,
          sustainabilityNote: sustainabilityNote || updated[existingIndex].sustainabilityNote,
        };
      } else {
        updated = [...prev, { product, quantity, pricePerUnit: unitPrice, sustainabilityNote }];
      }
      saveCart(updated);
      return updated;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const updated = prev.filter((item) => item.product.id !== productId);
      saveCart(updated);
      return updated;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) => {
      const updated = prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
      saveCart(updated);
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem("shopyland_cart");
    } catch {
      /* ignore */
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.pricePerUnit, 0);

  // Backhaul calculation: 15% item savings + $6.00 cargo rebate
  const backhaulRebate = ecoBackhaulMode ? Number((cartTotal * 0.15 + 6.0).toFixed(2)) : 0;
  const backhaulCo2SavedKg = ecoBackhaulMode ? 4.2 : 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        allProducts,
        addProduct,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        resetDemoState,
        cartCount,
        cartTotal,
        ecoBackhaulMode,
        setEcoBackhaulMode,
        backhaulRebate,
        backhaulCo2SavedKg,
        quizInput,
        setQuizInput,
        recommendationsResponse,
        setRecommendationsResponse: setRecsResponse,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
