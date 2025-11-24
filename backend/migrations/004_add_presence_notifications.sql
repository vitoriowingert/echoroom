-- Migration 004: Add presence, notifications, and enhanced features

-- ============================================
-- PRESENCE SYSTEM
-- ============================================

-- Create user_presence table for tracking online/offline status
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'offline', -- 'online', 'offline', 'away', 'busy'
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);

-- Enable RLS
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_presence
CREATE POLICY "Users can view all presence"
  ON user_presence FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own presence"
  ON user_presence FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own presence"
  ON user_presence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- NOTIFICATIONS SYSTEM
-- ============================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'mention', 'message', 'server_invite', etc.
  title VARCHAR(255) NOT NULL,
  content TEXT,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- UNREAD MESSAGES TRACKING
-- ============================================

-- Create user_room_reads table to track last read message per room
CREATE TABLE IF NOT EXISTS user_room_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  last_read_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, room_id)
);

CREATE INDEX IF NOT EXISTS idx_user_room_reads_user_id ON user_room_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_room_reads_room_id ON user_room_reads(room_id);

-- Enable RLS
ALTER TABLE user_room_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_room_reads
CREATE POLICY "Users can view their own read status"
  ON user_room_reads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own read status"
  ON user_room_reads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own read status"
  ON user_room_reads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CHANNEL TYPES AND CATEGORIES
-- ============================================

-- Add channel type and category to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS channel_type VARCHAR(20) DEFAULT 'text'; -- 'text', 'voice', 'category'
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES rooms(id) ON DELETE SET NULL;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_rooms_channel_type ON rooms(channel_type);
CREATE INDEX IF NOT EXISTS idx_rooms_category_id ON rooms(category_id);
CREATE INDEX IF NOT EXISTS idx_rooms_position ON rooms(position);

-- ============================================
-- MESSAGE REACTIONS
-- ============================================

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji VARCHAR(50) NOT NULL, -- Unicode emoji or custom emoji ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

-- Enable RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_reactions
CREATE POLICY "Users can view all reactions"
  ON message_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can add reactions"
  ON message_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
  ON message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update user_presence updated_at
CREATE TRIGGER update_user_presence_updated_at BEFORE UPDATE ON user_presence
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update user_room_reads updated_at
CREATE TRIGGER update_user_room_reads_updated_at BEFORE UPDATE ON user_room_reads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get unread message count for a user in a room
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID, p_room_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_last_read_at TIMESTAMP WITH TIME ZONE;
  v_count INTEGER;
BEGIN
  -- Get last read timestamp
  SELECT last_read_at INTO v_last_read_at
  FROM user_room_reads
  WHERE user_id = p_user_id AND room_id = p_room_id;

  -- If never read, count all messages
  IF v_last_read_at IS NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM messages
    WHERE room_id = p_room_id
      AND user_id != p_user_id
      AND deleted_at IS NULL;
  ELSE
    -- Count messages after last read
    SELECT COUNT(*) INTO v_count
    FROM messages
    WHERE room_id = p_room_id
      AND user_id != p_user_id
      AND deleted_at IS NULL
      AND created_at > v_last_read_at;
  END IF;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

