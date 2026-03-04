
-- Allow any authenticated user to create sales (clients can buy)
DROP POLICY IF EXISTS "Authenticated can create own sales" ON public.sales;
CREATE POLICY "Authenticated can create own sales" ON public.sales
  FOR INSERT TO authenticated
  WITH CHECK (cashier_id = auth.uid());

-- Allow any authenticated user to create sale_items for own sales
DROP POLICY IF EXISTS "Authenticated can create sale_items for own sales" ON public.sale_items;
CREATE POLICY "Authenticated can create sale_items for own sales" ON public.sale_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND sales.cashier_id = auth.uid()
  ));

-- Allow clients to update products (stock deduction during purchase)
-- Actually clients shouldn't update products directly. We need a function for stock deduction.
-- Let's create a security definer function for stock deduction
CREATE OR REPLACE FUNCTION public.deduct_stock(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE products SET quantity = GREATEST(0, quantity - p_quantity) WHERE id = p_product_id;
END;
$$;
