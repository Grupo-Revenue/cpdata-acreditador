CREATE POLICY "Users can update own accreditor record"
  ON event_accreditors FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());