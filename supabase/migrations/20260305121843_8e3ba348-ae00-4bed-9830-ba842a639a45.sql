
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role app_role;
  _full_name TEXT;
BEGIN
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'client');
  
  INSERT INTO public.profiles (id, full_name, username, role)
  VALUES (NEW.id, _full_name, LOWER(SPLIT_PART(NEW.email, '@', 1)), _role);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  RETURN NEW;
END;
$function$;
