import { MessageService } from '../../services/message.service';
import { supabaseService } from '../../services/supabase.service';

jest.mock('../../services/supabase.service');

describe('MessageService', () => {
  let messageService: MessageService;
  const mockSupabaseService = supabaseService as jest.Mocked<typeof supabaseService>;

  beforeEach(() => {
    messageService = new MessageService();
    jest.clearAllMocks();
  });

  describe('createMessage', () => {
    it('should create a message if user is a room member', async () => {
      const mockMessage = {
        id: 'msg-1',
        room_id: 'room-1',
        user_id: 'user-1',
        content: 'Test message',
        message_type: 'text',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseService.getRoomMembers.mockResolvedValue([
        {
          id: 'member-1',
          room_id: 'room-1',
          user_id: 'user-1',
          joined_at: new Date().toISOString(),
        },
      ]);
      mockSupabaseService.createMessage.mockResolvedValue(mockMessage);

      const result = await messageService.createMessage({
        roomId: 'room-1',
        userId: 'user-1',
        content: 'Test message',
      });

      expect(result).toEqual(mockMessage);
      expect(mockSupabaseService.createMessage).toHaveBeenCalledWith(
        'room-1',
        'user-1',
        'Test message',
        'text',
        undefined
      );
    });

    it('should throw error if user is not a room member', async () => {
      mockSupabaseService.getRoomMembers.mockResolvedValue([]);

      await expect(
        messageService.createMessage({
          roomId: 'room-1',
          userId: 'user-1',
          content: 'Test message',
        })
      ).rejects.toThrow('User is not a member of this room');
    });
  });

  describe('getMessagesByRoom', () => {
    it('should return messages for a room', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          room_id: 'room-1',
          user_id: 'user-1',
          content: 'Message 1',
          message_type: 'text',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          room_id: 'room-1',
          user_id: 'user-2',
          content: 'Message 2',
          message_type: 'text',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockSupabaseService.getMessagesByRoom.mockResolvedValue(mockMessages);

      const result = await messageService.getMessagesByRoom('room-1', 100, 0);

      expect(result).toEqual(mockMessages);
      expect(mockSupabaseService.getMessagesByRoom).toHaveBeenCalledWith('room-1', 100, 0);
    });
  });

  describe('updateMessage', () => {
    it('should update message if user is the author', async () => {
      const mockMessage = {
        id: 'msg-1',
        room_id: 'room-1',
        user_id: 'user-1',
        content: 'Original message',
        message_type: 'text',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedMessage = { ...mockMessage, content: 'Updated message' };

      mockSupabaseService.getMessageById.mockResolvedValue(mockMessage);
      mockSupabaseService.updateMessage.mockResolvedValue(updatedMessage);

      const result = await messageService.updateMessage('msg-1', { content: 'Updated message' }, 'user-1');

      expect(result).toEqual(updatedMessage);
      expect(mockSupabaseService.updateMessage).toHaveBeenCalledWith('msg-1', {
        content: 'Updated message',
      });
    });

    it('should throw error if user is not the author', async () => {
      const mockMessage = {
        id: 'msg-1',
        room_id: 'room-1',
        user_id: 'user-1',
        content: 'Original message',
        message_type: 'text',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseService.getMessageById.mockResolvedValue(mockMessage);

      await expect(
        messageService.updateMessage('msg-1', { content: 'Updated message' }, 'user-2')
      ).rejects.toThrow('Unauthorized: Only message author can update the message');
    });
  });

  describe('deleteMessage', () => {
    it('should delete message if user is the author', async () => {
      const mockMessage = {
        id: 'msg-1',
        room_id: 'room-1',
        user_id: 'user-1',
        content: 'Message to delete',
        message_type: 'text',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseService.getMessageById.mockResolvedValue(mockMessage);
      mockSupabaseService.deleteMessage.mockResolvedValue();

      await messageService.deleteMessage('msg-1', 'user-1');

      expect(mockSupabaseService.deleteMessage).toHaveBeenCalledWith('msg-1');
    });

    it('should throw error if user is not the author', async () => {
      const mockMessage = {
        id: 'msg-1',
        room_id: 'room-1',
        user_id: 'user-1',
        content: 'Message to delete',
        message_type: 'text',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseService.getMessageById.mockResolvedValue(mockMessage);

      await expect(messageService.deleteMessage('msg-1', 'user-2')).rejects.toThrow(
        'Unauthorized: Only message author can delete the message'
      );
    });
  });
});

