import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api('/cart');
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (productId, quantity = 1, savedForLater = false) => {
      const data = await api('/cart', {
        method: 'POST',
        body: { productId, quantity, savedForLater },
      });
      setItems(data.items || []);
      return data.items;
    },
    []
  );

  const update = useCallback(async (cartId, patch) => {
    const data = await api(`/cart/${cartId}`, { method: 'PUT', body: patch });
    setItems(data.items || []);
    return data.items;
  }, []);

  const remove = useCallback(async (cartId) => {
    const data = await api(`/cart/${cartId}`, { method: 'DELETE' });
    setItems(data.items || []);
    return data.items;
  }, []);

  const activeItems = useMemo(() => items.filter((item) => !item.savedForLater), [items]);
  const savedItems = useMemo(() => items.filter((item) => item.savedForLater), [items]);
  const count = useMemo(
    () => activeItems.reduce((sum, item) => sum + item.quantity, 0),
    [activeItems]
  );

  const value = useMemo(
    () => ({ items, activeItems, savedItems, count, loading, refresh, add, update, remove }),
    [items, activeItems, savedItems, count, loading, refresh, add, update, remove]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
