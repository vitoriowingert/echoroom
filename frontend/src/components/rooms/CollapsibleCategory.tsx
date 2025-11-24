import { useState } from 'react';

interface CollapsibleCategoryProps {
  name: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleCategory({ name, children, defaultOpen = true }: CollapsibleCategoryProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mt-4 first:mt-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 py-1 flex items-center gap-1 text-discord-gray-lighter hover:text-white transition-colors group cursor-pointer"
      >
        <svg
          className={`w-3 h-3 transition-transform flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-xs font-semibold uppercase select-none">{name}</span>
      </button>
      {isOpen && <div className="mt-0">{children}</div>}
    </div>
  );
}

