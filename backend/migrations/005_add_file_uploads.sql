-- Migration 005: Add file upload support with Supabase Storage

-- ============================================
-- FILE UPLOADS
-- ============================================

-- Add file metadata columns to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_type VARCHAR(100);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Create message_attachments table for multiple file support
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(100),
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);

-- Enable RLS
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_attachments
CREATE POLICY "Users can view attachments in rooms they can access"
  ON message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN room_members rm ON rm.room_id = m.room_id
      WHERE m.id = message_attachments.message_id
        AND rm.user_id = auth.uid()
    )
  );

-- ============================================
-- SUPABASE STORAGE BUCKETS
-- ============================================

-- Note: These buckets need to be created in Supabase Dashboard > Storage
-- or via Supabase Management API. This migration documents the required buckets.

-- Required buckets:
-- 1. 'avatars' - User profile pictures
--   - Public: false
--   - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
--   - Max file size: 5MB
--   - Policies:
--     * Users can upload their own avatar
--     * Everyone can view avatars

-- 2. 'server-icons' - Server icons
--   - Public: false
--   - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
--   - Max file size: 5MB
--   - Policies:
--     * Server owners/admins can upload icons
--     * Server members can view icons

-- 3. 'message-attachments' - Message files and images
--   - Public: false
--   - Allowed MIME types: image/*, video/*, audio/*, application/pdf, etc.
--   - Max file size: 25MB
--   - Policies:
--     * Users can upload attachments to rooms they're members of
--     * Users can view attachments in rooms they're members of
--     * Users can delete their own attachments

-- Storage policies should be created via Supabase Dashboard or API
-- Example RLS policies for storage (created via Supabase Dashboard):

-- Bucket: avatars
-- Policy: "Users can upload their own avatar"
-- INSERT: auth.uid()::text = (storage.foldername(name))[1]

-- Policy: "Anyone can view avatars"
-- SELECT: true

-- Bucket: server-icons
-- Policy: "Server owners/admins can upload icons"
-- INSERT: EXISTS (
--   SELECT 1 FROM servers s
--   JOIN server_members sm ON sm.server_id = s.id
--   WHERE s.id::text = (storage.foldername(name))[1]
--     AND sm.user_id = auth.uid()
--     AND sm.role IN ('owner', 'admin')
-- )

-- Policy: "Server members can view icons"
-- SELECT: EXISTS (
--   SELECT 1 FROM servers s
--   JOIN server_members sm ON sm.server_id = s.id
--   WHERE s.id::text = (storage.foldername(name))[1]
--     AND sm.user_id = auth.uid()
-- )

-- Bucket: message-attachments
-- Policy: "Users can upload attachments"
-- INSERT: EXISTS (
--   SELECT 1 FROM rooms r
--   JOIN room_members rm ON rm.room_id = r.id
--   WHERE r.id::text = (storage.foldername(name))[1]
--     AND rm.user_id = auth.uid()
-- )

-- Policy: "Users can view attachments in accessible rooms"
-- SELECT: EXISTS (
--   SELECT 1 FROM rooms r
--   JOIN room_members rm ON rm.room_id = r.id
--   WHERE r.id::text = (storage.foldername(name))[1]
--     AND rm.user_id = auth.uid()
-- )

-- Policy: "Users can delete their own attachments"
-- DELETE: EXISTS (
--   SELECT 1 FROM messages m
--   WHERE m.id::text = (storage.foldername(name))[2]
--     AND m.user_id = auth.uid()
-- )

