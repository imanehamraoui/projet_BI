-- Infirmier access to agenda for soins/planning integration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'infirmier_agenda' AND tablename = 'faits_agenda'
  ) THEN
    CREATE POLICY infirmier_agenda ON faits_agenda
      FOR SELECT TO role_infirmier USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'infirmier_agenda_update' AND tablename = 'faits_agenda'
  ) THEN
    CREATE POLICY infirmier_agenda_update ON faits_agenda
      FOR UPDATE TO role_infirmier USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT SELECT, UPDATE ON faits_agenda TO role_infirmier;
