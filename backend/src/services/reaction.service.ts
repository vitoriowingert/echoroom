import { supabaseAdminClient } from '../config/supabase';
import { parseDatabaseError, NotFoundError } from '../utils/errors';

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface ReactionCount {
  emoji: string;
  count: number;
  users: string[]; // User IDs who reacted
}

export class ReactionService {
  /**
   * Add reaction to message
   */
  async addReaction(messageId: string, userId: string, emoji: string): Promise<MessageReaction> {
    const { data, error } = await supabaseAdminClient
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: userId,
        emoji,
      })
      .select()
      .single();

    if (error) {
      // If already exists, return existing reaction
      if (error.code === '23505') {
        const existing = await this.getReaction(messageId, userId, emoji);
        if (existing) {
          return existing;
        }
      }
      throw parseDatabaseError(error, 'Failed to add reaction');
    }

    if (!data) {
      throw new Error('Reaction creation succeeded but no data returned');
    }

    return data as MessageReaction;
  }

  /**
   * Remove reaction from message
   */
  async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    const { error } = await supabaseAdminClient
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji);

    if (error) {
      throw parseDatabaseError(error, 'Failed to remove reaction');
    }
  }

  /**
   * Get reaction
   */
  async getReaction(messageId: string, userId: string, emoji: string): Promise<MessageReaction | null> {
    const { data, error } = await supabaseAdminClient
      .from('message_reactions')
      .select('*')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw parseDatabaseError(error, 'Failed to get reaction');
    }

    return data as MessageReaction | null;
  }

  /**
   * Get all reactions for a message
   */
  async getMessageReactions(messageId: string): Promise<MessageReaction[]> {
    const { data, error } = await supabaseAdminClient
      .from('message_reactions')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at', { ascending: true });

    if (error) {
      throw parseDatabaseError(error, 'Failed to get message reactions');
    }

    return (data || []) as MessageReaction[];
  }

  /**
   * Get reaction counts grouped by emoji
   */
  async getReactionCounts(messageId: string): Promise<ReactionCount[]> {
    const reactions = await this.getMessageReactions(messageId);

    // Group by emoji
    const counts = new Map<string, ReactionCount>();

    for (const reaction of reactions) {
      const existing = counts.get(reaction.emoji);
      if (existing) {
        existing.count++;
        if (!existing.users.includes(reaction.user_id)) {
          existing.users.push(reaction.user_id);
        }
      } else {
        counts.set(reaction.emoji, {
          emoji: reaction.emoji,
          count: 1,
          users: [reaction.user_id],
        });
      }
    }

    return Array.from(counts.values());
  }

  /**
   * Toggle reaction (add if not exists, remove if exists)
   */
  async toggleReaction(messageId: string, userId: string, emoji: string): Promise<{ added: boolean }> {
    const existing = await this.getReaction(messageId, userId, emoji);
    if (existing) {
      await this.removeReaction(messageId, userId, emoji);
      return { added: false };
    } else {
      await this.addReaction(messageId, userId, emoji);
      return { added: true };
    }
  }
}

export const reactionService = new ReactionService();

