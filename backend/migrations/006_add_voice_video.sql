-- Migration 006: Add voice and video chat support

-- ============================================
-- VOICE CHANNEL STATE
-- ============================================

-- Create voice_channel_state table to track active voice sessions
CREATE TABLE IF NOT EXISTS voice_channel_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id)
);

CREATE INDEX IF NOT EXISTS idx_voice_channel_state_room_id ON voice_channel_state(room_id);

-- Enable RLS
ALTER TABLE voice_channel_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_channel_state
CREATE POLICY "Users can view voice channel state for rooms they can access"
  ON voice_channel_state FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rooms r
      JOIN room_members rm ON rm.room_id = r.id
      WHERE r.id = voice_channel_state.room_id
        AND rm.user_id = auth.uid()
    )
  );

-- ============================================
-- VOICE PARTICIPANTS
-- ============================================

-- Create voice_participants table for active voice channel users
CREATE TABLE IF NOT EXISTS voice_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_muted BOOLEAN DEFAULT false,
  is_deafened BOOLEAN DEFAULT false,
  is_video_enabled BOOLEAN DEFAULT false,
  is_screen_sharing BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_voice_participants_room_id ON voice_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_voice_participants_user_id ON voice_participants(user_id);

-- Enable RLS
ALTER TABLE voice_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_participants
CREATE POLICY "Users can view voice participants in rooms they can access"
  ON voice_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rooms r
      JOIN room_members rm ON rm.room_id = r.id
      WHERE r.id = voice_participants.room_id
        AND rm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own voice participation"
  ON voice_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice participation"
  ON voice_participants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice participation"
  ON voice_participants FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update voice_channel_state updated_at
CREATE TRIGGER update_voice_channel_state_updated_at BEFORE UPDATE ON voice_channel_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update voice_participants updated_at
CREATE TRIGGER update_voice_participants_updated_at BEFORE UPDATE ON voice_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

