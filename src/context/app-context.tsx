import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import {
  cartStorage,
  catalogService,
  customerService,
  orderService,
} from "@/services/mockApi";
import type {
  CartLine,
  Customer,
  Order,
  PaymentMethod,
  Product,
  ProductCategoryItem,
  ProductExtra,
  Restaurant,
} from "@/types/models";

interface CheckoutDetails {
  name: string;
  phone: string;
  address: string;
  instructions: string;
  paymentMethod: PaymentMethod;
}

interface AppContextValue {
  ready: boolean;
  products: Product[];
  categories: ProductCategoryItem[];
  restaurant: Restaurant;
  customer: Customer;
  updateCustomer: (customer: Customer) => Promise<void>;
  cart: CartLine[];
  cartCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  addToCart: (productId: string, quantity: number, extraIds?: string[]) => void;
  setCartQuantity: (lineId: string, quantity: number) => void;
  removeFromCart: (lineId: string) => void;
  clearCart: () => void;
  orders: Order[];
  placeOrder: (details: CheckoutDetails) => Promise<Order>;
}

const STORAGE_KEY = "burak.customer.cart.v1";
const FALLBACK_RESTAURANT: Restaurant = {
  name: "BURAK",
  tagline: "Modern Turkish kitchen",
  rating: 4.9,
  reviewCount: 1280,
  deliveryTime: "25–35 min",
  hours: "Open today · 11:00 AM – 10:00 PM",
  address: "150 Hudson Street, New York, NY",
  deliveryFee: 3.5,
  freeDeliveryMinimum: 40,
};

const AppContext = createContext<AppContextValue | null>(null);

function linePrice(line: CartLine): number {
  return (
    line.product.price +
    line.extras.reduce((sum, extra) => sum + extra.price, 0)
  );
}

export function AppProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategoryItem[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant>(FALLBACK_RESTAURANT);
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    phone: "",
    email: "",
    address: "",
    instructions: "",
  });
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    let mounted = true;
    void Promise.all([
      catalogService.getProducts(),
      catalogService.getCategories(),
      catalogService.getRestaurant(),
      customerService.getProfile(),
      orderService.getOrders(),
      cartStorage.load(),
    ])
      .then(
        ([
          loadedProducts,
          loadedCategories,
          loadedRestaurant,
          loadedCustomer,
          loadedOrders,
          savedCart,
        ]) => {
          if (!mounted) return;
          setProducts(loadedProducts);
          setCategories(loadedCategories);
          setRestaurant(loadedRestaurant);
          setCustomer(loadedCustomer);
          setOrders(loadedOrders);
          const restored = savedCart.flatMap((savedLine) => {
            const product = loadedProducts.find(
              (item) => item.id === savedLine.productId,
            );
            if (!product || product.availability === "Sold out") return [];
            const extras = product.extras.filter((extra) =>
              savedLine.extraIds.includes(extra.id),
            );
            return [
              {
                id: `${product.id}:${extras
                  .map((extra) => extra.id)
                  .sort()
                  .join(",")}`,
                product,
                quantity: savedLine.quantity,
                extras,
              },
            ];
          });
          setCart(restored);
          setReady(true);
        },
      )
      .catch(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const persisted = cart.map((line) => ({
      productId: line.product.id,
      quantity: line.quantity,
      extraIds: line.extras.map((extra) => extra.id),
    }));
    void cartStorage.save(persisted).catch(() => undefined);
  }, [cart, ready]);

  const updateCustomer = useCallback(async (nextCustomer: Customer) => {
    setCustomer(nextCustomer);
    await customerService.saveProfile(nextCustomer);
  }, []);

  const addToCart = useCallback(
    (productId: string, quantity: number, extraIds: string[] = []) => {
      const product = products.find((item) => item.id === productId);
      if (!product || product.availability === "Sold out") return;
      const extras: ProductExtra[] = product.extras.filter((extra) =>
        extraIds.includes(extra.id),
      );
      const lineId = `${product.id}:${extras
        .map((extra) => extra.id)
        .sort()
        .join(",")}`;
      setCart((current) => {
        const existing = current.find((line) => line.id === lineId);
        if (existing)
          return current.map((line) =>
            line.id === lineId
              ? { ...line, quantity: line.quantity + quantity }
              : line,
          );
        return [...current, { id: lineId, product, quantity, extras }];
      });
    },
    [products],
  );

  const setCartQuantity = useCallback((lineId: string, quantity: number) => {
    if (quantity < 1) {
      setCart((current) => current.filter((line) => line.id !== lineId));
      return;
    }
    setCart((current) =>
      current.map((line) =>
        line.id === lineId ? { ...line, quantity } : line,
      ),
    );
  }, []);

  const removeFromCart = useCallback((lineId: string) => {
    setCart((current) => current.filter((line) => line.id !== lineId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + linePrice(line) * line.quantity, 0),
    [cart],
  );
  const deliveryFee =
    cart.length === 0 || subtotal >= restaurant.freeDeliveryMinimum
      ? 0
      : restaurant.deliveryFee;
  const total = subtotal + deliveryFee;
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  const placeOrder = useCallback(
    async (details: CheckoutDetails) => {
      if (!cart.length)
        throw new Error("Add something delicious before checkout.");
      const order: Order = {
        id: `BRK-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
        status: "Pending",
        eta: restaurant.deliveryTime,
        items: cart.map((line) => ({
          productId: line.product.id,
          name: line.product.name,
          image: line.product.image,
          quantity: line.quantity,
          unitPrice: linePrice(line),
          extras: line.extras.map((extra) => extra.name),
        })),
        subtotal,
        deliveryFee,
        total,
        paymentMethod: details.paymentMethod,
        customer: {
          name: details.name.trim(),
          phone: details.phone.trim(),
          address: details.address.trim(),
          instructions: details.instructions.trim(),
        },
      };
      const nextOrders = [order, ...orders];
      const nextCustomer = {
        ...customer,
        name: details.name.trim(),
        phone: details.phone.trim(),
        address: details.address.trim(),
        instructions: details.instructions.trim(),
      };
      setOrders(nextOrders);
      setCustomer(nextCustomer);
      setCart([]);
      await Promise.all([
        orderService.saveOrders(nextOrders),
        customerService.saveProfile(nextCustomer),
        AsyncStorage.setItem(STORAGE_KEY, "[]"),
      ]);
      return order;
    },
    [
      cart,
      customer,
      deliveryFee,
      orders,
      restaurant.deliveryTime,
      subtotal,
      total,
    ],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      products,
      categories,
      restaurant,
      customer,
      updateCustomer,
      cart,
      cartCount,
      subtotal,
      deliveryFee,
      total,
      addToCart,
      setCartQuantity,
      removeFromCart,
      clearCart,
      orders,
      placeOrder,
    }),
    [
      ready,
      products,
      categories,
      restaurant,
      customer,
      updateCustomer,
      cart,
      cartCount,
      subtotal,
      deliveryFee,
      total,
      addToCart,
      setCartQuantity,
      removeFromCart,
      clearCart,
      orders,
      placeOrder,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppData must be used inside AppProvider");
  return context;
}
