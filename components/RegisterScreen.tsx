import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface RegisterScreenProps {
  onBackToLogin: () => void;
  onRegisterSuccess: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onBackToLogin, onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    email: '',
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password.length < 6) {
        setError("A senha deve ter 6 dígitos.");
        setLoading(false);
        return;
    }

    try {
      // 1. Create Auth User with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            phone: formData.phone,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create Profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              full_name: formData.name,
              cpf: formData.cpf,
              email: formData.email,
              phone: formData.phone,
              status: 'pending' // Default status
            }
          ]);

        if (profileError) throw profileError;

        alert('Cadastro realizado com sucesso! Aguarde a aprovação do administrador.');
        onRegisterSuccess();
      }
    } catch (err: any) {
      if (err.message.includes('unique constraint')) {
        setError("Este email ou CPF já está cadastrado.");
      } else {
        setError(err.message || "Erro ao cadastrar. Verifique os dados.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 animate-slideUp">
        <button onClick={onBackToLogin} className="text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1 text-sm">
            &larr; Voltar
        </button>
        
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#003366] mb-1">Criar Conta</h1>
            <p className="text-gray-500 text-sm">Preencha os dados para solicitar acesso.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
            <input 
              name="name" type="text" required
              value={formData.name} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CPF</label>
                <input 
                name="cpf" type="text" required placeholder="000.000.000-00"
                value={formData.cpf} onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none"
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telefone</label>
                <input 
                name="phone" type="text" required placeholder="(00) 00000-0000"
                value={formData.phone} onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none"
                />
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
            <input 
              name="email" type="email" required
              value={formData.email} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha (6 dígitos)</label>
            <input 
              name="password" type="password" required maxLength={6}
              value={formData.password} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#003366] text-white font-bold py-3 rounded-xl hover:bg-[#002244] transition-colors mt-2"
          >
            {loading ? 'Enviando...' : 'Solicitar Acesso'}
          </button>
        </form>
      </div>
    </div>
  );
};