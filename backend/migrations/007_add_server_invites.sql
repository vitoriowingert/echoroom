-- Migration 007: Add server invites system

-- ============================================
-- SERVER INVITES
-- ============================================

-- Create server_invites table
CREATE TABLE IF NOT EXISTS server_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_server_invites_server_id ON server_invites(server_id);
CREATE INDEX IF NOT EXISTS idx_server_invites_code ON server_invites(code);
CREATE INDEX IF NOT EXISTS idx_server_invites_created_by ON server_invites(created_by);

-- Enable RLS
ALTER TABLE server_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for server_invites
CREATE POLICY "Users can view invites for servers they are members of"
  ON server_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = server_invites.server_id
        AND server_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create invites for servers they are members of"
  ON server_invites FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = server_invites.server_id
        AND server_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invites they created"
  ON server_invites FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete invites they created"
  ON server_invites FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update server_invites updated_at
CREATE TRIGGER update_server_invites_updated_at BEFORE UPDATE ON server_invites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

