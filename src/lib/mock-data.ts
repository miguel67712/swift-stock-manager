export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  minThreshold: number;
  barcode: string;
  supplier: string;
  dateAdded: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  transactionId: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "mobile";
  cashier: string;
  date: string;
}

export interface InventoryAlert {
  id: string;
  productId: string;
  productName: string;
  previousQuantity: number;
  currentQuantity: number;
  type: "low_stock" | "out_of_stock";
  date: string;
  resolved: boolean;
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: "admin" | "manager" | "cashier";
}

export const CATEGORIES = [
  "Alimentation",
  "Boissons",
  "Ménage",
  "Autre",
];

export const initialProducts: Product[] = [];
export const initialSales: Sale[] = [];

export const generateAlerts = (products: Product[]): InventoryAlert[] => {
  return products
    .filter((p) => p.quantity <= p.minThreshold)
    .map((p, i) => ({
      id: String(i + 1),
      productId: p.id,
      productName: p.name,
      previousQuantity: p.quantity + Math.floor(Math.random() * 10) + 3,
      currentQuantity: p.quantity,
      type: (p.quantity === 0 ? "out_of_stock" : "low_stock") as "low_stock" | "out_of_stock",
      date: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
      resolved: false,
    }));
};
