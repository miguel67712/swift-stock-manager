import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Lang = "fr" | "en";

const translations = {
  // Sidebar
  "sidebar.subtitle": { fr: "Inventaire & Ventes", en: "Inventory & Sales" },
  "nav.dashboard": { fr: "Tableau de Bord", en: "Dashboard" },
  "nav.pos": { fr: "Caisse (POS)", en: "POS Checkout" },
  "nav.products": { fr: "Produits", en: "Products" },
  "nav.alerts": { fr: "Alertes", en: "Alerts" },
  "nav.reports": { fr: "Rapports", en: "Reports" },
  "sidebar.logout": { fr: "Déconnexion", en: "Logout" },

  // Dashboard
  "dash.greeting": { fr: "Bonjour", en: "Hello" },
  "dash.subtitle": { fr: "Voici un aperçu de votre magasin aujourd'hui", en: "Here's an overview of your store today" },
  "dash.todaySales": { fr: "Ventes du Jour", en: "Today's Sales" },
  "dash.transactions": { fr: "transactions", en: "transactions" },
  "dash.totalProducts": { fr: "Total Produits", en: "Total Products" },
  "dash.inInventory": { fr: "En inventaire", en: "In inventory" },
  "dash.lowStock": { fr: "Stock Faible", en: "Low Stock" },
  "dash.needsAttention": { fr: "Besoin d'attention", en: "Needs attention" },
  "dash.totalSales": { fr: "Total Ventes", en: "Total Sales" },
  "dash.sinceStart": { fr: "Depuis le début", en: "Since start" },
  "dash.openPOS": { fr: "Ouvrir Caisse", en: "Open POS" },
  "dash.salesOverview": { fr: "Aperçu des Ventes", en: "Sales Overview" },
  "dash.last7days": { fr: "7 derniers jours", en: "Last 7 days" },
  "dash.stockAlert": { fr: "⚠️ Alerte Stock", en: "⚠️ Stock Alert" },
  "dash.viewAll": { fr: "Voir tout", en: "View all" },
  "dash.allGood": { fr: "Tous les niveaux de stock sont bons ✓", en: "All stock levels are good ✓" },
  "dash.outOfStock": { fr: "Rupture de stock", en: "Out of stock" },
  "dash.remaining": { fr: "restant(s)", en: "remaining" },
  "dash.recentTransactions": { fr: "Transactions Récentes", en: "Recent Transactions" },
  "dash.transaction": { fr: "Transaction", en: "Transaction" },
  "dash.items": { fr: "Articles", en: "Items" },
  "dash.payment": { fr: "Paiement", en: "Payment" },
  "dash.cashier": { fr: "Caissier", en: "Cashier" },
  "dash.total": { fr: "Total", en: "Total" },
  "dash.noTransactions": { fr: "Aucune transaction", en: "No transactions" },
  "dash.revenue": { fr: "Revenu", en: "Revenue" },

  // POS
  "pos.searchPlaceholder": { fr: "Rechercher produit ou code-barres...", en: "Search product or barcode..." },
  "pos.all": { fr: "Tout", en: "All" },
  "pos.currentSale": { fr: "Vente en Cours", en: "Current Sale" },
  "pos.clear": { fr: "Vider", en: "Clear" },
  "pos.emptyCart": { fr: "Panier vide", en: "Empty cart" },
  "pos.subtotal": { fr: "Sous-total", en: "Subtotal" },
  "pos.vat": { fr: "TVA (10%)", en: "VAT (10%)" },
  "pos.checkout": { fr: "Checkout", en: "Checkout" },
  "pos.processing": { fr: "Traitement...", en: "Processing..." },
  "pos.paymentMethod": { fr: "Mode de Paiement", en: "Payment Method" },
  "pos.cash": { fr: "Espèces", en: "Cash" },
  "pos.card": { fr: "Carte", en: "Card" },
  "pos.mobileMoney": { fr: "Mobile Money", en: "Mobile Money" },
  "pos.saleComplete": { fr: "Vente Complétée", en: "Sale Completed" },
  "pos.recorded": { fr: "Transaction enregistrée", en: "Transaction recorded" },
  "pos.close": { fr: "Fermer", en: "Close" },
  "pos.noProducts": { fr: "Aucun produit trouvé", en: "No products found" },
  "pos.outOfStock": { fr: "RUPTURE", en: "OUT" },
  "pos.available": { fr: "dispo", en: "avail" },
  "pos.transactionComplete": { fr: "Transaction complétée!", en: "Transaction completed!" },
  "pos.paymentFailed": { fr: "Échec du paiement", en: "Payment failed" },

  // Products
  "prod.title": { fr: "Produits", en: "Products" },
  "prod.manage": { fr: "Gérer l'inventaire", en: "Manage inventory" },
  "prod.products": { fr: "produits", en: "products" },
  "prod.addProduct": { fr: "Ajouter Produit", en: "Add Product" },
  "prod.search": { fr: "Rechercher...", en: "Search..." },
  "prod.allCategories": { fr: "Toutes Catégories", en: "All Categories" },
  "prod.product": { fr: "Produit", en: "Product" },
  "prod.category": { fr: "Catégorie", en: "Category" },
  "prod.price": { fr: "Prix (XAF)", en: "Price (XAF)" },
  "prod.stock": { fr: "Stock", en: "Stock" },
  "prod.status": { fr: "Statut", en: "Status" },
  "prod.supplier": { fr: "Fournisseur", en: "Supplier" },
  "prod.actions": { fr: "Actions", en: "Actions" },
  "prod.outOfStock": { fr: "Rupture", en: "Out of Stock" },
  "prod.lowStock": { fr: "Stock Faible", en: "Low Stock" },
  "prod.inStock": { fr: "En Stock", en: "In Stock" },
  "prod.editProduct": { fr: "Modifier Produit", en: "Edit Product" },
  "prod.update": { fr: "Mettre à jour", en: "Update" },
  "prod.addToInventory": { fr: "Ajouter à l'inventaire", en: "Add to inventory" },
  "prod.name": { fr: "Nom *", en: "Name *" },
  "prod.namePlaceholder": { fr: "Nom du produit", en: "Product name" },
  "prod.categoryLabel": { fr: "Catégorie *", en: "Category *" },
  "prod.select": { fr: "Sélectionner", en: "Select" },
  "prod.priceLabel": { fr: "Prix (XAF) *", en: "Price (XAF) *" },
  "prod.quantity": { fr: "Quantité", en: "Quantity" },
  "prod.minThreshold": { fr: "Seuil Min", en: "Min Threshold" },
  "prod.barcode": { fr: "Code-barres", en: "Barcode" },
  "prod.supplierLabel": { fr: "Fournisseur", en: "Supplier" },
  "prod.cancel": { fr: "Annuler", en: "Cancel" },
  "prod.save": { fr: "Sauvegarder", en: "Save" },
  "prod.add": { fr: "Ajouter", en: "Add" },
  "prod.deleteProduct": { fr: "Supprimer Produit", en: "Delete Product" },
  "prod.deleteConfirm": { fr: "Cette action est irréversible.", en: "This action is irreversible." },
  "prod.delete": { fr: "Supprimer", en: "Delete" },
  "prod.noProducts": { fr: "Aucun produit trouvé", en: "No products found" },
  "prod.fillRequired": { fr: "Veuillez remplir les champs obligatoires", en: "Please fill required fields" },
  "prod.updated": { fr: "mis à jour", en: "updated" },
  "prod.added": { fr: "ajouté", en: "added" },
  "prod.deleted": { fr: "Produit supprimé", en: "Product deleted" },
  "prod.qty": { fr: "Qté", en: "Qty" },

  // Alerts
  "alert.title": { fr: "Alertes Inventaire", en: "Inventory Alerts" },
  "alert.needAttention": { fr: "article(s) nécessite(nt) attention", en: "item(s) need attention" },
  "alert.allGood": { fr: "Tous les niveaux de stock sont bons", en: "All stock levels are good" },
  "alert.outOfStock": { fr: "Rupture de Stock", en: "Out of Stock" },
  "alert.lowStock": { fr: "Stock Faible", en: "Low Stock" },
  "alert.healthyStock": { fr: "Stock Sain", en: "Healthy Stock" },
  "alert.all": { fr: "Tout", en: "All" },
  "alert.rupture": { fr: "Rupture", en: "Out of Stock" },
  "alert.resolved": { fr: "Résolues", en: "Resolved" },
  "alert.noAlerts": { fr: "Aucune alerte", en: "No alerts" },
  "alert.resolve": { fr: "Résoudre", en: "Resolve" },
  "alert.alertResolved": { fr: "Alerte pour {name} résolue", en: "Alert for {name} resolved" },
  "alert.stockLabel": { fr: "Stock", en: "Stock" },

  // Reports
  "report.title": { fr: "Rapports & Analyses", en: "Reports & Analytics" },
  "report.subtitle": { fr: "Statistiques de ventes", en: "Sales statistics" },
  "report.totalRevenue": { fr: "Revenu Total", en: "Total Revenue" },
  "report.transactions": { fr: "Transactions", en: "Transactions" },
  "report.avgTransaction": { fr: "Moy. Transaction", en: "Avg. Transaction" },
  "report.inventoryValue": { fr: "Valeur Inventaire", en: "Inventory Value" },
  "report.topProducts": { fr: "Top Produits", en: "Top Products" },
  "report.salesByCategory": { fr: "Ventes par Catégorie", en: "Sales by Category" },
  "report.cashierPerformance": { fr: "Performance Caissiers", en: "Cashier Performance" },
  "report.cashier": { fr: "Caissier", en: "Cashier" },
  "report.revenue": { fr: "Revenu", en: "Revenue" },
  "report.noData": { fr: "Pas de données", en: "No data" },

  // Login
  "login.title": { fr: "Connexion", en: "Login" },
  "login.subtitle": { fr: "Connectez-vous pour accéder à votre espace", en: "Sign in to access your workspace" },
  "login.email": { fr: "Email", en: "Email" },
  "login.password": { fr: "Mot de passe", en: "Password" },
  "login.passwordPlaceholder": { fr: "Entrer votre mot de passe", en: "Enter your password" },
  "login.signIn": { fr: "Se Connecter", en: "Sign In" },
  "login.connecting": { fr: "Connexion...", en: "Signing in..." },
  "login.forgot": { fr: "Mot de passe oublié?", en: "Forgot password?" },
  "login.forgotMsg": { fr: "Contactez votre administrateur pour réinitialiser votre mot de passe.", en: "Contact your administrator to reset your password." },
  "login.demoAccounts": { fr: "Comptes démo", en: "Demo accounts" },
  "login.demoPassword": { fr: "Mot de passe: password123", en: "Password: password123" },
  "login.branding": { fr: "Gestion intelligente de stock et ventes pour votre commerce.", en: "Smart inventory and sales management for your business." },
  "login.noAccount": { fr: "Pas encore de compte?", en: "Don't have an account?" },
  "login.registerLink": { fr: "Créer un compte", en: "Create account" },

  // Register
  "register.title": { fr: "Créer un Compte", en: "Create Account" },
  "register.subtitle": { fr: "Inscrivez-vous pour commencer", en: "Sign up to get started" },
  "register.fullName": { fr: "Nom Complet", en: "Full Name" },
  "register.fullNamePlaceholder": { fr: "Votre nom complet", en: "Your full name" },
  "register.signUp": { fr: "S'inscrire", en: "Sign Up" },
  "register.creating": { fr: "Création...", en: "Creating..." },
  "register.hasAccount": { fr: "Déjà un compte?", en: "Already have an account?" },
  "register.loginLink": { fr: "Se connecter", en: "Sign in" },
  "register.passwordMin": { fr: "Le mot de passe doit contenir au moins 6 caractères", en: "Password must be at least 6 characters" },

  // Common
  "common.error": { fr: "Erreur", en: "Error" },
  "common.lang": { fr: "EN", en: "FR" },
} as const;

type TranslationKey = keyof typeof translations;

interface I18nContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: TranslationKey, vars?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("fr");

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "fr" ? "en" : "fr"));
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string>) => {
      let text: string = translations[key]?.[lang] || key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, v);
        });
      }
      return text;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
