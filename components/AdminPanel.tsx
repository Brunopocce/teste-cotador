
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types';

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data as UserProfile[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      // Optimistic update
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
    } else {
      alert("Erro ao atualizar status");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculatePlanDetails = (createdAt: string, plan?: string) => {
    if (!plan || (plan !== 'monthly' && plan !== 'quarterly')) {
        return {
            planLabel: 'Não Identificado',
            planColor: 'bg-gray-100 text-gray-500',
            expirationDate: '-',
            trialEndDate: '-',
            statusLabel: '-',
            statusColor: 'bg-gray-100 text-gray-400'
        };
    }

    const createdDate = new Date(createdAt);
    
    // Período de Teste: 7 dias
    const trialDateObj = new Date(createdDate);
    trialDateObj.setDate(trialDateObj.getDate() + 7);
    
    // Duração do Plano (Mensal: 30, Trimestral: 90)
    const planDuration = plan === 'quarterly' ? 90 : 30;
    
    // Expiração Total = Data Criação + 7 dias teste + Duração do Plano
    const expirationDateObj = new Date(createdDate);
    expirationDateObj.setDate(expirationDateObj.getDate() + 7 + planDuration);

    const today = new Date();
    const diffTime = expirationDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Formatação de Datas
    const trialEndDate = trialDateObj.toLocaleDateString('pt-BR');
    const expirationDate = expirationDateObj.toLocaleDateString('pt-BR');

    // Labels e Cores
    let statusLabel = `${diffDays} dias restantes`;
    let statusColor = 'bg-green-100 text-green-700';

    if (diffDays <= 0) {
        statusLabel = 'Expirado';
        statusColor = 'bg-red-100 text-red-700';
    } else if (diffDays <= 5) {
        statusLabel = `Expira em ${diffDays} dias`;
        statusColor = 'bg-yellow-100 text-yellow-800';
    }

    const planLabel = plan === 'quarterly' ? 'Trimestral' : 'Mensal';
    const planColor = plan === 'quarterly' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';

    return {
        planLabel,
        planColor,
        expirationDate,
        trialEndDate,
        statusLabel,
        statusColor
    };
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-[#003366]">Painel Administrativo</h1>
          <button 
            onClick={onLogout}
            className="text-red-600 font-semibold hover:text-red-800"
          >
            Sair
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
             <h2 className="font-bold text-gray-700">Solicitações de Acesso</h2>
             <button onClick={fetchUsers} className="text-blue-600 text-sm hover:underline">Atualizar lista</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <th className="p-4">Data Cadastro</th>
                  <th className="p-4">Dados Pessoais</th>
                  <th className="p-4">Contato</th>
                  <th className="p-4 text-center">Plano Escolhido</th>
                  <th className="p-4 text-center">Validade & Teste</th>
                  <th className="p-4 text-center">Status Acesso</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                   <tr>
                     <td colSpan={7} className="p-8 text-center text-gray-500">Carregando...</td>
                   </tr>
                ) : users.length === 0 ? (
                  <tr>
                     <td colSpan={7} className="p-8 text-center text-gray-500">Nenhum cadastro encontrado.</td>
                   </tr>
                ) : (
                  users.map(user => {
                    const details = calculatePlanDetails(user.created_at, user.plan);
                    return (
                        <tr key={user.id} className="hover:bg-gray-50">
                        <td className="p-4 text-xs text-gray-500 whitespace-nowrap align-top">
                            {formatDate(user.created_at)}
                        </td>
                        <td className="p-4 align-top">
                            <div className="font-bold text-gray-800 text-sm">{user.full_name}</div>
                            <div className="text-xs text-gray-500 mt-1">CPF: {user.cpf}</div>
                        </td>
                        <td className="p-4 text-sm text-gray-600 align-top">
                            <div className="flex flex-col gap-1">
                                <span className="font-medium text-gray-800">{user.email}</span>
                                <span className="text-xs text-gray-500">{user.phone}</span>
                            </div>
                        </td>
                        <td className="p-4 text-center align-top">
                            <span className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase mb-1 ${details.planColor}`}>
                                {details.planLabel}
                            </span>
                        </td>
                        <td className="p-4 text-center align-top">
                            <div className="flex flex-col items-center gap-1">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${details.statusColor.replace('bg-', 'border-').replace('text-', 'text-')}`}>
                                    {details.statusLabel}
                                </span>
                                <div className="text-xs text-gray-700 mt-1">
                                    <span className="font-bold">Expira:</span> {details.expirationDate}
                                </div>
                                <div className="text-[10px] text-gray-400">
                                    Teste até: {details.trialEndDate}
                                </div>
                            </div>
                        </td>
                        <td className="p-4 text-center align-top">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold uppercase
                            ${user.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                user.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                                'bg-yellow-100 text-yellow-700'}`}>
                            {user.status === 'approved' ? 'Aprovado' : 
                            user.status === 'rejected' ? 'Recusado' : 
                            'Pendente'}
                            </span>
                        </td>
                        <td className="p-4 text-center align-top">
                            <div className="flex justify-center gap-2">
                            {user.status !== 'approved' && (
                                <button 
                                onClick={() => updateUserStatus(user.id, 'approved')}
                                className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition-colors shadow-sm"
                                title="Aprovar Acesso"
                                >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                                </button>
                            )}
                            {user.status !== 'rejected' && (
                                <button 
                                onClick={() => updateUserStatus(user.id, 'rejected')}
                                className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition-colors shadow-sm"
                                title="Recusar Acesso"
                                >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                                </button>
                            )}
                            </div>
                        </td>
                        </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
