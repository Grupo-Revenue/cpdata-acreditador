
CREATE OR REPLACE FUNCTION public.sync_contract_signed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.event_accreditors
  SET contract_status = 'firmado'
  WHERE user_id = NEW.user_id AND event_id = NEW.event_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_contract_signed ON public.digital_signatures;
CREATE TRIGGER trg_sync_contract_signed
AFTER INSERT ON public.digital_signatures
FOR EACH ROW EXECUTE FUNCTION public.sync_contract_signed();

UPDATE public.event_accreditors ea
SET contract_status = 'firmado'
FROM public.digital_signatures ds
WHERE ds.user_id = ea.user_id
  AND ds.event_id = ea.event_id
  AND ea.contract_status <> 'firmado';
