
-- Tighten sales INSERT policy to require cashier_id = auth.uid()
DROP POLICY "Authenticated can create sales" ON public.sales;
CREATE POLICY "Authenticated can create own sales" ON public.sales
  FOR INSERT TO authenticated WITH CHECK (cashier_id = auth.uid());

-- Tighten sale_items INSERT: user must own the parent sale
DROP POLICY "Authenticated can create sale_items" ON public.sale_items;
CREATE POLICY "Authenticated can create sale_items for own sales" ON public.sale_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.sales WHERE id = sale_id AND cashier_id = auth.uid())
  );
