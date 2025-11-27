
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

    // Also fetch auth metadata to get the Plan if not in profiles table
    // However, since we can't join auth.users easily from client, 
    // we assume the data was saved to profiles (if column added) OR we accept it might be missing
    // if only in metadata. Ideally, for admin view, data should be in the table.
    
    // NOTE: Since I cannot migrate the DB schema for you, the 'plan' field might not exist in the returned data 
    // if you didn't add the column. 

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
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatPlan = (plan?: string) => {
      if (plan === 'monthly') return 'Mensal';
      if (plan === 'quarterly') return 'Trimestral';
      return '-';
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
                  <th className="p-4">Data/Hora</th>
                  <th className="p-4">Nome</th>
                  <th className="p-4">CPF</th>
                  <th className="p-4">Email / Telefone</th>
                  <th className="p-4 text-center">Plano</th>
                  <th className="p-4 text-center">Status</th>
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
                  users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="p-4 font-medium text-gray-800">
                        {user.full_name}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {user.cpf}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        <div className="flex flex-col">
                           <span>{user.email}</span>
                           <span className="text-xs text-gray-400">{user.phone}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                         <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase
                            ${user.plan === 'quarterly' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}
                         `}>
                            {formatPlan(user.plan)}
                         </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold uppercase
                          ${user.status === 'approved' ? 'bg-green-100 text-green-700' : 
                            user.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                            'bg-yellow-100 text-yellow-700'}`}>
                          {user.status === 'approved' ? 'Aprovado' : 
                           user.status === 'rejected' ? 'Recusado' : 
                           'Pendente'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                           {user.status !== 'approved' && (
                             <button 
                               onClick={() => updateUserStatus(user.id, 'approved')}
                               className="bg-green-600 text-white p-2 rounded hover:bg-green-700 title"
                               title="Aprovar"
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                 <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                               </svg>
                             </button>
                           )}
                           {user.status !== 'rejected' && (
                             <button 
                               onClick={() => updateUserStatus(user.id, 'rejected')}
                               className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                               title="Recusar"
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                               </svg>
                             </button>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
