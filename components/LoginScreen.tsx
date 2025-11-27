
import React, { useState, useRef } from 'react';
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
  const [message, setMessage] = useState('');
  
  // Forgot Password Mode
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const isMounted = useRef(true);

  React.useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    // 1. Check Hardcoded Admin
    if (identifier === '236616' && password === '236616') {
      onLoginSuccess(true);
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
          .eq('cpf', identifier) 
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

      // Success
    } catch (err: any) {
      if (isMounted.current) {
        setError(err.message === 'Invalid login credentials' ? 'Credenciais inválidas.' : err.message);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setMessage('');
      setLoading(true);

      try {
          const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
             redirectTo: window.location.origin, // Just redirects back to app, usually they get a magic link
          });

          if (error) throw error;
          
          setMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
      } catch (err: any) {
          setError(err.message);
      } finally {
          if (isMounted.current) {
             setLoading(false);
          }
      }
  };

  if (isResetMode) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 animate-slideUp">
                <button onClick={() => { setIsResetMode(false); setError(''); setMessage(''); }} className="text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1 text-sm">
                    &larr; Voltar
                </button>
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-[#003366] mb-2">Redefinir Senha</h1>
                    <p className="text-gray-500 text-sm">Informe seu email para receber um link de recuperação.</p>
                </div>
                
                <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input 
                            type="email" 
                            required
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="seu@email.com"
                        />
                    </div>
                    
                    {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">{error}</div>}
                    {message && <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg text-center">{message}</div>}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-[#003366] text-white font-bold py-3 rounded-xl hover:bg-[#002244] transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-70"
                    >
                        {loading ? 'Enviando...' : 'Enviar Email'}
                    </button>
                </form>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 animate-slideUp">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#003366] tracking-tight mb-2">Venda Mais Saúde</h1>
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
            <div className="flex justify-end mt-1">
                <button 
                    type="button" 
                    onClick={() => setIsResetMode(true)}
                    className="text-xs text-blue-600 hover:underline font-medium"
                >
                    Esqueci minha senha
                </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">
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
