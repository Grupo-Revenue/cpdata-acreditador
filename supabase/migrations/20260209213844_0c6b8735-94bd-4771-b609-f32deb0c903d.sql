
-- Add ranking column to profiles (1-7 range)
ALTER TABLE profiles ADD COLUMN ranking integer DEFAULT NULL;
ALTER TABLE profiles ADD CONSTRAINT ranking_range CHECK (ranking IS NULL OR (ranking >= 1 AND ranking <= 7));

-- Add hubspot_deal_id to events for linking HubSpot deals
ALTER TABLE events ADD COLUMN hubspot_deal_id text UNIQUE;
