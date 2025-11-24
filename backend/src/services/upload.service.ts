import { supabaseAdminClient } from '../config/supabase';
import { ValidationError, AuthorizationError } from '../utils/errors';
import { supabaseService } from './supabase.service';

export interface UploadResult {
  url: string;
  path: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export interface ImageMetadata {
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

export class UploadService {
  private readonly MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
  private readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB for images
  private readonly MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB for avatars
  private readonly MAX_SERVER_ICON_SIZE = 5 * 1024 * 1024; // 5MB for server icons

  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private readonly ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
  private readonly ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/ogg', 'audio/wav'];
  private readonly ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  /**
   * Upload file to message attachments bucket
   */
  async uploadMessageAttachment(
    file: Express.Multer.File,
    roomId: string,
    userId: string
  ): Promise<UploadResult> {
    // Verify user is a member of the room
    const members = await supabaseService.getRoomMembers(roomId);
    const isMember = members.some((member) => member.user_id === userId);

    if (!isMember) {
      throw new AuthorizationError(`User ${userId} is not a member of room ${roomId}`, 'room');
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new ValidationError(`File size exceeds maximum of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`, 'file');
    }

    // Generate unique file name
    const fileExt = this.getFileExtension(file.originalname);
    const fileName = `${roomId}/${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdminClient.storage
      .from('message-attachments')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new ValidationError(`Failed to upload file: ${error.message}`, 'file');
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdminClient.storage.from('message-attachments').getPublicUrl(fileName);

    return {
      url: publicUrl,
      path: fileName,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
    };
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(file: Express.Multer.File, userId: string): Promise<UploadResult> {
    // Validate file size
    if (file.size > this.MAX_AVATAR_SIZE) {
      throw new ValidationError(`Avatar size exceeds maximum of ${this.MAX_AVATAR_SIZE / 1024 / 1024}MB`, 'file');
    }

    // Validate file type
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new ValidationError('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed', 'file');
    }

    const fileExt = this.getFileExtension(file.originalname);
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabaseAdminClient.storage.from('avatars').upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true, // Replace existing avatar
    });

    if (error) {
      throw new ValidationError(`Failed to upload avatar: ${error.message}`, 'file');
    }

    const {
      data: { publicUrl },
    } = supabaseAdminClient.storage.from('avatars').getPublicUrl(fileName);

    return {
      url: publicUrl,
      path: fileName,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
    };
  }

  /**
   * Upload server icon
   */
  async uploadServerIcon(
    file: Express.Multer.File,
    serverId: string,
    userId: string
  ): Promise<UploadResult> {
    // Verify user has permission (owner or admin)
    const server = await supabaseService.getServerById(serverId);
    if (!server) {
      throw new ValidationError(`Server ${serverId} not found`, 'server');
    }

    const member = await supabaseService.getServerMember(serverId, userId);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      throw new AuthorizationError(
        `User ${userId} is not authorized to upload server icon`,
        'server'
      );
    }

    // Validate file size
    if (file.size > this.MAX_SERVER_ICON_SIZE) {
      throw new ValidationError(
        `Server icon size exceeds maximum of ${this.MAX_SERVER_ICON_SIZE / 1024 / 1024}MB`,
        'file'
      );
    }

    // Validate file type
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new ValidationError('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed', 'file');
    }

    const fileExt = this.getFileExtension(file.originalname);
    const fileName = `${serverId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabaseAdminClient.storage.from('server-icons').upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

    if (error) {
      throw new ValidationError(`Failed to upload server icon: ${error.message}`, 'file');
    }

    const {
      data: { publicUrl },
    } = supabaseAdminClient.storage.from('server-icons').getPublicUrl(fileName);

    return {
      url: publicUrl,
      path: fileName,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
    };
  }

  /**
   * Delete file from storage
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabaseAdminClient.storage.from(bucket).remove([path]);

    if (error) {
      throw new ValidationError(`Failed to delete file: ${error.message}`, 'file');
    }
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Validate if file type is allowed
   */
  isAllowedFileType(mimetype: string): boolean {
    return (
      this.ALLOWED_IMAGE_TYPES.includes(mimetype) ||
      this.ALLOWED_VIDEO_TYPES.includes(mimetype) ||
      this.ALLOWED_AUDIO_TYPES.includes(mimetype) ||
      this.ALLOWED_DOCUMENT_TYPES.includes(mimetype)
    );
  }
}

export const uploadService = new UploadService();

