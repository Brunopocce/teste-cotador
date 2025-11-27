import React from 'react';
import { CalculatedPlan, HealthPlan } from '../types';

interface ComparisonModalProps {
  plans: CalculatedPlan[];
  onClose: () => void;
  onRemove: (plan: CalculatedPlan) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({ plans, onClose, onRemove }) => {
  const formatMoney = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getCopartLabel = (plan: HealthPlan) => {
    switch(plan.coparticipationType) {
      case 'full': return 'Com Coparticipação';
      case 'partial': return 'Sem Copart. (exceto terapias)';
      case 'none': return 'Sem Coparticipação';
      default: return 'Padrão';
    }
  };

  // Extract all unique service names to align rows for coparticipation
  const allServices = Array.from(new Set(
    plans.flatMap(p => p.plan.copayFees.map(f => f.service))
  ));

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4 bg-gray-900/80 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-white md:rounded-2xl shadow-2xl w-full h-full md:h-auto md:max-w-7xl md:max-h-[90vh] flex flex-col relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 md:rounded-t-2xl flex-shrink-0">
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-[#003366]">Comparativo de Planos</h2>
            <p className="text-gray-500 text-xs md:text-sm">Análise detalhada lado a lado</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto bg-white custom-scrollbar">
          <table className="w-full text-left border-collapse table-fixed md:table-auto">
            <thead>
              <tr>
                {/* Sticky Label Column Header - Remove shadow on Desktop for clean look */}
                <th className="p-3 md:p-5 w-[120px] md:w-[250px] sticky left-0 top-0 bg-white z-30 border-b-2 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] md:shadow-none md:border-r-2 md:border-gray-100">
                  <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Características</span>
                </th>
                
                {/* Plan Headers */}
                {plans.map((cp, idx) => (
                  <th key={idx} className="p-3 md:p-5 min-w-[160px] md:min-w-[300px] border-b-2 border-gray-100 align-top relative group bg-white sticky top-0 z-20">
                    <div className={`inline-block px-2 py-0.5 rounded text-[10px] md:text-xs font-bold text-white mb-2 ${cp.plan.logoColor}`}>
                      {cp.plan.operator}
                    </div>
                    <h3 className="text-sm md:text-xl font-bold text-gray-800 leading-tight mb-1">{cp.plan.name}</h3>
                    <p className="text-[10px] md:text-sm text-gray-500 font-medium">{getCopartLabel(cp.plan)}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              
              {/* Preço Total Row */}
              <tr className="bg-blue-50/30">
                <td className="p-3 md:p-5 text-xs md:text-sm font-bold text-gray-700 sticky left-0 bg-[#f8fafc] z-20 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] md:shadow-none md:border-gray-200">
                    Mensalidade Total
                </td>
                {plans.map((cp, idx) => (
                  <td key={idx} className="p-3 md:p-5 bg-blue-50/30">
                    <span className="text-lg md:text-3xl font-bold text-blue-900 block whitespace-nowrap">{formatMoney(cp.totalPrice)}</span>
                  </td>
                ))}
              </tr>

               {/* Preços Detalhados Row */}
               <tr>
                <td className="p-3 md:p-5 text-xs md:text-sm font-bold text-gray-700 sticky left-0 bg-white z-20 align-top border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] md:shadow-none">
                    Preço por Vida
                    <span className="block text-[9px] md:text-[10px] font-normal text-gray-400 mt-1">Unitário por faixa</span>
                </td>
                {plans.map((cp, idx) => (
                  <td key={idx} className="p-3 md:p-5 align-top">
                    <div className="space-y-2 md:space-y-1">
                        {cp.details.map((det, i) => (
                            <div key={i} className="flex flex-col md:flex-row md:items-center border-b border-dashed border-gray-100 last:border-0 pb-1">
                                <span className="text-gray-500 text-[10px] md:text-sm md:w-32">{det.ageRange} anos</span>
                                <span className="font-medium text-gray-800 text-xs md:text-sm">{formatMoney(det.unitPrice)}</span>
                            </div>
                        ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Separator for Copay */}
              <tr className="bg-gray-50">
                <td colSpan={plans.length + 1} className="p-2 md:p-3 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider text-center border-y border-gray-200 sticky left-0 z-10">
                  Tabela de Coparticipação
                </td>
              </tr>

              {/* Dynamic Copay Rows */}
              {allServices.map((service, sIdx) => (
                 <tr key={sIdx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 md:p-5 text-xs md:text-sm font-bold text-gray-700 sticky left-0 bg-white z-20 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] md:shadow-none">
                      {service}
                  </td>
                  {plans.map((cp, pIdx) => {
                      const fee = cp.plan.copayFees.find(f => f.service === service);
                      return (
                          <td key={pIdx} className="p-3 md:p-5 text-xs md:text-base text-gray-600">
                              {fee ? fee.value : '-'}
                          </td>
                      );
                  })}
                 </tr>
              ))}

            </tbody>
          </table>
        </div>
        
        {/* Mobile Hint - Sticky Bottom */}
        <div className="md:hidden p-3 text-center text-xs text-gray-500 bg-gray-50 border-t border-gray-200 flex-shrink-0">
             &larr; Arraste para comparar &rarr;
        </div>
      </div>
    </div>
  );
};