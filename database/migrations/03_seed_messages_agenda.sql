-- ================================================================
-- SEED 03 : DONNEES MESSAGES ET AGENDA
-- ================================================================

-- SEED MESSAGES
INSERT INTO dim_message (expediteur, role_expediteur, avatar, sujet, contenu, heure, lu, medecin_id) VALUES
('Dr. Alaoui', 'Médecin', 'A', 'Patient El Idrissi — Résultats analyses', 'Bonjour, les résultats des analyses du patient El Idrissi sont arrivés. Les valeurs cardiaques sont préoccupantes. Je vous recommande une consultation urgente.', '09:15', false, (SELECT medecin_id FROM dim_medecin WHERE matricule = 'MED-010')),
('Marie Admin', 'Administratif', 'M', 'Rappel RDV demain 14h', 'Bonjour Docteur, je vous rappelle que vous avez une réunion du service cardiologie demain à 14h en salle de conférence B.', '08:45', false, (SELECT medecin_id FROM dim_medecin WHERE matricule = 'MED-010')),
('Prof. Rhanem', 'Chercheur', 'R', 'Collaboration étude diabète', 'Bonjour, dans le cadre de notre étude sur le diabète de type 2, nous aurions besoin de votre expertise. Seriez-vous disponible pour une réunion cette semaine ?', 'Hier', true, (SELECT medecin_id FROM dim_medecin WHERE matricule = 'MED-010')),
('Sophie Inf.', 'Infirmier', 'S', 'Patient chambre 12 — Tension élevée', 'Docteur, la tension du patient en chambre 12 est à 18/11. Il se plaint de maux de tête. Faut-il lui administrer un médicament d''urgence ?', 'Hier', true, (SELECT medecin_id FROM dim_medecin WHERE matricule = 'MED-010')),
('Directeur CHU', 'Directeur', 'D', 'Réunion mensuelle — Jeudi 10h', 'Bonjour à tous, je vous convie à la réunion mensuelle du corps médical jeudi prochain à 10h. Ordre du jour : bilan des consultations et protocoles.', 'Lun', true, (SELECT medecin_id FROM dim_medecin WHERE matricule = 'MED-010'));

-- SEED AGENDA
INSERT INTO faits_agenda (medecin_id, patient, type_rdv, heure, duree, service, statut, date_rdv) VALUES
((SELECT medecin_id FROM dim_medecin WHERE matricule = 'MED-010'), 'El Idrissi Youssef', 'Consultation', '09:00', '30 min', 'Cardiologie', 'Confirmé', CURRENT_DATE),
((SELECT medecin_id FROM dim_medecin WHERE matricule = 'MED-010'), 'Benali Fatima', 'Suivi', '09:30', '20 min', 'Neurologie', 'Confirmé', CURRENT_DATE),
((SELECT medecin_id FROM dim_medecin WHERE matricule = 'MED-010'), 'Alaoui Mohamed', 'Urgence', '10:00', '45 min', 'Cardiologie', 'En attente', CURRENT_DATE),
((SELECT medecin_id FROM dim_medecin WHERE matricule = 'MED-010'), 'Chraibi Sara', 'Consultation', '11:00', '30 min', 'Pédiatrie', 'Confirmé', CURRENT_DATE),
((SELECT medecin_id FROM dim_medecin WHERE matricule = 'MED-010'), 'Tazi Ahmed', 'Suivi', '14:00', '20 min', 'Cardiologie', 'Confirmé', CURRENT_DATE),
((SELECT medecin_id FROM dim_medecin WHERE matricule = 'MED-010'), 'Berrada Khadija', 'Consultation', '14:30', '30 min', 'Neurologie', 'En attente', CURRENT_DATE),
((SELECT medecin_id FROM dim_medecin WHERE matricule = 'MED-010'), 'Mansouri Omar', 'Suivi', '15:30', '20 min', 'Cardiologie', 'Annulé', CURRENT_DATE);
