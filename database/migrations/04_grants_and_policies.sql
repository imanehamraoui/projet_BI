-- Allow backend user to assume application roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_auth_members m
    JOIN pg_roles r ON m.roleid = r.oid
    JOIN pg_roles u ON m.member = u.oid
    WHERE r.rolname = 'role_medecin' AND u.rolname = 'hopital_admin') THEN
    GRANT role_medecin TO hopital_admin;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_auth_members m
    JOIN pg_roles r ON m.roleid = r.oid
    JOIN pg_roles u ON m.member = u.oid
    WHERE r.rolname = 'role_administratif' AND u.rolname = 'hopital_admin') THEN
    GRANT role_administratif TO hopital_admin;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_auth_members m
    JOIN pg_roles r ON m.roleid = r.oid
    JOIN pg_roles u ON m.member = u.oid
    WHERE r.rolname = 'role_chercheur' AND u.rolname = 'hopital_admin') THEN
    GRANT role_chercheur TO hopital_admin;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_auth_members m
    JOIN pg_roles r ON m.roleid = r.oid
    JOIN pg_roles u ON m.member = u.oid
    WHERE r.rolname = 'role_infirmier' AND u.rolname = 'hopital_admin') THEN
    GRANT role_infirmier TO hopital_admin;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_auth_members m
    JOIN pg_roles r ON m.roleid = r.oid
    JOIN pg_roles u ON m.member = u.oid
    WHERE r.rolname = 'role_directeur' AND u.rolname = 'hopital_admin') THEN
    GRANT role_directeur TO hopital_admin;
  END IF;
END $$;

-- Ensure medecin can insert messages and agenda rows under RLS
DROP POLICY IF EXISTS medecin_message ON dim_message;
CREATE POLICY medecin_message ON dim_message
  FOR ALL TO role_medecin USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS medecin_agenda ON faits_agenda;
CREATE POLICY medecin_agenda ON faits_agenda
  FOR ALL TO role_medecin USING (true) WITH CHECK (true);
