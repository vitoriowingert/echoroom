import { ServerInvite } from '../../types';

interface InviteLinkProps {
  invite: ServerInvite;
  onCopy?: () => void;
}

export function InviteLink({ invite, onCopy }: InviteLinkProps) {
  const inviteUrl = `${window.location.origin}/invite/${invite.code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      onCopy?.();
    });
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-discord-gray rounded">
      <code className="flex-1 text-discord-blue font-mono text-sm">{inviteUrl}</code>
      <button
        onClick={handleCopy}
        className="px-3 py-1 bg-discord-blue hover:bg-discord-blue-hover text-white text-sm rounded transition-colors"
      >
        Copy
      </button>
    </div>
  );
}

