import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';

interface MessageContentProps {
  content: string;
  className?: string;
}

export function MessageContent({ content, className = '' }: MessageContentProps) {
  const components: Components = {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const inline = !match;
      
      return !inline && match ? (
        <div style={{ margin: '0.5rem 0' }}>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={match[1]}
            PreTag="div"
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code
          className="bg-discord-dark/50 px-1.5 py-0.5 rounded text-discord-blue-light font-mono text-sm"
          {...props}
        >
          {children}
        </code>
      );
    },
    p({ children }) {
      return <p className="mb-1 last:mb-0">{children}</p>;
    },
    a({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-discord-blue hover:underline"
        >
          {children}
        </a>
      );
    },
    ul({ children }) {
      return <ul className="list-disc list-inside mb-1 space-y-0.5">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="list-decimal list-inside mb-1 space-y-0.5">{children}</ol>;
    },
    blockquote({ children }) {
      return (
        <blockquote className="border-l-4 border-discord-gray-lighter pl-4 italic my-1">
          {children}
        </blockquote>
      );
    },
    h1({ children }) {
      return <h1 className="text-xl font-bold mb-1">{children}</h1>;
    },
    h2({ children }) {
      return <h2 className="text-lg font-bold mb-1">{children}</h2>;
    },
    h3({ children }) {
      return <h3 className="text-base font-bold mb-1">{children}</h3>;
    },
  };

  return (
    <div className={`prose prose-invert prose-sm max-w-none ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
