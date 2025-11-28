
import React, { useState, useRef } from 'react';
import { supabase } from '../services/supabaseClient';

interface RegisterScreenProps {
  onBackToLogin: () => void;
  onRegisterSuccess: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onBackToLogin, onRegisterSuccess }) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly' | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    email: '',
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const isMounted = useRef(true);
  
  // Clean up ref on unmount
  React.useEffect(() => {
      return () => { isMounted.current = false; };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Converte Nome e Email para maiúsculas automaticamente
    if (e.target.name === 'name' || e.target.name === 'email') {
      value = value.toUpperCase();
    }

    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedPlan) {
        setError("Por favor, selecione um plano para continuar.");
        return;
    }

    setLoading(true);

    if (formData.password.length < 6) {
        setError("A senha deve ter 6 dígitos.");
        setLoading(false);
        return;
    }

    try {
      // 1. Create Auth User with metadata (including plan)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            phone: formData.phone,
            plan: selectedPlan
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
              status: 'pending', // Default status
              plan: selectedPlan // Ensure plan is saved to profiles table
            }
          ]);

        if (profileError) {
             console.warn("Could not save to profiles table (schema mismatch?):", profileError);
             // We don't throw here to allow flow to continue if auth was successful, 
             // relying on Auth metadata as backup or manual admin check.
        }

        alert('Cadastro realizado com sucesso! Instruções de pagamento serão enviadas via WhatsApp.');
        if (isMounted.current) {
            onRegisterSuccess();
        }
      }
    } catch (err: any) {
      if (err.message.includes('unique constraint')) {
        setError("Este email ou CPF já está cadastrado.");
      } else {
        setError(err.message || "Erro ao cadastrar. Verifique os dados.");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans py-10">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 md:p-8 animate-slideUp">
        <button onClick={onBackToLogin} className="text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1 text-sm">
            &larr; Voltar
        </button>
        
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-[#003366] mb-2">Criar Conta</h1>
            <p className="text-gray-500">Escolha seu plano e preencha os dados para solicitar acesso.</p>
        </div>

        {/* PLAN SELECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div 
                onClick={() => setSelectedPlan('monthly')}
                className={`cursor-pointer rounded-xl p-6 border-2 transition-all duration-300 relative overflow-hidden flex flex-col justify-between
                ${selectedPlan === 'monthly' ? 'border-blue-600 bg-blue-50 shadow-md transform scale-105' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 opacity-80 hover:opacity-100'}`}
            >
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Mensal</h3>
                    <p className="text-gray-500 text-xs mb-4">Teste grátis de 7 dias</p>
                    <div className="flex items-baseline">
                        <span className="text-sm text-gray-500 mr-1">R$</span>
                        <span className="text-3xl font-bold text-[#003366]">77,90</span>
                        <span className="text-sm text-gray-500 ml-1">/mês</span>
                    </div>
                </div>
                <div className={`mt-4 w-full py-2 rounded text-center text-sm font-bold ${selectedPlan === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {selectedPlan === 'monthly' ? 'Selecionado' : 'Selecionar'}
                </div>
            </div>

            <div 
                onClick={() => setSelectedPlan('quarterly')}
                className={`cursor-pointer rounded-xl p-6 border-2 transition-all duration-300 relative overflow-hidden flex flex-col justify-between
                ${selectedPlan === 'quarterly' ? 'border-green-500 bg-green-50 shadow-md transform scale-105' : 'border-gray-200 hover:border-green-300 hover:bg-gray-50 opacity-80 hover:opacity-100'}`}
            >
                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wide">
                    Mais Popular
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Trimestral</h3>
                    <p className="text-gray-500 text-xs mb-4">7 dias grátis + Desconto</p>
                    <div className="flex items-baseline">
                        <span className="text-sm text-gray-500 mr-1">R$</span>
                        <span className="text-3xl font-bold text-green-700">187,90</span>
                        <span className="text-sm text-gray-500 ml-1">/trimestre</span>
                    </div>
                </div>
                <div className={`mt-4 w-full py-2 rounded text-center text-sm font-bold ${selectedPlan === 'quarterly' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {selectedPlan === 'quarterly' ? 'Selecionado' : 'Selecionar'}
                </div>
            </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-8 text-center">
            <p className="text-yellow-800 text-xs flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                Instruções de pagamento serão enviadas via WhatsApp após o cadastro.
            </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
            <input 
              name="name" type="text" required
              value={formData.name} onChange={handleChange}
              className="w-full px-3 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-900 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CPF</label>
                <input 
                name="cpf" type="tel" required placeholder="000.000.000-00"
                value={formData.cpf} onChange={handleChange}
                className="w-full px-3 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-900 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telefone</label>
                <input 
                name="phone" type="tel" required placeholder="(00) 00000-0000"
                value={formData.phone} onChange={handleChange}
                className="w-full px-3 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-900 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
            <input 
              name="email" type="email" required
              value={formData.email} onChange={handleChange}
              className="w-full px-3 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-900 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha (6 dígitos)</label>
            <input 
              name="password" 
              type="password" 
              inputMode="numeric"
              pattern="[0-9]*"
              required 
              maxLength={6}
              value={formData.password} onChange={handleChange}
              className="w-full px-3 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-900 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#003366] text-white font-bold py-3 rounded-xl hover:bg-[#002244] transition-colors mt-4 shadow-lg shadow-blue-900/10 disabled:opacity-70"
          >
            {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
          </button>
        </form>
      </div>
    </div>
  );
};
