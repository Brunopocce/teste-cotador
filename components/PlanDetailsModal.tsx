
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CalculatedPlan, HealthPlan } from '../types';
import { AMHEMED_GRACE_DATA, FENIX_GRACE_DATA } from '../constants';

interface PlanDetailsModalProps {
  // Can accept either a single plan or array of variants. 
  // If array, we typically show details for the first one (the base plan)
  planOrVariants: CalculatedPlan[] | HealthPlan;
  onClose: () => void;
}

export const PlanDetailsModal: React.FC<PlanDetailsModalProps> = ({ planOrVariants, onClose }) => {
  // Identify the base plan
  let basePlan: HealthPlan;
  let variants: CalculatedPlan[] = [];

  if (Array.isArray(planOrVariants)) {
    if (planOrVariants.length === 0) return null;
    basePlan = planOrVariants[0].plan;
    variants = planOrVariants;
  } else {
    basePlan = planOrVariants;
  }

  // Internal State
  const [gracePeriodTab, setGracePeriodTab] = useState<string>(() => {
    return basePlan.operator === 'Fênix Medical' ? 'standard' : 'normal';
  });
  const [showCopartInfo, setShowCopartInfo] = useState(false);

  // Helper to render tabs for grace periods
  const renderGracePeriodContent = () => {
    if (basePlan.operator === 'Amhemed') {
      return (
        <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button onClick={() => setGracePeriodTab('normal')} className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors ${gracePeriodTab === 'normal' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>Normal<br/><span className="text-[9px] font-normal lowercase">(novo plano)</span></button>
            <button onClick={() => setGracePeriodTab('red1')} className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors ${gracePeriodTab === 'red1' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>Redução 1<br/><span className="text-[9px] font-normal lowercase">(&gt; 12 meses)</span></button>
            <button onClick={() => setGracePeriodTab('red2')} className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors ${gracePeriodTab === 'red2' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>Redução 2<br/><span className="text-[9px] font-normal lowercase">(&gt; 24 meses)</span></button>
          </div>
          <div className="p-3">
            <ul className="text-xs text-gray-600 space-y-2">{(AMHEMED_GRACE_DATA[gracePeriodTab as keyof typeof AMHEMED_GRACE_DATA] as any[]).map((item, idx) => (<li key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-100 last:border-0 pb-2 last:pb-0"><span>{item.label}</span><span className={`font-bold ${item.highlight ? 'text-green-600 font-extrabold text-sm' : 'text-gray-900'}`}>{item.value}</span></li>))}</ul>
          </div>
          <div className="bg-amber-50 border-t border-amber-200 p-3 text-xs text-amber-900"><p className="font-bold mb-1">⚠️ Doenças e Lesões Pré-existentes (CPT)</p><p>A carência de 24 meses aplica-se <strong>exclusivamente</strong> a procedimentos de alta complexidade, cirurgias e leitos de alta tecnologia (UTI) relacionados diretamente à doença declarada. Consultas e exames simples seguem os prazos normais.</p></div>
        </div>
      );
    } 
    
    if (basePlan.operator === 'Fênix Medical') {
      return (
        <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button onClick={() => setGracePeriodTab('standard')} className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors ${gracePeriodTab === 'standard' || gracePeriodTab === 'normal' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>Carência 1 (C1)<br/><span className="text-[9px] font-normal lowercase">(novo plano)</span></button>
            <button onClick={() => setGracePeriodTab('reduced')} className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors ${gracePeriodTab === 'reduced' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>Aproveitamento<br/><span className="text-[9px] font-normal lowercase">(&gt; 12 meses)</span></button>
          </div>
          <div className="p-3">
            <ul className="text-xs text-gray-600 space-y-2">{(FENIX_GRACE_DATA[gracePeriodTab === 'reduced' ? 'reduced' : 'standard'] as any[]).map((item, idx) => (<li key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-100 last:border-0 pb-2 last:pb-0"><span>{item.label}</span><span className={`font-bold ${item.highlight ? 'text-green-600 font-extrabold text-sm' : 'text-gray-900'}`}>{item.value}</span></li>))}</ul>
          </div>
          <div className="bg-amber-50 border-t border-amber-200 p-3 text-xs text-amber-900"><p className="font-bold mb-1">⚠️ Doenças e Lesões Pré-existentes (CPT)</p><p>A carência de 24 meses aplica-se <strong>exclusivamente</strong> a procedimentos de alta complexidade, cirurgias e leitos de alta tecnologia (UTI) relacionados diretamente à doença declarada. Consultas e exames simples seguem os prazos normais.</p></div>
        </div>
      );
    }

    // Default Grace Period
    return (
      <ul className="text-sm text-gray-600 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
        {basePlan.gracePeriods.map((gp, i) => (
          <li key={i} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
            <span>{gp}</span>
          </li>
        ))}
      </ul>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh] animate-slideUp" onClick={e => e.stopPropagation()}>
            {/* Minimalist Header */}
            <div className={`${basePlan.logoColor} p-3 px-5 rounded-t-2xl border-b border-white/10 flex justify-between items-center flex-shrink-0 shadow-sm`}>
                <h3 className="text-lg font-bold text-white leading-tight tracking-tight">
                    {basePlan.name}
                </h3>
                <button onClick={onClose} className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/20 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <div>
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-600"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                        Abrangência Geográfica
                    </h4>
                    <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">{basePlan.coverage}</p>
                </div>

                <div>
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-600"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        Carências (Estimadas)
                    </h4>
                    {renderGracePeriodContent()}
                </div>

                <button onClick={() => setShowCopartInfo(true)} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 py-3 rounded-lg transition-colors uppercase tracking-wide">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-500/80"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 0 1-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.539 1.345 1.902 3.56 1.02 5.51-.686 1.52-2.255 2.447-3.232 3.12l-.052.036c-.906.62-2.055 1.407-2.055 2.88a.75.75 0 0 1-1.5 0c0-2.247 1.477-3.395 2.615-4.173l.052-.036c.888-.607 1.915-1.309 2.305-2.174.464-1.025.271-2.167-.537-2.874Z" clipRule="evenodd" /><path d="M12 18.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" /></svg>
                    Entenda o que é coparticipação
                </button>

                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-600"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg>
                        Tabelas de Coparticipação
                    </h4>

                    {basePlan.operator === 'Eva Saúde' && (
                        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                            <div className="p-2 bg-teal-100 rounded-full text-teal-600 shrink-0 mt-1"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg></div>
                            <div><h4 className="font-bold text-teal-900 text-sm mb-1">Diferencial Exclusivo: Limitador Mensal</h4><p className="text-teal-800 text-xs leading-relaxed">O valor total pago em coparticipação nunca ultrapassa <strong>R$ 250,00 por mês</strong>, independentemente da quantidade de consultas ou procedimentos realizados.</p></div>
                        </div>
                    )}
                    
                    {variants.map((v, index) => {
                        const type = v.plan.coparticipationType;
                        let theme = { border: 'border-gray-200', header: 'bg-gray-100 text-gray-700', body: 'bg-white', th: 'bg-white text-gray-700', divide: 'divide-gray-100' };
                        if (type === 'full') theme = { border: 'border-orange-200', header: 'bg-orange-100 text-orange-800', body: 'bg-orange-50/30', th: 'bg-orange-50 text-orange-900', divide: 'divide-orange-100' };
                        else if (type === 'partial') theme = { border: 'border-blue-200', header: 'bg-blue-100 text-blue-800', body: 'bg-blue-50/30', th: 'bg-blue-50 text-blue-900', divide: 'divide-blue-100' };
                        else if (type === 'none') theme = { border: 'border-green-200', header: 'bg-green-100 text-green-800', body: 'bg-green-50/30', th: 'bg-green-50 text-green-900', divide: 'divide-green-100' };

                        return (<div key={index} className={`rounded-lg border ${theme.border} overflow-hidden mb-4 last:mb-0`}><div className={`${theme.header} px-4 py-2 border-b ${theme.border}`}><span className="text-xs font-bold uppercase">{type === 'none' ? 'Sem Coparticipação' : type === 'partial' ? 'Sem Copart. (Exceto Terapias)' : 'Com Coparticipação'}</span></div>{type !== 'none' ? (<div className={theme.body}><table className="min-w-full text-sm text-left"><thead className={`${theme.th} font-bold border-b ${theme.border}`}><tr><th className="px-3 py-2 text-xs">Serviço</th><th className="px-3 py-2 text-xs">Valor</th></tr></thead><tbody className={`divide-y ${theme.divide}`}>{v.plan.copayFees.map((fee, i) => (<tr key={i} className="hover:bg-white/50"><td className="px-3 py-2 text-gray-700 text-xs">{fee.service}</td><td className="px-3 py-2 font-medium text-gray-900 text-xs">{fee.value}</td></tr>))}</tbody></table></div>) : (<div className="p-4 text-center"><p className="text-green-700 font-bold text-sm">Este plano não possui coparticipação.</p><p className="text-green-600 text-xs">Uso livre sem taxas adicionais.</p></div>)}</div>);
                    })}
                </div>
                
                <p className="text-[10px] text-gray-400 italic text-center mt-4">* Os valores e condições podem sofrer alterações sem aviso prévio. Consulte o contrato final.</p>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex-shrink-0">
                <button onClick={onClose} className="w-full bg-blue-900 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20">Fechar</button>
            </div>
        </div>

        {/* Nested Copart Info Modal */}
        {showCopartInfo && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={() => setShowCopartInfo(false)}>
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
          </div>
        )}
    </div>,
    document.body
  );
};
