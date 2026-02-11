import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Pencil, Trash2, Package } from "lucide-react";
import type { Product } from "@/hooks/useProducts";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { toast } from "sonner";

const CATEGORIES = [
  "Dairy", "Bakery", "Meat", "Seafood", "Produce", "Grains",
  "Beverages", "Canned", "Cooking", "Household", "Snacks", "Frozen",
];

interface ProductFormData {
  name: string;
  category: string;
  price: string;
  quantity: string;
  minThreshold: string;
  barcode: string;
  supplier: string;
}

const emptyForm: ProductFormData = {
  name: "", category: "", price: "", quantity: "", minThreshold: "5", barcode: "", supplier: "",
};

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const cardItem: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export default function Products() {
  const { isAdminOrManager } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode || "").includes(search);
      const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [products, search, categoryFilter]);

  const openAddDialog = () => { setEditingProduct(null); setForm(emptyForm); setDialogOpen(true); };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      quantity: String(product.quantity),
      minThreshold: String(product.min_threshold),
      barcode: product.barcode || "",
      supplier: product.supplier || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category || !form.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    const productData = {
      name: form.name.trim(),
      category: form.category,
      price: parseFloat(form.price),
      quantity: parseInt(form.quantity) || 0,
      min_threshold: parseInt(form.minThreshold) || 5,
      barcode: form.barcode.trim() || null,
      supplier: form.supplier.trim(),
    };

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, updates: productData });
        toast.success(`${productData.name} updated`);
      } else {
        await addProduct.mutateAsync(productData);
        toast.success(`${productData.name} added to inventory`);
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    const product = products.find((p) => p.id === id);
    try {
      await deleteProduct.mutateAsync(id);
      toast.success(`${product?.name} removed`);
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
    setDeleteConfirm(null);
  };

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) return { label: "Out of Stock", className: "stock-critical" };
    if (product.quantity <= product.min_threshold) return { label: "Low Stock", className: "stock-warning" };
    return { label: "In Stock", className: "stock-good" };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your inventory ({products.length} products)</p>
        </div>
        {isAdminOrManager && (
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button onClick={openAddDialog} className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Card className="shadow-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name or barcode..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mobile: cards layout */}
      <motion.div
        className="block sm:hidden space-y-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product) => {
            const status = getStockStatus(product);
            return (
              <motion.div key={product.id} variants={cardItem} layout exit={{ opacity: 0, scale: 0.9 }}>
                <Card className={`shadow-card hover-lift ${product.quantity === 0 ? "border-destructive/30" : product.quantity <= product.min_threshold ? "border-warning/30" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px]">{product.category}</Badge>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${status.className}`}>{status.label}</span>
                        </div>
                      </div>
                      {isAdminOrManager && (
                        <div className="flex gap-1 ml-2">
                          <motion.button onClick={() => openEditDialog(product)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" whileTap={{ scale: 0.85 }}><Pencil className="h-3.5 w-3.5" /></motion.button>
                          <motion.button onClick={() => setDeleteConfirm(product.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" whileTap={{ scale: 0.85 }}><Trash2 className="h-3.5 w-3.5" /></motion.button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <span className="font-mono font-bold">${Number(product.price).toFixed(2)}</span>
                      <span className="text-muted-foreground">Qty: <span className="font-mono font-semibold text-foreground">{product.quantity}</span></span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Desktop: table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card className="shadow-card hidden sm:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Barcode</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Stock</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Supplier</th>
                    {isAdminOrManager && <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <AnimatePresence>
                    {filteredProducts.map((product, i) => {
                      const status = getStockStatus(product);
                      return (
                        <motion.tr
                          key={product.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.3 }}
                          className={`hover:bg-muted/30 transition-colors ${product.quantity === 0 ? "bg-destructive/5" : product.quantity <= product.min_threshold ? "bg-warning/5" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <motion.div
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"
                                whileHover={{ rotate: 10, scale: 1.1 }}
                              >
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </motion.div>
                              <span className="font-medium text-foreground">{product.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{product.category}</Badge></td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden lg:table-cell">{product.barcode || "-"}</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold">${Number(product.price).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold">{product.quantity}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded-full ${status.className}`}>{status.label}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{product.supplier || "-"}</td>
                          {isAdminOrManager && (
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <motion.button onClick={() => openEditDialog(product)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}><Pencil className="h-3.5 w-3.5" /></motion.button>
                                <motion.button onClick={() => setDeleteConfirm(product.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}><Trash2 className="h-3.5 w-3.5" /></motion.button>
                              </div>
                            </td>
                          )}
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            {filteredProducts.length === 0 && (
              <motion.div
                className="py-16 text-center text-muted-foreground"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Package className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No products found</p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>{editingProduct ? "Update product details" : "Add a new product to your inventory"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <Label>Product Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter product name" />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Price *</Label>
                <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Min Threshold</Label>
                <Input type="number" min="0" value={form.minThreshold} onChange={(e) => setForm({ ...form, minThreshold: e.target.value })} placeholder="5" />
              </div>
              <div className="space-y-2">
                <Label>Barcode</Label>
                <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="Enter barcode" />
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Supplier name" />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button type="submit" disabled={addProduct.isPending || updateProduct.isPending}>
                  {addProduct.isPending || updateProduct.isPending ? "Saving..." : editingProduct ? "Save Changes" : "Add Product"}
                </Button>
              </motion.div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>Are you sure? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} disabled={deleteProduct.isPending}>
                {deleteProduct.isPending ? "Deleting..." : "Delete"}
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
