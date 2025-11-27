import React, { useState, useRef } from 'react';
import { supabase } from '../services/supabaseClient';

interface LoginScreenProps {
  onLoginSuccess: (isAdmin: boolean) => void;
  onGoToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onGoToRegister }) => {
  const [identifier, setIdentifier] = useState(''); // Email or CPF or Admin Code
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
            <div className="flex flex-col items-center group select-none">
                <div className="flex items-center gap-1">
                    {/* Venda */}
                    <span className="text-3xl font-bold text-[#003366] tracking-tight">Venda</span>
                    
                    {/* Icon + */}
                    <div className="mx-1 relative flex items-center justify-center h-9 w-9">
                        <div className="absolute inset-0 bg-[#003366] rounded opacity-10 transform rotate-45 transition-transform duration-500"></div>
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#003366] z-10">
                           <path d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M17,13h-3.5V16.5 c0,0.83-0.67,1.5-1.5,1.5s-1.5-0.67-1.5-1.5V13H7c-0.83,0-1.5-0.67-1.5-1.5S6.17,10,7,10h3.5V6.5C10.5,5.67,11.17,5,12,5 s1.5,0.67,1.5,1.5V10H17c0.83,0,1.5,0.67,1.5,1.5S17.83,13,17,13z"/>
                        </svg>
                    </div>
                    
                    {/* Saúde */}
                    <span className="text-4xl font-cursive text-[#003366] mt-0.5">Saúde</span>
                </div>
            </div>
            <p className="text-gray-500 mt-2">Área do Corretor</p>
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
            <div className="relative">
                <input 
                type={showPassword ? "text" : "password"} 
                required
                maxLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10"
                placeholder="******"
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                    {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                    )}
                </button>
            </div>
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