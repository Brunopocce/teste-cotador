import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface UpdatePasswordScreenProps {
  onPasswordUpdated: () => void;
}

export const UpdatePasswordScreen: React.FC<UpdatePasswordScreenProps> = ({ onPasswordUpdated }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 dígitos.');
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
          <p className="text-gray-500 text-sm">Digite uma nova senha de 6 dígitos para sua conta.</p>
        </div>
        
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
            <input 
              type="password" 
              required
              maxLength={6}
              value={password}
              // FIX: Corrected typo from `e.targe` to `e.target.value` and completed the component
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="******"
            />
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
