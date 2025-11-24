import { supabaseService, Message } from './supabase.service';
import { NotFoundError, AuthorizationError, ValidationError } from '../utils/errors';

export interface CreateMessageDto {
  roomId: string;
  userId: string;
  content: string;
  messageType?: string;
  metadata?: Record<string, unknown>;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  thumbnailUrl?: string;
}

export interface UpdateMessageDto {
  content?: string;
  metadata?: Record<string, unknown>;
}

export class MessageService {
  async createMessage(dto: CreateMessageDto): Promise<Message> {
    // Validate content or file
    if ((!dto.content || dto.content.trim().length === 0) && !dto.fileUrl) {
      throw new ValidationError('Message content or file is required', 'content');
    }

    if (dto.content.length > 10000) {
      throw new ValidationError('Message content exceeds maximum length of 10000 characters', 'content');
    }

    // Verify user is a member of the room
    const members = await supabaseService.getRoomMembers(dto.roomId);
    const isMember = members.some((member) => member.user_id === dto.userId);

    if (!isMember) {
      throw new AuthorizationError(
        `User ${dto.userId} is not a member of room ${dto.roomId}`,
        'room'
      );
    }

    return await supabaseService.createMessage(
      dto.roomId,
      dto.userId,
      dto.content?.trim() || '',
      dto.messageType || (dto.fileUrl ? 'file' : 'text'),
      dto.metadata,
      dto.fileUrl,
      dto.fileName,
      dto.fileSize,
      dto.fileType,
      dto.thumbnailUrl
    );
  }

  async getMessagesByRoom(roomId: string, limit = 100, offset = 0): Promise<Message[]> {
    return await supabaseService.getMessagesByRoom(roomId, limit, offset);
  }

  async searchMessages(roomId: string, query: string, limit = 50): Promise<Message[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    // Verify room exists and has members
    const members = await supabaseService.getRoomMembers(roomId);
    if (members.length === 0) {
      throw new NotFoundError(`Room ${roomId} not found or has no members`, 'room');
    }

    return await supabaseService.searchMessages(roomId, query.trim(), limit);
  }

  async getMessagesByRooms(roomIds: string[], since?: Date): Promise<Message[]> {
    if (roomIds.length === 0) {
      return [];
    }

    // Validate roomIds are UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const roomId of roomIds) {
      if (!uuidRegex.test(roomId)) {
        throw new ValidationError(`Invalid room ID format: ${roomId}`, 'roomId');
      }
    }

    return await supabaseService.getMessagesByRooms(roomIds, since);
  }

  async getMessageById(messageId: string): Promise<Message | null> {
    return await supabaseService.getMessageById(messageId);
  }

  async updateMessage(
    messageId: string,
    dto: UpdateMessageDto,
    userId: string
  ): Promise<Message> {
    // Validate messageId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(messageId)) {
      throw new ValidationError(`Invalid message ID format: ${messageId}`, 'messageId');
    }

    // Validate content if provided
    if (dto.content !== undefined) {
      if (!dto.content || dto.content.trim().length === 0) {
        throw new ValidationError('Message content cannot be empty', 'content');
      }
      if (dto.content.length > 10000) {
        throw new ValidationError('Message content exceeds maximum length of 10000 characters', 'content');
      }
    }

    const message = await supabaseService.getMessageById(messageId);

    if (!message) {
      throw new NotFoundError(`Message ${messageId} not found`, 'message');
    }

    if (message.user_id !== userId) {
      throw new AuthorizationError(
        `User ${userId} is not authorized to update message ${messageId}`,
        'message'
      );
    }

    const updates: Partial<Message> = {};
    if (dto.content !== undefined) {
      updates.content = dto.content.trim();
    }
    if (dto.metadata !== undefined) {
      updates.metadata = dto.metadata;
    }

    return await supabaseService.updateMessage(messageId, updates);
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    // Validate messageId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(messageId)) {
      throw new ValidationError(`Invalid message ID format: ${messageId}`, 'messageId');
    }

    const message = await supabaseService.getMessageById(messageId);

    if (!message) {
      throw new NotFoundError(`Message ${messageId} not found`, 'message');
    }

    if (message.user_id !== userId) {
      throw new AuthorizationError(
        `User ${userId} is not authorized to delete message ${messageId}`,
        'message'
      );
    }

    await supabaseService.deleteMessage(messageId);
  }
}

export const messageService = new MessageService();

