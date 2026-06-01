-- Fil de discussion pour les messages
ALTER TABLE dim_message
  ADD COLUMN IF NOT EXISTS parent_message_id INTEGER REFERENCES dim_message(message_id);

CREATE INDEX IF NOT EXISTS idx_message_parent ON dim_message(parent_message_id);

-- Corriger les sujets Re: Re: ... existants
UPDATE dim_message
SET sujet = REGEXP_REPLACE(sujet, '^(Re:\s*)+', '', 'i')
WHERE sujet ~* '^(Re:\s*)+';
