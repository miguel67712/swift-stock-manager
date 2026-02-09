
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'cashier');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  username TEXT NOT NULL DEFAULT '',
  role app_role NOT NULL DEFAULT 'cashier',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (for secure role checking)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Uncategorized',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_threshold INTEGER NOT NULL DEFAULT 5,
  barcode TEXT UNIQUE,
  supplier TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT NOT NULL UNIQUE,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'mobile')),
  cashier_id UUID REFERENCES auth.users(id),
  cashier_name TEXT NOT NULL DEFAULT 'Unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Sale items table
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL
);
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Inventory alerts table
CREATE TABLE public.inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  previous_quantity INTEGER NOT NULL DEFAULT 0,
  current_quantity INTEGER NOT NULL DEFAULT 0,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock')),
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;

-- ============ Security definer function for role checking ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'manager')
  )
$$;

-- ============ Auto-create profile + role on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
  _full_name TEXT;
BEGIN
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'cashier');
  
  INSERT INTO public.profiles (id, full_name, username, role)
  VALUES (NEW.id, _full_name, LOWER(SPLIT_PART(NEW.email, '@', 1)), _role);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ Updated_at trigger ============
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ Auto-generate alerts on product stock change ============
CREATE OR REPLACE FUNCTION public.check_stock_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.quantity <= NEW.min_threshold AND (OLD.quantity IS NULL OR OLD.quantity > OLD.min_threshold OR NEW.quantity <> OLD.quantity) THEN
    INSERT INTO public.inventory_alerts (product_id, product_name, previous_quantity, current_quantity, alert_type)
    VALUES (
      NEW.id,
      NEW.name,
      COALESCE(OLD.quantity, 0),
      NEW.quantity,
      CASE WHEN NEW.quantity = 0 THEN 'out_of_stock' ELSE 'low_stock' END
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_stock_after_update
  AFTER UPDATE OF quantity ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.check_stock_alert();

-- ============ RLS Policies ============

-- Profiles: all authenticated can read, own can update
CREATE POLICY "Authenticated users can read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User roles: read own
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Products: all authenticated read, admin/manager write
CREATE POLICY "Authenticated can read products" ON public.products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/manager can insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin/manager can update products" ON public.products
  FOR UPDATE TO authenticated USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin/manager can delete products" ON public.products
  FOR DELETE TO authenticated USING (public.is_admin_or_manager(auth.uid()));

-- Sales: all authenticated can read and create
CREATE POLICY "Authenticated can read sales" ON public.sales
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can create sales" ON public.sales
  FOR INSERT TO authenticated WITH CHECK (true);

-- Sale items: all authenticated can read and create
CREATE POLICY "Authenticated can read sale_items" ON public.sale_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can create sale_items" ON public.sale_items
  FOR INSERT TO authenticated WITH CHECK (true);

-- Inventory alerts: all authenticated read, admin/manager can update (resolve)
CREATE POLICY "Authenticated can read alerts" ON public.inventory_alerts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/manager can resolve alerts" ON public.inventory_alerts
  FOR UPDATE TO authenticated USING (public.is_admin_or_manager(auth.uid()));

-- ============ Enable realtime for key tables ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
