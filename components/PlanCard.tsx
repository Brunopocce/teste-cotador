
import React, { useState } from 'react';
import { CalculatedPlan, HealthPlan } from '../types';
import { PlanDetailsModal } from './PlanDetailsModal';

interface PlanCardProps {
  variants: CalculatedPlan[];
  onComparePlans: (plans: CalculatedPlan[]) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({ variants, onComparePlans }) => {
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  
  if (!variants || variants.length === 0) return null;

  // Static data comes from the first plan in the group (Name, Operator, Hospitals)
  const basePlan = variants[0].plan;

  // Identify variants
  const fullCopartVariant = variants.find(v => v.plan.coparticipationType === 'full');
  const noCopartVariant = variants.find(v => v.plan.coparticipationType === 'partial' || v.plan.coparticipationType === 'none');

  const formatMoney = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const renderCopartLabel = (plan: HealthPlan) => {
     switch(plan.coparticipationType) {
        case 'full': 
            return <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">Com Coparticipação</span>;
        case 'partial': 
            return (
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 flex items-center gap-1">
                    Sem Copart. <span className="text-[10px] text-blue-400 font-medium uppercase">(Exceto Terapias)</span>
                </span>
            );
        case 'none': 
            return <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">Sem Coparticipação</span>;
        default: 
            return <span className="text-xs font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100">Padrão</span>;
     }
  };

  const renderVariantBlock = (v: CalculatedPlan) => {
    return (
       <div className="p-4 border-t border-gray-200 first:border-t-0 relative">
         
         {/* Header for this Variant */}
         <div className="mb-3 flex justify-between items-center">
            {renderCopartLabel(v.plan)}
         </div>

         {/* Price */}
         <div className="flex justify-between items-end mb-3">
            <span className="text-xs text-gray-500 font-medium mb-1">Total Mensal</span>
            <span className="text-2xl font-bold text-blue-900 block leading-none tracking-tight">
                {formatMoney(v.totalPrice)}
            </span>
         </div>

         {/* Breakdown */}
         <div className="bg-white rounded border border-gray-100 p-2.5 mb-3">
            <div className="space-y-1.5">
              {v.details.map((detail, dIdx) => (
                  <div key={dIdx} className="flex justify-between items-center text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                        <span className="bg-gray-100 text-gray-700 font-bold px-1.5 py-0.5 rounded text-[10px]">{detail.count}x</span>
                        <span>{detail.ageRange} anos</span>
                    </div>
                    <span className="font-mono text-gray-800 font-medium">{formatMoney(detail.subtotal)}</span>
                  </div>
              ))}
            </div>
         </div>
       </div>
    );
  };

  const renderUnavailableBlock = () => (
    <div className="p-4 border-t border-gray-200 bg-gray-50/50 opacity-70">
        <div className="mb-3 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                Sem Copart. (Exceto Terapias)
            </span>
        </div>
        <div className="flex justify-between items-end mb-3">
             <span className="text-xs text-gray-400 font-medium mb-1">Total Mensal</span>
             <span className="text-lg font-bold text-gray-400 block leading-none tracking-tight">
                 Indisponível
             </span>
        </div>
        <div className="bg-gray-100/50 rounded border border-gray-200 border-dashed p-4 mb-3 flex items-center justify-center">
            <span className="text-xs text-gray-400 italic">Opção não comercializada</span>
        </div>
    </div>
  );

  return (
    <>
      <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col h-full relative group`}>
        
        {/* Colored Header */}
        <div className={`${basePlan.logoColor} p-4 pt-5 flex justify-between items-start relative rounded-t-xl`}>
            <div className="flex-1 pr-2">
                {/* Operator Name as Title */}
                <h3 className="text-xl font-bold text-white leading-tight mb-1">
                    {basePlan.operator}
                </h3>

                {/* Plan Name as Subtitle */}
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-white/90">
                        {basePlan.name}
                    </p>
                    {/* Moved Badge */}
                    {basePlan.operator.includes('Eva') && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                            NOVIDADE
                        </span>
                    )}
                </div>
            </div>
            
            {/* View Details Button */}
            <button 
                onClick={(e) => { e.stopPropagation(); setShowPlanDetails(true); }}
                className="group/btn flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-white bg-white/15 hover:bg-white hover:text-blue-900 px-3 py-1.5 rounded-full shadow-sm transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-transparent"
                >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 transform group-hover/btn:rotate-90 transition-transform duration-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                VER DETALHES
            </button>
        </div>
        
        <div className="p-5 flex-1 flex flex-col">
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-gray-500 uppercase">Principais Hospitais:</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {basePlan.hospitals.map((h, i) => (
                <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {h}
                </span>
              ))}
            </div>
          </div>
          
        </div>

        {/* Variants List Section */}
        <div className="bg-gray-50 border-t border-gray-100 rounded-b-xl flex flex-col relative">
           {/* Render Com Coparticipação Option */}
           {fullCopartVariant && renderVariantBlock(fullCopartVariant)}

           {/* Render Sem Coparticipação Option OR Placeholder */}
           {noCopartVariant ? renderVariantBlock(noCopartVariant) : renderUnavailableBlock()}

           {/* Compare Button logic: Show if both variants exist */}
           {fullCopartVariant && noCopartVariant && (
              <div className="px-4 pb-4 pt-2">
                 <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onComparePlans([fullCopartVariant, noCopartVariant]);
                    }}
                    className="w-full bg-white border border-blue-200 shadow-sm text-blue-600 text-xs md:text-sm font-bold px-3 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 hover:shadow-md transition-all duration-200 group"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-400 group-hover:text-blue-600 transition-colors">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                    Comparar Planos
                 </button>
              </div>
           )}
        </div>
      </div>

      {showPlanDetails && (
        <PlanDetailsModal 
          planOrVariants={variants} 
          onClose={() => setShowPlanDetails(false)} 
        />
      )}
    </>
  );
};
