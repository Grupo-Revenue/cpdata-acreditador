CREATE POLICY "Event members can view co-assigned accreditors"
  ON event_accreditors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_accreditors ea
      WHERE ea.event_id = event_accreditors.event_id
        AND ea.user_id = auth.uid()
    )
  );