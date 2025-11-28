
import React from 'react';
import { CalculatedPlan, HealthPlan, UserProfile } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ComparisonModalProps {
  plans: CalculatedPlan[];
  userProfile: UserProfile | null;
  onClose: () => void;
  onRemove: (plan: CalculatedPlan) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({ plans, userProfile, onClose, onRemove }) => {
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

  const handleDownloadPDF = async () => {
    const element = document.getElementById('comparison-table-container');
    if(!element) return;

    // Create a PDF instance
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    
    // Header Blue Background
    pdf.setFillColor(0, 51, 102); // #003366
    pdf.rect(0, 0, pdfWidth, 40, 'F');

    // Header Text
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.text('Comparativo de Planos', 10, 15);

    pdf.setFontSize(10);
    if (userProfile) {
        pdf.text(`Corretor: ${userProfile.full_name || 'N/A'}`, 10, 25);
        pdf.text(`Contato: ${userProfile.phone || 'N/A'}`, 10, 30);
    }
    pdf.text(`Data: ${new Date().toLocaleDateString()}`, 10, 35);

    try {
        // Capture the Table with adjustments for PDF
        const canvas = await html2canvas(element, { 
            scale: 2, 
            useCORS: true,
            // Use onclone to modify the DOM before capture to ensure clean rendering
            onclone: (clonedDoc) => {
                const clonedElement = clonedDoc.getElementById('comparison-table-container');
                if (clonedElement) {
                    // 0. ENSURE DESKTOP TABLE IS VISIBLE AND MOBILE HIDDEN
                    const desktopTable = clonedElement.querySelector('table');
                    const mobileView = clonedElement.querySelector('.mobile-view-container');
                    
                    if (desktopTable) desktopTable.style.display = 'table';
                    if (mobileView) mobileView.style.display = 'none';

                    // 1. Remove sticky positioning which often breaks html2canvas
                    const stickyElements = clonedElement.querySelectorAll('.sticky');
                    stickyElements.forEach(el => {
                        el.classList.remove('sticky', 'top-0', 'left-0');
                        (el as HTMLElement).style.position = 'static';
                        (el as HTMLElement).style.boxShadow = 'none';
                        (el as HTMLElement).style.borderRight = '1px solid #e5e7eb'; // Re-apply simple border
                    });

                    // 2. Force desktop width to ensure badges don't wrap weirdly
                    clonedElement.style.width = '1200px'; 
                    clonedElement.style.overflow = 'visible';
                    clonedElement.style.height = 'auto';

                    // 3. Ensure badges have visible background and correct alignment
                    const badges = clonedElement.querySelectorAll('.operator-badge');
                    badges.forEach(badge => {
                         const el = badge as HTMLElement;
                         el.style.setProperty('-webkit-print-color-adjust', 'exact');
                         el.style.setProperty('print-color-adjust', 'exact');
                         
                         // Enforce Flexbox Centering specifically for the PDF Capture
                         el.style.display = 'flex';
                         el.style.flexDirection = 'row';
                         el.style.alignItems = 'center';
                         el.style.justifyContent = 'center';
                         el.style.textAlign = 'center';
                         
                         // Dimensions & Spacing
                         el.style.margin = '0 auto 12px auto'; 
                         el.style.width = 'fit-content'; 
                         el.style.minWidth = '160px'; 
                         el.style.height = '50px'; 
                         el.style.padding = '0 20px'; 
                         el.style.borderRadius = '12px';
                         
                         // Text Styles
                         el.style.color = '#ffffff';
                         el.style.fontSize = '22px'; 
                         el.style.fontWeight = '700'; 
                         el.style.lineHeight = '1.2'; 

                         const span = el.querySelector('span');
                         if (span) {
                             span.style.width = 'auto';
                             span.style.display = 'block';
                             span.style.marginTop = '0';
                             span.style.marginBottom = '0';
                         }
                    });
                }
            }
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // Add image below the header (y=45)
        pdf.addImage(imgData, 'PNG', 0, 45, pdfWidth, pdfHeight);
        
        pdf.save('cotacao-planos.pdf');

    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Houve um erro ao gerar o PDF. Tente novamente.");
    }
  };

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
          <div className="flex items-center gap-2">
            <button
                onClick={handleDownloadPDF}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold shadow-sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Baixar PDF
            </button>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto bg-white custom-scrollbar" id="comparison-content">
          <div id="comparison-table-container" className="bg-white">
            
            {/* === DESKTOP TABLE VIEW (Hidden on Mobile) === */}
            <table className="hidden md:table w-full text-left border-collapse table-fixed md:table-auto">
                <thead>
                <tr>
                    <th className="p-3 md:p-5 w-[120px] md:w-[250px] sticky left-0 top-0 bg-white z-30 border-b-2 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] md:shadow-none md:border-r-2 md:border-gray-100">
                    <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Características</span>
                    </th>
                    {plans.map((cp, idx) => (
                    <th key={idx} className="p-3 md:p-5 min-w-[160px] md:min-w-[300px] border-b-2 border-gray-100 align-top relative group bg-white sticky top-0 z-20 text-center">
                        <div className={`operator-badge flex items-center justify-center px-4 h-[42px] rounded-[10px] text-[18px] font-semibold text-white mb-2 ${cp.plan.logoColor} shadow-sm mx-auto min-w-[130px] w-auto inline-flex`}>
                            <span className="leading-tight">{cp.plan.operator}</span>
                        </div>
                        <h3 className="text-sm md:text-xl font-bold text-gray-800 leading-tight mb-1 text-left md:text-center">{cp.plan.name}</h3>
                        <p className="text-[10px] md:text-sm text-gray-500 font-medium text-left md:text-center">{getCopartLabel(cp.plan)}</p>
                    </th>
                    ))}
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                <tr className="bg-blue-50/30">
                    <td className="p-3 md:p-5 text-xs md:text-sm font-bold text-gray-700 sticky left-0 bg-[#f8fafc] z-20 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] md:shadow-none md:border-gray-200">
                        Mensalidade Total
                    </td>
                    {plans.map((cp, idx) => (
                    <td key={idx} className="p-3 md:p-5 bg-blue-50/30 text-center">
                        <span className="text-lg md:text-3xl font-bold text-blue-900 block whitespace-nowrap">{formatMoney(cp.totalPrice)}</span>
                    </td>
                    ))}
                </tr>
                <tr>
                    <td className="p-3 md:p-5 text-xs md:text-sm font-bold text-gray-700 sticky left-0 bg-white z-20 align-top border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] md:shadow-none">
                        Preço por Vida
                        <span className="block text-[9px] md:text-[10px] font-normal text-gray-400 mt-1">Unitário por faixa</span>
                    </td>
                    {plans.map((cp, idx) => (
                    <td key={idx} className="p-3 md:p-5 align-top">
                        <div className="space-y-2 md:space-y-1">
                            {cp.details.map((det, i) => (
                                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between border-b border-dashed border-gray-100 last:border-0 pb-1">
                                    <span className="text-gray-500 text-[10px] md:text-sm md:w-32 text-left">{det.ageRange} anos</span>
                                    <span className="font-medium text-gray-800 text-xs md:text-sm">{formatMoney(det.unitPrice)}</span>
                                </div>
                            ))}
                        </div>
                    </td>
                    ))}
                </tr>
                <tr className="bg-gray-50">
                    <td colSpan={plans.length + 1} className="p-2 md:p-3 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider text-center border-y border-gray-200 sticky left-0 z-10">
                    Tabela de Coparticipação
                    </td>
                </tr>
                {allServices.map((service, sIdx) => (
                    <tr key={sIdx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 md:p-5 text-xs md:text-sm font-bold text-gray-700 sticky left-0 bg-white z-20 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] md:shadow-none">
                        {service}
                    </td>
                    {plans.map((cp, pIdx) => {
                        const fee = cp.plan.copayFees.find(f => f.service === service);
                        return (
                            <td key={pIdx} className="p-3 md:p-5 text-xs md:text-base text-gray-600 text-center md:text-left">
                                {fee ? fee.value : '-'}
                            </td>
                        );
                    })}
                    </tr>
                ))}
                </tbody>
            </table>

            {/* === MOBILE MINIMALIST VIEW (Visible only on Mobile) === */}
            <div className="md:hidden mobile-view-container pb-12">
                {/* Sticky Header for Mobile */}
                <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
                   <div className="grid" style={{ gridTemplateColumns: `repeat(${plans.length}, minmax(0, 1fr))` }}>
                      {plans.map((cp, idx) => (
                         <div key={idx} className={`p-2 text-center border-r border-gray-100 last:border-0`}>
                             <div className={`h-1.5 w-full rounded-full ${cp.plan.logoColor} mb-1.5 mx-auto max-w-[40px]`}></div>
                             <h3 className="text-xs font-bold text-gray-800 leading-tight truncate">{cp.plan.operator}</h3>
                             <p className="text-[9px] text-gray-500 truncate">{cp.plan.name}</p>
                         </div>
                      ))}
                   </div>
                </div>

                {/* Content Rows */}
                <div className="divide-y divide-gray-100">
                    
                    {/* Mensalidade */}
                    <div className="bg-blue-50/50">
                        <div className="py-2 px-4 text-center">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Mensalidade Total</span>
                        </div>
                        <div className="grid pb-4" style={{ gridTemplateColumns: `repeat(${plans.length}, minmax(0, 1fr))` }}>
                            {plans.map((cp, idx) => (
                                <div key={idx} className="text-center px-1 border-r border-gray-200/50 last:border-0">
                                    <span className="text-lg font-bold text-blue-900 block tracking-tight">{formatMoney(cp.totalPrice)}</span>
                                    <span className="text-[9px] text-blue-600/80 block leading-none mt-0.5 font-medium">
                                        {cp.plan.coparticipationType === 'none' ? 'Sem Copart.' : 
                                         cp.plan.coparticipationType === 'partial' ? 'Parcial' : 'Com Copart.'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Age Details (Collapsed/Simplified) */}
                    <div>
                        <div className="py-2 px-4 text-center bg-gray-50 border-y border-gray-100">
                             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Preço Unitário por Idade</span>
                        </div>
                        <div className="grid" style={{ gridTemplateColumns: `repeat(${plans.length}, minmax(0, 1fr))` }}>
                             {plans.map((cp, idx) => (
                                <div key={idx} className="p-2 border-r border-gray-100 last:border-0">
                                    <div className="space-y-1.5">
                                        {cp.details.map((det, i) => (
                                            <div key={i} className="flex flex-col items-center">
                                                <span className="text-[9px] text-gray-400">{det.ageRange} anos</span>
                                                <span className="text-xs font-medium text-gray-700">{formatMoney(det.unitPrice)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             ))}
                        </div>
                    </div>

                     {/* Copay Section */}
                     <div>
                        <div className="py-3 px-4 text-center bg-gray-100 border-y border-gray-200 mt-2">
                             <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Coparticipação</span>
                        </div>
                        {allServices.map((service, sIdx) => (
                            <div key={sIdx} className="border-b border-gray-50 last:border-0">
                                <div className="py-1.5 text-center bg-[#fafafa]">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">{service}</span>
                                </div>
                                <div className="grid py-2" style={{ gridTemplateColumns: `repeat(${plans.length}, minmax(0, 1fr))` }}>
                                    {plans.map((cp, pIdx) => {
                                        const fee = cp.plan.copayFees.find(f => f.service === service);
                                        return (
                                            <div key={pIdx} className="text-center px-1 border-r border-gray-100 last:border-0 flex items-center justify-center">
                                                <span className="text-[10px] font-medium text-gray-600 leading-tight">
                                                    {fee ? fee.value : '-'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>

          </div>
        </div>
        
        {/* Mobile Action Footer */}
        <div className="md:hidden p-3 bg-white border-t border-gray-200 flex-shrink-0 flex items-center justify-center gap-4 z-50 relative shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
             <button onClick={onClose} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-bold text-sm">
                Fechar
             </button>
             <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold shadow-sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Baixar PDF
            </button>
        </div>
      </div>
    </div>
  );
};
