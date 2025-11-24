-- Create servers table
CREATE TABLE IF NOT EXISTS servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create server_members table (for tracking who is in which server)
CREATE TABLE IF NOT EXISTS server_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- 'owner', 'admin', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(server_id, user_id)
);

-- Add server_id to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS server_id UUID REFERENCES servers(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_servers_created_by ON servers(created_by);
CREATE INDEX IF NOT EXISTS idx_server_members_server_id ON server_members(server_id);
CREATE INDEX IF NOT EXISTS idx_server_members_user_id ON server_members(user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_server_id ON rooms(server_id);

-- Enable Row Level Security
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for servers
CREATE POLICY "Users can view servers they are members of"
  ON servers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = servers.id
      AND server_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create servers"
  ON servers FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Server owners can update their servers"
  ON servers FOR UPDATE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = servers.id
      AND server_members.user_id = auth.uid()
      AND server_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Server owners can delete their servers"
  ON servers FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for server_members
CREATE POLICY "Users can view server members of servers they belong to"
  ON server_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Server owners can add members"
  ON server_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM servers
      WHERE servers.id = server_members.server_id
      AND servers.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can join servers"
  ON server_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave servers"
  ON server_members FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Server owners and admins can remove members"
  ON server_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM servers
      WHERE servers.id = server_members.server_id
      AND servers.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  );

-- Update RLS policy for rooms to check server membership
DROP POLICY IF EXISTS "Users can view all rooms" ON rooms;
CREATE POLICY "Users can view rooms in servers they are members of"
  ON rooms FOR SELECT
  USING (
    server_id IS NULL
    OR EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = rooms.server_id
      AND server_members.user_id = auth.uid()
    )
  );

-- Update RLS policy for room creation to check server membership
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
CREATE POLICY "Users can create rooms in servers they are members of"
  ON rooms FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND (
      server_id IS NULL
      OR EXISTS (
        SELECT 1 FROM server_members
        WHERE server_members.server_id = rooms.server_id
        AND server_members.user_id = auth.uid()
      )
    )
  );

-- Trigger to automatically update updated_at
CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON servers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically add server creator as owner member
CREATE OR REPLACE FUNCTION add_server_owner_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO server_members (server_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner')
  ON CONFLICT (server_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically add creator as server member
CREATE TRIGGER add_server_owner_on_create AFTER INSERT ON servers
  FOR EACH ROW EXECUTE FUNCTION add_server_owner_member();

