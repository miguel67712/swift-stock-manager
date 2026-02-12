import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Pencil, Trash2, Package } from "lucide-react";
import type { Product } from "@/hooks/useProducts";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { toast } from "sonner";
import { formatXAF } from "@/lib/currency";

const CATEGORIES = ["Alimentation", "Boissons", "Ménage", "Autre"];

interface ProductFormData { name: string; category: string; price: string; quantity: string; minThreshold: string; barcode: string; supplier: string; }
const emptyForm: ProductFormData = { name: "", category: "", price: "", quantity: "", minThreshold: "5", barcode: "", supplier: "" };

const container: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const cardItem: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

export default function Products() {
  const { isAdminOrManager } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredProducts = useMemo(() => products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode || "").includes(search);
    return matchSearch && (categoryFilter === "all" || p.category === categoryFilter);
  }), [products, search, categoryFilter]);

  const openAddDialog = () => { setEditingProduct(null); setForm(emptyForm); setDialogOpen(true); };
  const openEditDialog = (product: Product) => { setEditingProduct(product); setForm({ name: product.name, category: product.category, price: String(product.price), quantity: String(product.quantity), minThreshold: String(product.min_threshold), barcode: product.barcode || "", supplier: product.supplier || "" }); setDialogOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category || !form.price) { toast.error("Veuillez remplir les champs obligatoires"); return; }
    const data = { name: form.name.trim(), category: form.category, price: parseFloat(form.price), quantity: parseInt(form.quantity) || 0, min_threshold: parseInt(form.minThreshold) || 5, barcode: form.barcode.trim() || null, supplier: form.supplier.trim() };
    try {
      if (editingProduct) { await updateProduct.mutateAsync({ id: editingProduct.id, updates: data }); toast.success(`${data.name} mis à jour`); }
      else { await addProduct.mutateAsync(data); toast.success(`${data.name} ajouté`); }
      setDialogOpen(false);
    } catch (err: any) { toast.error(err.message || "Erreur"); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteProduct.mutateAsync(id); toast.success("Produit supprimé"); } catch (err: any) { toast.error(err.message || "Erreur"); }
    setDeleteConfirm(null);
  };

  const getStockStatus = (p: Product) => {
    if (p.quantity === 0) return { label: "Rupture", className: "stock-critical" };
    if (p.quantity <= p.min_threshold) return { label: "Stock Faible", className: "stock-warning" };
    return { label: "En Stock", className: "stock-good" };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
        <div><h1 className="text-xl sm:text-2xl font-bold text-foreground">Produits</h1><p className="text-sm text-muted-foreground mt-1">Gérer l'inventaire ({products.length} produits)</p></div>
        {isAdminOrManager && <Button onClick={openAddDialog} className="gap-2 w-full sm:w-auto"><Plus className="h-4 w-4" /> Ajouter Produit</Button>}
      </motion.div>

      <Card className="shadow-card"><CardContent className="p-3 sm:p-4"><div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Toutes" /></SelectTrigger><SelectContent><SelectItem value="all">Toutes Catégories</SelectItem>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
      </div></CardContent></Card>

      {/* Mobile cards */}
      <motion.div className="block sm:hidden space-y-3" variants={container} initial="hidden" animate="show">
        {filteredProducts.map((product) => { const status = getStockStatus(product); return (
          <motion.div key={product.id} variants={cardItem} layout>
            <Card className={`shadow-card hover-lift ${product.quantity === 0 ? "border-destructive/30" : product.quantity <= product.min_threshold ? "border-warning/30" : ""}`}><CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0"><p className="font-semibold truncate">{product.name}</p><div className="flex items-center gap-2 mt-1"><Badge variant="secondary" className="text-[10px]">{product.category}</Badge><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${status.className}`}>{status.label}</span></div></div>
                {isAdminOrManager && <div className="flex gap-1 ml-2"><button onClick={() => openEditDialog(product)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => setDeleteConfirm(product.id)} className="rounded-md p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></div>}
              </div>
              <div className="flex items-center justify-between mt-3 text-sm"><span className="font-mono font-bold">{formatXAF(Number(product.price))}</span><span className="text-muted-foreground">Qté: <span className="font-mono font-semibold text-foreground">{product.quantity}</span></span></div>
            </CardContent></Card>
          </motion.div>
        ); })}
      </motion.div>

      {/* Desktop table */}
      <Card className="shadow-card hidden sm:block"><CardContent className="p-0"><div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/30">
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Produit</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Catégorie</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Prix (XAF)</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Stock</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Statut</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Fournisseur</th>
            {isAdminOrManager && <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>}
          </tr></thead>
          <tbody className="divide-y">
            {filteredProducts.map((product) => { const status = getStockStatus(product); return (
              <tr key={product.id} className={`hover:bg-muted/30 transition-colors ${product.quantity === 0 ? "bg-destructive/5" : product.quantity <= product.min_threshold ? "bg-warning/5" : ""}`}>
                <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"><Package className="h-4 w-4 text-muted-foreground" /></div><span className="font-medium">{product.name}</span></div></td>
                <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{product.category}</Badge></td>
                <td className="px-4 py-3 text-right font-mono font-semibold">{formatXAF(Number(product.price))}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">{product.quantity}</td>
                <td className="px-4 py-3 text-center"><span className={`inline-block text-[10px] font-bold px-2 py-1 rounded-full ${status.className}`}>{status.label}</span></td>
                <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{product.supplier || "-"}</td>
                {isAdminOrManager && <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1"><button onClick={() => openEditDialog(product)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => setDeleteConfirm(product.id)} className="rounded-md p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></div></td>}
              </tr>
            ); })}
          </tbody>
        </table>
      </div>
      {filteredProducts.length === 0 && <div className="py-16 text-center text-muted-foreground"><Package className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="text-sm">Aucun produit trouvé</p></div>}
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editingProduct ? "Modifier Produit" : "Ajouter Produit"}</DialogTitle><DialogDescription>{editingProduct ? "Mettre à jour" : "Ajouter à l'inventaire"}</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1 sm:col-span-2 space-y-2"><Label>Nom *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom du produit" /></div>
          <div className="space-y-2"><Label>Catégorie *</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Prix (XAF) *</Label><Input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" /></div>
          <div className="space-y-2"><Label>Quantité</Label><Input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" /></div>
          <div className="space-y-2"><Label>Seuil Min</Label><Input type="number" min="0" value={form.minThreshold} onChange={(e) => setForm({ ...form, minThreshold: e.target.value })} placeholder="5" /></div>
          <div className="space-y-2"><Label>Code-barres</Label><Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></div>
          <div className="space-y-2"><Label>Fournisseur</Label><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button type="submit" disabled={addProduct.isPending || updateProduct.isPending}>{addProduct.isPending || updateProduct.isPending ? "..." : editingProduct ? "Sauvegarder" : "Ajouter"}</Button>
        </div></form>
      </DialogContent></Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}><DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Supprimer Produit</DialogTitle><DialogDescription>Cette action est irréversible.</DialogDescription></DialogHeader>
        <div className="flex justify-end gap-3 pt-2"><Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button><Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Supprimer</Button></div>
      </DialogContent></Dialog>
    </div>
  );
}
