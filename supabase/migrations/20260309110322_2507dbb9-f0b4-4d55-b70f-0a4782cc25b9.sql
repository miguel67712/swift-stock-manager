
-- Enable realtime for sales and inventory_alerts (products already added)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_alerts;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
