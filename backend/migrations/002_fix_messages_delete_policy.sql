-- Fix messages delete policy: change FOR UPDATE to FOR DELETE
-- The original migration incorrectly used FOR UPDATE instead of FOR DELETE

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- Create the correct delete policy
CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  USING (auth.uid() = user_id);

