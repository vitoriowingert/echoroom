import { supabaseService, Server } from './supabase.service';
import { NotFoundError, AuthorizationError } from '../utils/errors';

export interface CreateServerDto {
  name: string;
  description?: string;
  iconUrl?: string;
  createdBy: string;
}

export interface UpdateServerDto {
  name?: string;
  description?: string;
  iconUrl?: string;
}

export class ServerService {
  async createServer(dto: CreateServerDto): Promise<Server> {
    // Create server - the database trigger will automatically add creator as server member with 'owner' role
    const server = await supabaseService.createServer(
      dto.name,
      dto.description || null,
      dto.iconUrl || null,
      dto.createdBy
    );

    // Verify the member was added (trigger should have done this)
    // If for some reason it wasn't, add it explicitly
    const member = await supabaseService.getServerMember(server.id, dto.createdBy);
    if (!member) {
      // Fallback: explicitly add creator as owner if trigger didn't work
      await supabaseService.addServerMember(server.id, dto.createdBy, 'owner');
    }

    return server;
  }

  async getServerById(serverId: string): Promise<Server | null> {
    return await supabaseService.getServerById(serverId);
  }

  async getAllServers(): Promise<Server[]> {
    return await supabaseService.getAllServers();
  }

  async getUserServers(userId: string): Promise<Server[]> {
    return await supabaseService.getUserServers(userId);
  }

  async updateServer(serverId: string, dto: UpdateServerDto, userId: string): Promise<Server> {
    const server = await supabaseService.getServerById(serverId);

    if (!server) {
      throw new NotFoundError(`Server ${serverId} not found`, 'server');
    }

    // Check if user is owner or admin
    const member = await supabaseService.getServerMember(serverId, userId);
    if (server.created_by !== userId && (!member || !['owner', 'admin'].includes(member.role))) {
      throw new AuthorizationError(
        `User ${userId} is not authorized to update server ${serverId}`,
        'server'
      );
    }

    const updates: { name?: string; description?: string | null; icon_url?: string | null } = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.description !== undefined) updates.description = dto.description || null;
    if (dto.iconUrl !== undefined) updates.icon_url = dto.iconUrl || null;

    return await supabaseService.updateServer(serverId, updates);
  }

  async deleteServer(serverId: string, userId: string): Promise<void> {
    const server = await supabaseService.getServerById(serverId);

    if (!server) {
      throw new NotFoundError(`Server ${serverId} not found`, 'server');
    }

    if (server.created_by !== userId) {
      throw new AuthorizationError(
        `User ${userId} is not authorized to delete server ${serverId}`,
        'server'
      );
    }

    await supabaseService.deleteServer(serverId);
  }

  async joinServer(serverId: string, userId: string): Promise<void> {
    const server = await supabaseService.getServerById(serverId);

    if (!server) {
      throw new NotFoundError(`Server ${serverId} not found`, 'server');
    }

    await supabaseService.addServerMember(serverId, userId);
  }

  async leaveServer(serverId: string, userId: string): Promise<void> {
    await supabaseService.removeServerMember(serverId, userId);
  }

  async getServerMembers(serverId: string): Promise<any[]> {
    return await supabaseService.getServerMembers(serverId);
  }
}

export const serverService = new ServerService();

