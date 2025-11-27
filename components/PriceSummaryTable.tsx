
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CalculatedPlan, HealthPlan } from '../types';
import { PlanDetailsModal } from './PlanDetailsModal';

interface PriceSummaryTableProps {
  groups: CalculatedPlan[][];
}

export const PriceSummaryTable: React.FC<PriceSummaryTableProps> = ({ groups }) => {
  const [selectedGroup, setSelectedGroup] = useState<CalculatedPlan[] | null>(null);
  const [showCopartInfo, setShowCopartInfo] = useState(false);

  const formatMoney = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getPlanStyles = (logoColorClass: string) => {
    let styles = {
        borderLeft: 'border-l-gray-400',
        text: 'text-gray-700',
        bgHover: 'group-hover:bg-gray-50',
        badge: 'bg-gray-100 text-gray-600'
    };

    if (logoColorClass.includes('blue-900')) {
        styles = { borderLeft: 'border-l-blue-900', text: 'text-blue-900', bgHover: 'group-hover:bg-blue-50', badge: 'bg-blue-100 text-blue-900' };
    } else if (logoColorClass.includes('teal-600')) {
        styles = { borderLeft: 'border-l-teal-600', text: 'text-teal-700', bgHover: 'group-hover:bg-teal-50', badge: 'bg-teal-100 text-teal-700' };
    } else if (logoColorClass.includes('slate-900')) {
        styles = { borderLeft: 'border-l-slate-900', text: 'text-slate-900', bgHover: 'group-hover:bg-slate-100', badge: 'bg-slate-200 text-slate-900' };
    } else if (logoColorClass.includes('orange-500')) {
        styles = { borderLeft: 'border-l-orange-500', text: 'text-orange-600', bgHover: 'group-hover:bg-orange-50', badge: 'bg-orange-100 text-orange-700' };
    } else if (logoColorClass.includes('amber-600')) {
        styles = { borderLeft: 'border-l-amber-600', text: 'text-amber-700', bgHover: 'group-hover:bg-amber-50', badge: 'bg-amber-100 text-amber-800' };
    } else if (logoColorClass.includes('amber-500')) {
        styles = { borderLeft: 'border-l-amber-500', text: 'text-amber-600', bgHover: 'group-hover:bg-amber-50', badge: 'bg-amber-100 text-amber-700' };
    } else if (logoColorClass.includes('orange-700')) {
        styles = { borderLeft: 'border-l-orange-700', text: 'text-orange-800', bgHover: 'group-hover:bg-orange-50', badge: 'bg-orange-100 text-orange-800' };
    } else if (logoColorClass.includes('slate-600')) {
        styles = { borderLeft: 'border-l-slate-600', text: 'text-slate-700', bgHover: 'group-hover:bg-slate-100', badge: 'bg-slate-200 text-slate-700' };
    } else if (logoColorClass.includes('green-600')) {
        styles = { borderLeft: 'border-l-green-600', text: 'text-green-700', bgHover: 'group-hover:bg-green-50', badge: 'bg-green-100 text-green-700' };
    } else if (logoColorClass.includes('blue-600')) {
        styles = { borderLeft: 'border-l-blue-600', text: 'text-blue-700', bgHover: 'group-hover:bg-blue-50', badge: 'bg-blue-100 text-blue-700' };
    } else if (logoColorClass.includes('009CA6')) {
        styles = { borderLeft: 'border-l-[#009CA6]', text: 'text-[#009CA6]', bgHover: 'group-hover:bg-teal-50', badge: 'bg-teal-100 text-[#009CA6]' };
    }

    return styles;
  };

  return (
    <div className="mt-16 mb-12 animate-fadeIn">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-[#003366]">
          Resumo Geral de Preços
        </h3>
        <p className="text-gray-500 text-sm mt-1">Comparativo simplificado de todas as opções disponíveis</p>
      </div>
      
      <div className="overflow-hidden rounded-xl shadow-lg border border-gray-200 bg-white">
        <table className="w-full text-left border-collapse table-fixed md:table-auto">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-4 pl-6 pr-4 font-bold text-gray-500 uppercase tracking-wider text-xs md:text-sm w-[35%] md:w-auto">Operadora / Plano</th>
              <th className="py-4 px-2 md:px-6 font-bold text-gray-500 text-center w-[32.5%] md:w-1/4 text-[10px] md:text-xs uppercase tracking-wider">
                <span className="block mb-1">Sem Coparticipação</span>
                <span className="text-[9px] md:text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold normal-case inline-block">(Ou Parcial)</span>
              </th>
              <th className="py-4 px-2 md:px-6 font-bold text-gray-500 text-center w-[32.5%] md:w-1/4 text-[10px] md:text-xs uppercase tracking-wider">
                 <span className="block mb-1">Com Coparticipação</span>
                 <span className="text-[9px] md:text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold normal-case inline-block">Mais Econômico</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {groups.map((group, idx) => {
              const fullCopart = group.find(v => v.plan.coparticipationType === 'full');
              const noCopart = group.find(v => v.plan.coparticipationType === 'none' || v.plan.coparticipationType === 'partial');
              const basePlan = group[0].plan;
              const styles = getPlanStyles(basePlan.logoColor);

              return (
                <tr 
                  key={idx} 
                  onClick={() => setSelectedGroup(group)}
                  className={`group bg-white transition-all duration-200 cursor-pointer ${styles.bgHover}`}
                >
                  <td className={`py-4 pl-4 md:pl-6 pr-2 align-middle border-l-[6px] ${styles.borderLeft}`}>
                    <div className="flex flex-col justify-center h-full">
                        <span className={`font-bold text-xs md:text-sm uppercase tracking-wide mb-1 ${styles.text}`}>{basePlan.operator}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800 text-sm md:text-lg leading-tight group-hover:text-[#003366] transition-colors">{basePlan.name}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-300 group-hover:text-[#003366] transition-colors opacity-0 group-hover:opacity-100 hidden md:block"><path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" /></svg>
                        </div>
                    </div>
                  </td>
                  <td className="py-4 px-2 md:px-6 text-center align-middle relative">
                     <div className="hidden md:block absolute left-0 top-3 bottom-3 w-px bg-gray-100"></div>
                    {noCopart ? <span className="text-sm md:text-xl font-bold text-gray-800 group-hover:text-blue-900 transition-colors">{formatMoney(noCopart.totalPrice)}</span> : <span className="inline-block px-2 py-1 bg-gray-100 text-gray-400 text-[10px] md:text-xs rounded font-medium">Indisponível</span>}
                  </td>
                  <td className="py-4 px-2 md:px-6 text-center align-middle relative">
                    <div className="hidden md:block absolute left-0 top-3 bottom-3 w-px bg-gray-100"></div>
                    {fullCopart ? <span className="text-sm md:text-xl font-bold text-gray-800 group-hover:text-orange-700 transition-colors">{formatMoney(fullCopart.totalPrice)}</span> : <span className="inline-block px-2 py-1 bg-gray-100 text-gray-400 text-[10px] md:text-xs rounded font-medium">Indisponível</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] md:text-xs text-gray-400 mt-3 text-center px-2">* Valores totais mensais. Clique em um plano para ver detalhes de carência e rede credenciada.</p>

      {/* Modals */}
      {showCopartInfo && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={() => setShowCopartInfo(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowCopartInfo(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2 flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>Entenda a Coparticipação</h3>
            <div className="space-y-4 text-sm text-gray-700 leading-relaxed overflow-y-auto pr-1">
              <p>👉 <span className="font-bold">Coparticipação</span> é quando o beneficiário paga um valor simbólico apenas quando usa o plano, como em consultas, exames ou terapias.</p>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100"><p className="font-bold text-purple-900 mb-1">🔹 Sem Coparticipação (exceto em terapias)</p><p>A cobrança acontece somente em terapias, como psicologia, fonoaudiologia e fisioterapia. Já as consultas, exames e demais atendimentos não têm custo extra — são totalmente cobertos pelo plano.</p></div>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100"><p className="font-bold text-orange-900 mb-1">🔸 Com Coparticipação</p><p>Nesse modelo, há cobrança toda vez que o plano é utilizado, seja em consultas, exames ou terapias. A mensalidade é mais baixa, mas o beneficiário participa mais nos custos quando usa o plano.</p></div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200"><p className="font-bold text-gray-900 mb-1">✨ Resumindo:</p><ul className="list-disc list-inside space-y-1"><li><span className="font-semibold">Sem Coparticipação:</span> paga apenas em terapias.</li><li><span className="font-semibold">Com Coparticipação:</span> paga em todos os serviços utilizados.</li></ul></div>
            </div>
            <button onClick={() => setShowCopartInfo(false)} className="w-full mt-6 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0">Entendi</button>
          </div>
        </div>,
        document.body
      )}

      {selectedGroup && (
        <PlanDetailsModal 
          planOrVariants={selectedGroup} 
          onClose={() => setSelectedGroup(null)} 
        />
      )}
    </div>
  );
};
