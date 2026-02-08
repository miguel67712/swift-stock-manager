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
  "Dairy",
  "Bakery",
  "Meat",
  "Seafood",
  "Produce",
  "Grains",
  "Beverages",
  "Canned",
  "Cooking",
  "Household",
  "Snacks",
  "Frozen",
];

export const initialProducts: Product[] = [
  { id: "1", name: "Whole Milk 1L", category: "Dairy", price: 3.99, quantity: 45, minThreshold: 10, barcode: "100001", supplier: "DairyFresh Co.", dateAdded: "2024-01-15" },
  { id: "2", name: "White Bread", category: "Bakery", price: 2.49, quantity: 3, minThreshold: 5, barcode: "100002", supplier: "Golden Bakes", dateAdded: "2024-01-15" },
  { id: "3", name: "Free Range Eggs (12)", category: "Dairy", price: 4.99, quantity: 28, minThreshold: 8, barcode: "100003", supplier: "Farm Fresh", dateAdded: "2024-01-16" },
  { id: "4", name: "Cheddar Cheese 500g", category: "Dairy", price: 6.49, quantity: 0, minThreshold: 5, barcode: "100004", supplier: "DairyFresh Co.", dateAdded: "2024-01-16" },
  { id: "5", name: "Chicken Breast 1kg", category: "Meat", price: 8.99, quantity: 15, minThreshold: 5, barcode: "100005", supplier: "Prime Meats", dateAdded: "2024-01-17" },
  { id: "6", name: "Basmati Rice 2kg", category: "Grains", price: 5.99, quantity: 32, minThreshold: 10, barcode: "100006", supplier: "Global Foods", dateAdded: "2024-01-17" },
  { id: "7", name: "Olive Oil 750ml", category: "Cooking", price: 7.99, quantity: 4, minThreshold: 5, barcode: "100007", supplier: "Mediterranean Imports", dateAdded: "2024-01-18" },
  { id: "8", name: "Coca Cola 2L", category: "Beverages", price: 2.99, quantity: 50, minThreshold: 15, barcode: "100008", supplier: "Beverage Dist.", dateAdded: "2024-01-18" },
  { id: "9", name: "Instant Coffee 200g", category: "Beverages", price: 9.99, quantity: 2, minThreshold: 5, barcode: "100009", supplier: "Coffee World", dateAdded: "2024-01-19" },
  { id: "10", name: "Pasta Spaghetti 500g", category: "Grains", price: 1.99, quantity: 40, minThreshold: 10, barcode: "100010", supplier: "Italian Foods", dateAdded: "2024-01-19" },
  { id: "11", name: "Tomato Sauce 400g", category: "Canned", price: 2.29, quantity: 35, minThreshold: 10, barcode: "100011", supplier: "Italian Foods", dateAdded: "2024-01-20" },
  { id: "12", name: "Fresh Salmon 500g", category: "Seafood", price: 12.99, quantity: 8, minThreshold: 3, barcode: "100012", supplier: "Ocean Fresh", dateAdded: "2024-01-20" },
  { id: "13", name: "Bananas 1kg", category: "Produce", price: 1.49, quantity: 60, minThreshold: 20, barcode: "100013", supplier: "Tropical Fruits", dateAdded: "2024-01-21" },
  { id: "14", name: "Greek Yogurt 500g", category: "Dairy", price: 4.49, quantity: 1, minThreshold: 5, barcode: "100014", supplier: "DairyFresh Co.", dateAdded: "2024-01-21" },
  { id: "15", name: "Laundry Detergent 1L", category: "Household", price: 6.99, quantity: 22, minThreshold: 5, barcode: "100015", supplier: "CleanCo", dateAdded: "2024-01-22" },
  { id: "16", name: "Potato Chips 200g", category: "Snacks", price: 3.49, quantity: 38, minThreshold: 10, barcode: "100016", supplier: "Snack Masters", dateAdded: "2024-01-22" },
  { id: "17", name: "Orange Juice 1L", category: "Beverages", price: 4.29, quantity: 18, minThreshold: 8, barcode: "100017", supplier: "Citrus Valley", dateAdded: "2024-01-23" },
  { id: "18", name: "Frozen Pizza", category: "Frozen", price: 5.99, quantity: 12, minThreshold: 5, barcode: "100018", supplier: "Frozen Delights", dateAdded: "2024-01-23" },
];

export const initialSales: Sale[] = [
  {
    id: "1", transactionId: "TXN-0001",
    items: [
      { productId: "1", productName: "Whole Milk 1L", quantity: 2, unitPrice: 3.99, totalPrice: 7.98 },
      { productId: "2", productName: "White Bread", quantity: 1, unitPrice: 2.49, totalPrice: 2.49 },
    ],
    subtotal: 10.47, tax: 1.05, total: 11.52, paymentMethod: "card", cashier: "John D.", date: "2026-02-08T09:30:00",
  },
  {
    id: "2", transactionId: "TXN-0002",
    items: [
      { productId: "5", productName: "Chicken Breast 1kg", quantity: 1, unitPrice: 8.99, totalPrice: 8.99 },
      { productId: "6", productName: "Basmati Rice 2kg", quantity: 1, unitPrice: 5.99, totalPrice: 5.99 },
      { productId: "11", productName: "Tomato Sauce 400g", quantity: 2, unitPrice: 2.29, totalPrice: 4.58 },
    ],
    subtotal: 19.56, tax: 1.96, total: 21.52, paymentMethod: "cash", cashier: "Sarah M.", date: "2026-02-08T10:15:00",
  },
  {
    id: "3", transactionId: "TXN-0003",
    items: [
      { productId: "13", productName: "Bananas 1kg", quantity: 3, unitPrice: 1.49, totalPrice: 4.47 },
      { productId: "3", productName: "Free Range Eggs (12)", quantity: 1, unitPrice: 4.99, totalPrice: 4.99 },
    ],
    subtotal: 9.46, tax: 0.95, total: 10.41, paymentMethod: "mobile", cashier: "John D.", date: "2026-02-08T11:00:00",
  },
  {
    id: "4", transactionId: "TXN-0004",
    items: [
      { productId: "8", productName: "Coca Cola 2L", quantity: 3, unitPrice: 2.99, totalPrice: 8.97 },
      { productId: "16", productName: "Potato Chips 200g", quantity: 2, unitPrice: 3.49, totalPrice: 6.98 },
    ],
    subtotal: 15.95, tax: 1.60, total: 17.55, paymentMethod: "card", cashier: "Sarah M.", date: "2026-02-08T13:45:00",
  },
  {
    id: "5", transactionId: "TXN-0005",
    items: [
      { productId: "12", productName: "Fresh Salmon 500g", quantity: 1, unitPrice: 12.99, totalPrice: 12.99 },
      { productId: "7", productName: "Olive Oil 750ml", quantity: 1, unitPrice: 7.99, totalPrice: 7.99 },
    ],
    subtotal: 20.98, tax: 2.10, total: 23.08, paymentMethod: "card", cashier: "John D.", date: "2026-02-07T16:20:00",
  },
  {
    id: "6", transactionId: "TXN-0006",
    items: [
      { productId: "9", productName: "Instant Coffee 200g", quantity: 1, unitPrice: 9.99, totalPrice: 9.99 },
      { productId: "1", productName: "Whole Milk 1L", quantity: 1, unitPrice: 3.99, totalPrice: 3.99 },
    ],
    subtotal: 13.98, tax: 1.40, total: 15.38, paymentMethod: "cash", cashier: "Sarah M.", date: "2026-02-07T14:10:00",
  },
];

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
