import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-discord-darkest">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-discord-gray-lighter mb-8">Página não encontrada</p>
        <Link
          to="/chat"
          className="bg-discord-blue hover:bg-discord-blue-hover text-white px-6 py-3 rounded-lg transition-colors"
        >
          Ir para o chat
        </Link>
      </div>
    </div>
  );
}

