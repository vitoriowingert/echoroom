import { supabaseService } from './supabase.service';
import { supabaseAdminClient } from '../config/supabase';
import { DatabaseError, NotFoundError, ValidationError, parseDatabaseError } from '../utils/errors';

export interface ServerInvite {
  id: string;
  server_id: string;
  code: string;
  created_by: string;
  expires_at?: string;
  max_uses?: number;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateInviteDto {
  serverId: string;
  expiresAt?: Date;
  maxUses?: number;
}

export class InviteService {
  // Generate a unique invite code
  private generateInviteCode(): string {
    // Generate a random alphanumeric code (8 characters)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Create a new invite
  async createInvite(userId: string, dto: CreateInviteDto): Promise<ServerInvite> {
    const { serverId, expiresAt, maxUses } = dto;

    // Verify server exists
    const server = await supabaseService.getServerById(serverId);
    if (!server) {
      throw new NotFoundError(`Server ${serverId} not found`, 'server');
    }

    // Verify user is a member of the server
    const member = await supabaseService.getServerMember(serverId, userId);
    if (!member) {
      throw new ValidationError('You must be a member of the server to create invites');
    }

    // Generate unique code
    let code = this.generateInviteCode();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure code is unique
    while (attempts < maxAttempts) {
      const existing = await this.getInviteByCode(code);
      if (!existing) {
        break;
      }
      code = this.generateInviteCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new DatabaseError('Failed to generate unique invite code');
    }

    // Create invite
    const { data, error } = await supabaseAdminClient
      .from('server_invites')
      .insert({
        server_id: serverId,
        code,
        created_by: userId,
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        max_uses: maxUses || null,
        use_count: 0,
      })
      .select()
      .single();

    if (error) {
      throw parseDatabaseError(error, 'Failed to create invite');
    }

    if (!data) {
      throw new DatabaseError('Invite creation succeeded but no data returned');
    }

    return data as ServerInvite;
  }

  // Get invite by code
  async getInviteByCode(code: string): Promise<ServerInvite | null> {
    const { data, error } = await supabaseAdminClient
      .from('server_invites')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw parseDatabaseError(error, 'Failed to get invite');
    }

    return data as ServerInvite | null;
  }

  // Get invite by ID
  async getInviteById(inviteId: string): Promise<ServerInvite | null> {
    const { data, error } = await supabaseAdminClient
      .from('server_invites')
      .select('*')
      .eq('id', inviteId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw parseDatabaseError(error, 'Failed to get invite');
    }

    return data as ServerInvite | null;
  }

  // Get all invites for a server
  async getServerInvites(serverId: string, userId: string): Promise<ServerInvite[]> {
    // Verify user is a member
    const member = await supabaseService.getServerMember(serverId, userId);
    if (!member) {
      throw new ValidationError('You must be a member of the server to view invites');
    }

    const { data, error } = await supabaseAdminClient
      .from('server_invites')
      .select('*')
      .eq('server_id', serverId)
      .order('created_at', { ascending: false });

    if (error) {
      throw parseDatabaseError(error, 'Failed to get server invites');
    }

    return (data || []) as ServerInvite[];
  }

  // Validate invite (check if it's valid and can be used)
  async validateInvite(code: string): Promise<{ valid: boolean; invite?: ServerInvite; error?: string }> {
    const invite = await this.getInviteByCode(code);

    if (!invite) {
      return { valid: false, error: 'Invite code not found' };
    }

    // Check expiration
    if (invite.expires_at) {
      const expiresAt = new Date(invite.expires_at);
      if (expiresAt < new Date()) {
        return { valid: false, error: 'Invite code has expired' };
      }
    }

    // Check max uses
    if (invite.max_uses && invite.use_count >= invite.max_uses) {
      return { valid: false, error: 'Invite code has reached maximum uses' };
    }

    return { valid: true, invite };
  }

  // Accept invite (join server using invite code)
  async acceptInvite(code: string, userId: string): Promise<void> {
    const validation = await this.validateInvite(code);

    if (!validation.valid || !validation.invite) {
      throw new ValidationError(validation.error || 'Invalid invite code');
    }

    const invite = validation.invite;

    // Check if user is already a member
    const existingMember = await supabaseService.getServerMember(invite.server_id, userId);
    if (existingMember) {
      // Still increment use count even if already a member
      await this.incrementUseCount(invite.id);
      return;
    }

    // Add user to server
    await supabaseService.addServerMember(invite.server_id, userId);

    // Increment use count
    await this.incrementUseCount(invite.id);
  }

  // Increment use count
  private async incrementUseCount(inviteId: string): Promise<void> {
    // Get current count and increment
    const invite = await this.getInviteById(inviteId);
    if (!invite) {
      throw new NotFoundError('Invite not found', 'invite');
    }

    const { error } = await supabaseAdminClient
      .from('server_invites')
      .update({ use_count: invite.use_count + 1 })
      .eq('id', inviteId);

    if (error) {
      throw parseDatabaseError(error, 'Failed to increment invite use count');
    }
  }

  // Delete invite
  async deleteInvite(inviteId: string, userId: string): Promise<void> {
    // Verify user created the invite
    const invite = await this.getInviteById(inviteId);
    if (!invite) {
      throw new NotFoundError('Invite not found', 'invite');
    }

    if (invite.created_by !== userId) {
      throw new ValidationError('You can only delete invites you created');
    }

    const { error } = await supabaseAdminClient
      .from('server_invites')
      .delete()
      .eq('id', inviteId);

    if (error) {
      throw parseDatabaseError(error, 'Failed to delete invite');
    }
  }
}

export const inviteService = new InviteService();

