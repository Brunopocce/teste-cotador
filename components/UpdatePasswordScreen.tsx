
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface UpdatePasswordScreenProps {
  onPasswordUpdated: () => void;
}

export const UpdatePasswordScreen: React.FC<UpdatePasswordScreenProps> = ({ onPasswordUpdated }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-numeric characters and limit to 6 digits
    const numericValue = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPassword(numericValue);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length !== 6) {
      setError('A senha deve conter exatamente 6 números.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;
      
      setMessage('Senha atualizada com sucesso! Você já pode fazer o login.');
      setTimeout(() => {
        onPasswordUpdated();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao atualizar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 animate-slideUp">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#003366] mb-2">Criar Nova Senha</h1>
          <p className="text-gray-500 text-sm">Digite uma nova senha de 6 números.</p>
        </div>
        
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha (6 números)</label>
            <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  maxLength={6}
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10"
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
          </div>
          
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">{error}</div>}
          {message && <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg text-center">{message}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#003366] text-white font-bold py-3 rounded-xl hover:bg-[#002244] transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-70"
          >
            {loading ? 'Atualizando...' : 'Atualizar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
};
