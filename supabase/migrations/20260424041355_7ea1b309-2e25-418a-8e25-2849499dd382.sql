-- 1. Extend notification_type enum
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'attestation_confirmed';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'attestation_declined';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'evidence_required';

-- 2. Tighten UPDATE policy: users can only flip read; other columns stay locked via trigger
CREATE OR REPLACE FUNCTION public.prevent_notification_field_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.type IS DISTINCT FROM OLD.type
     OR NEW.message IS DISTINCT FROM OLD.message
     OR NEW.contract_id IS DISTINCT FROM OLD.contract_id
     OR NEW.execution_id IS DISTINCT FROM OLD.execution_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only read/email_sent/email_sent_at may be updated on notifications';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notifications_immutable_fields ON public.notifications;
CREATE TRIGGER notifications_immutable_fields
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_notification_field_change();

-- 3. Trigger: when execution becomes Pending + trigger_met, create settlement_due notification (dedupe on unread)
CREATE OR REPLACE FUNCTION public.notify_execution_settlement_due()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contract_name TEXT;
BEGIN
  IF NEW.status = 'Pending' AND NEW.trigger_met = true THEN
    -- Skip if an unread settlement_due already exists for this execution
    IF EXISTS (
      SELECT 1 FROM public.notifications
       WHERE execution_id = NEW.id
         AND type = 'settlement_due'
         AND read = false
    ) THEN
      RETURN NEW;
    END IF;

    SELECT name INTO contract_name FROM public.contracts WHERE id = NEW.contract_id;

    INSERT INTO public.notifications (user_id, type, contract_id, execution_id, message, read, email_sent)
    VALUES (
      NEW.user_id,
      'settlement_due',
      NEW.contract_id,
      NEW.id,
      'Payment due on ' || COALESCE(contract_name, 'this contract') ||
        '. Mark as settled when received.',
      false,
      false
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS executions_settlement_due_notif ON public.executions;
CREATE TRIGGER executions_settlement_due_notif
  AFTER INSERT OR UPDATE OF status, trigger_met
  ON public.executions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_execution_settlement_due();

-- 4. Trigger: when a trigger's current_value crosses threshold (Above), create trigger_met notification
CREATE OR REPLACE FUNCTION public.notify_trigger_threshold_crossed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.direction = 'Above'
     AND COALESCE(OLD.current_value, 0) < NEW.threshold_value
     AND NEW.current_value >= NEW.threshold_value THEN
    INSERT INTO public.notifications (user_id, type, contract_id, message, read, email_sent)
    VALUES (
      NEW.user_id,
      'trigger_met',
      NEW.contract_id,
      NEW.label || ' threshold reached. Log an execution against this contract.',
      false,
      false
    );
  ELSIF NEW.direction = 'Below'
        AND COALESCE(OLD.current_value, 0) > NEW.threshold_value
        AND NEW.current_value <= NEW.threshold_value THEN
    INSERT INTO public.notifications (user_id, type, contract_id, message, read, email_sent)
    VALUES (
      NEW.user_id,
      'trigger_met',
      NEW.contract_id,
      NEW.label || ' threshold reached. Log an execution against this contract.',
      false,
      false
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS triggers_threshold_crossed_notif ON public.triggers;
CREATE TRIGGER triggers_threshold_crossed_notif
  AFTER UPDATE OF current_value
  ON public.triggers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_trigger_threshold_crossed();

-- 5. Enable extensions for cron-driven overdue reminders
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;