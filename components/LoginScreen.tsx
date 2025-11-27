import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface LoginScreenProps {
  onLoginSuccess: (isAdmin: boolean) => void;
  onGoToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onGoToRegister }) => {
  const [identifier, setIdentifier] = useState(''); // Email or CPF or Admin Code
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. Check Hardcoded Admin
    if (identifier === '236616' && password === '236616') {
      onLoginSuccess(true);
      setLoading(false);
      return;
    }

    // 2. Regular User Login via Supabase
    try {
      let emailToUse = identifier;

      // Basic check if input looks like CPF (numbers only, length 11)
      const cleanIdentifier = identifier.replace(/\D/g, '');
      const isCpf = cleanIdentifier.length === 11 && !identifier.includes('@');

      if (isCpf) {
        // Resolve CPF to Email
        const { data, error: lookupError } = await supabase
          .from('profiles')
          .select('email')
          .eq('cpf', identifier) // Assuming user typed exactly the stored CPF (masking recommended in real app)
          .single();

        if (lookupError || !data) {
          throw new Error("CPF não encontrado.");
        }
        emailToUse = data.email;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: password
      });

      if (authError) throw authError;

      // Login success, parent component checks status
      onLoginSuccess(false);

    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'Credenciais inválidas.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 animate-slideUp">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#003366] tracking-tight mb-2">TEM Saúde</h1>
            <p className="text-gray-500">Área do Corretor</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF ou Email</label>
            <input 
              type="text" 
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Digite seu acesso"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input 
              type="password" 
              required
              maxLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="******"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#003366] text-white font-bold py-3 rounded-xl hover:bg-[#002244] transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-70"
          >
            {loading ? 'Entrando...' : 'Acessar Sistema'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm mb-2">Ainda não tem acesso?</p>
          <button 
            onClick={onGoToRegister}
            className="text-blue-600 font-bold hover:underline"
          >
            Cadastre-se agora
          </button>
        </div>
      </div>
    </div>
  );
};