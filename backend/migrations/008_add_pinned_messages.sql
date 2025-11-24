-- Migration 008: Add pinned messages support

-- ============================================
-- PINNED MESSAGES
-- ============================================

-- Create pinned_messages table
CREATE TABLE IF NOT EXISTS pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id)
);

CREATE INDEX IF NOT EXISTS idx_pinned_messages_room_id ON pinned_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_pinned_messages_message_id ON pinned_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_pinned_messages_pinned_by ON pinned_messages(pinned_by);

-- Enable RLS
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pinned_messages
CREATE POLICY "Users can view pinned messages in rooms they can access"
  ON pinned_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_members.room_id = pinned_messages.room_id
        AND room_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can pin messages in rooms they are members of"
  ON pinned_messages FOR INSERT
  WITH CHECK (
    auth.uid() = pinned_by
    AND EXISTS (
      SELECT 1 FROM room_members
      WHERE room_members.room_id = pinned_messages.room_id
        AND room_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can unpin messages they pinned or in rooms they moderate"
  ON pinned_messages FOR DELETE
  USING (
    auth.uid() = pinned_by
    OR EXISTS (
      SELECT 1 FROM room_members rm
      JOIN server_members sm ON sm.server_id = (
        SELECT server_id FROM rooms WHERE id = pinned_messages.room_id
      )
      WHERE rm.room_id = pinned_messages.room_id
        AND sm.user_id = auth.uid()
        AND sm.role IN ('owner', 'admin')
    )
  );

