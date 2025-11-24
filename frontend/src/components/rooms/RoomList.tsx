import { Room, ChannelType } from '../../types';
import { useTranslation } from '../../i18n/useTranslation';
import { CollapsibleCategory } from './CollapsibleCategory';

interface RoomListProps {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  unreadCountsByRoom?: Record<string, number>;
}

export function RoomList({ rooms, selectedRoomId, onSelectRoom, unreadCountsByRoom }: RoomListProps) {
  const { t } = useTranslation();
  
  // Remove duplicates by ID first (safety measure)
  const uniqueRooms = Array.from(
    new Map(rooms.map((room) => [room.id, room])).values()
  );
  
  // Group rooms by category and filter out category rooms themselves
  const categories = uniqueRooms.filter((r) => r.channel_type === 'category');
  const textChannels = uniqueRooms.filter((r) => r.channel_type === 'text' || !r.channel_type);
  const voiceChannels = uniqueRooms.filter((r) => r.channel_type === 'voice');
  
  // Sort by position if available
  const sortByPosition = (a: Room, b: Room) => (a.position || 0) - (b.position || 0);
  categories.sort(sortByPosition);
  textChannels.sort(sortByPosition);
  voiceChannels.sort(sortByPosition);
  
  // Group channels by category
  const channelsByCategory = new Map<string, { text: Room[]; voice: Room[] }>();
  
  textChannels.forEach((room) => {
    const categoryId = room.category_id || 'uncategorized';
    if (!channelsByCategory.has(categoryId)) {
      channelsByCategory.set(categoryId, { text: [], voice: [] });
    }
    channelsByCategory.get(categoryId)!.text.push(room);
  });
  
  voiceChannels.forEach((room) => {
    const categoryId = room.category_id || 'uncategorized';
    if (!channelsByCategory.has(categoryId)) {
      channelsByCategory.set(categoryId, { text: [], voice: [] });
    }
    channelsByCategory.get(categoryId)!.voice.push(room);
  });
  
  const getChannelIcon = (type?: ChannelType) => {
    switch (type) {
      case 'voice':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.617a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
          </svg>
        );
      case 'text':
      default:
        return <span className="text-lg">#</span>;
    }
  };
  
  if (rooms.length === 0) {
    return (
      <div className="p-4 text-center text-discord-gray-lighter text-sm">
        {t.rooms.noRooms}
      </div>
    );
  }

  const renderChannel = (room: Room) => {
    const unreadCount = unreadCountsByRoom?.[room.id] || 0;
    const hasUnread = unreadCount > 0;
    const isSelected = selectedRoomId === room.id;
    
    return (
      <button
        key={room.id}
        onClick={() => onSelectRoom(room.id)}
        className={`w-full text-left px-2 py-1 rounded-md transition-colors group relative flex items-center gap-1.5 ${
          isSelected
            ? 'bg-discord-gray-light text-white'
            : 'text-discord-gray-lighter hover:bg-discord-gray hover:text-white'
        } ${hasUnread && !isSelected ? 'font-medium' : ''}`}
      >
        {/* Channel icon */}
        <span className="text-discord-gray-lighter group-hover:text-white flex-shrink-0 text-base">
          {getChannelIcon(room.channel_type)}
        </span>
        
        {/* Channel name */}
        <span className="font-medium text-sm truncate flex-1">{room.name}</span>
        
        {/* Unread badge */}
        {hasUnread && !isSelected && (
          <span className="flex-shrink-0 bg-discord-gray-lighter text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Selected channel actions */}
        {isSelected && (
          <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-1 text-discord-gray-lighter hover:text-white hover:bg-discord-gray-light rounded transition-colors"
              title="Membros"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Open members list
              }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </button>
            <button
              className="p-1 text-discord-gray-lighter hover:text-white hover:bg-discord-gray-light rounded transition-colors"
              title="Configurações do canal"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Open channel settings
              }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </button>
    );
  };

  // Get uncategorized channels (only if we have categories, otherwise they're already in textChannels/voiceChannels)
  const uncategorized = categories.length > 0 ? channelsByCategory.get('uncategorized') : null;

  return (
    <div className="space-y-0 px-2">
      {/* Render channels grouped by category */}
      {categories.length > 0 ? (
        <>
          {categories.map((category) => {
            const categoryChannels = channelsByCategory.get(category.id);
            if (!categoryChannels || (categoryChannels.text.length === 0 && categoryChannels.voice.length === 0)) {
              return null;
            }
            
            return (
              <CollapsibleCategory key={category.id} name={category.name}>
                <div className="space-y-0">
                  {/* Text channels in category */}
                  {categoryChannels.text.map(renderChannel)}
                  
                  {/* Voice channels in category */}
                  {categoryChannels.voice.map(renderChannel)}
                </div>
              </CollapsibleCategory>
            );
          })}
          
          {/* Uncategorized channels - only show if we have categories */}
          {uncategorized && (uncategorized.text.length > 0 || uncategorized.voice.length > 0) && (
            <CollapsibleCategory name={t.rooms.uncategorized || "Uncategorized"}>
              <div className="space-y-0">
                {uncategorized.text.map(renderChannel)}
                {uncategorized.voice.map(renderChannel)}
              </div>
            </CollapsibleCategory>
          )}
        </>
      ) : (
        <>
          {/* Text channels without category - only render if no categories exist */}
          {textChannels.length > 0 && (
            <div className="space-y-0">
              {textChannels.map(renderChannel)}
            </div>
          )}
          
          {/* Voice channels without category */}
          {voiceChannels.length > 0 && (
            <div className="space-y-0">
              {voiceChannels.map(renderChannel)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

