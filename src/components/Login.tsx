import { useState } from 'react';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onSignup: (email: string, password: string, name: string) => Promise<boolean>;
}

export function Login({ onLogin, onSignup }: LoginProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      alert('Email dan password harus diisi');
      return;
    }

    if (isSignup && !name) {
      alert('Nama harus diisi');
      return;
    }

    setLoading(true);
    let success = false;

    if (isSignup) {
      success = await onSignup(email, password, name);
    } else {
      success = await onLogin(email, password);
    }

    setLoading(false);

    if (success) {
      setEmail('');
      setPassword('');
      setName('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl mb-2">Taking Order System</h1>
          <p className="text-gray-600">
            {isSignup ? 'Buat akun baru' : 'Masuk ke akun Anda'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block text-gray-700 mb-2">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan nama lengkap"
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="nama@email.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isSignup ? 'Mendaftar...' : 'Masuk...'}
              </>
            ) : (
              <>
                {isSignup ? (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Daftar
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Masuk
                  </>
                )}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-blue-600 hover:text-blue-700"
            disabled={loading}
          >
            {isSignup
              ? 'Sudah punya akun? Masuk di sini'
              : 'Belum punya akun? Daftar di sini'}
          </button>
        </div>

        {isSignup && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
            <p>
              <strong>Catatan:</strong> Password minimal 6 karakter
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
