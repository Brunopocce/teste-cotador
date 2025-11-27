import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_PLANS, AGE_RANGES } from './constants';
import { AgeRange, UserSelection, CalculatedPlan, QuoteCategory, HealthPlan, UserProfile } from './types';
import { AgeSelector } from './components/AgeSelector';
import { PlanCard } from './components/PlanCard';
import { ComparisonModal } from './components/ComparisonModal';
import { PriceSummaryTable } from './components/PriceSummaryTable';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { AdminPanel } from './components/AdminPanel';
import { UpdatePasswordScreen } from './components/UpdatePasswordScreen';
import { supabase } from './services/supabaseClient';

// Updated steps to separate age input from results
type AppStep = 'type-selection' | 'lives-selection' | 'age-input' | 'results';
type AuthState = 'LOADING' | 'LOGIN' | 'REGISTER' | 'ADMIN' | 'PENDING' | 'REJECTED' | 'UPDATE_PASSWORD' | 'APP';

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [authState, setAuthState] = useState<AuthState>('LOADING');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // --- APP STATE ---
  const [step, setStep] = useState<AppStep>('type-selection');
  const [quoteCategory, setQuoteCategory] = useState<QuoteCategory | null>(null);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [comparisonModalPlans, setComparisonModalPlans] = useState<CalculatedPlan[] | null>(null);
  const [userSelection, setUserSelection] = useState<UserSelection>(() => {
    const initial: UserSelection = {};
    AGE_RANGES.forEach(range => initial[range as string] = 0);
    return initial;
  });
  const [calculatedPlans, setCalculatedPlans] = useState<CalculatedPlan[]>([]);
  const [groupedPlans, setGroupedPlans] = useState<CalculatedPlan[][]>([]);

  const whatsappLink = "https://wa.me/5515991789707?text=Ol%C3%A1%2C%20Bruno!%0AQuero%20mais%20informa%C3%A7%C3%B5es%20sobre%20*plano%20de%20sa%C3%BAde*";

  // --- LOGIC HOOKS (MOVED UP TO FIX ERROR #310) ---

  const totalLives = Object.values(userSelection).reduce((acc: number, curr: number) => acc + curr, 0);

  const isSoloMinor = useMemo(() => {
    if (totalLives === 0) return false;
    const minorCount = userSelection[AgeRange.RANGE_0_18] || 0;
    return minorCount === totalLives;
  }, [userSelection, totalLives]);

  // Calculation Effect
  useEffect(() => {
    const activeAges = (Object.entries(userSelection) as [string, number][]).filter(([_, count]) => count > 0);
    let availablePlans = MOCK_PLANS.filter(p => quoteCategory && p.categories.includes(quoteCategory));

    if (quoteCategory === 'PF' && isSoloMinor) {
      availablePlans = availablePlans.filter(p => !p.operator.toLowerCase().includes('fênix'));
    }

    if (activeAges.length === 0) {
      setCalculatedPlans([]);
      setGroupedPlans([]);
      return;
    }

    const results: CalculatedPlan[] = availablePlans.map(plan => {
      let total = 0;
      const details = [];
      for (const [range, count] of activeAges) {
        const price = plan.prices[range] || 0;
        const subtotal = price * count;
        total += subtotal;
        details.push({ ageRange: range, count, unitPrice: price, subtotal });
      }
      return { plan, totalPrice: total, details };
    }).sort((a, b) => {
      const getPlanWeight = (plan: HealthPlan) => {
        const op = plan.operator.toLowerCase();
        const name = plan.name.toLowerCase();
        if (op.includes('amhemed')) {
          if (name.includes('ideal')) return 10;
          if (name.includes('amhe+')) return 11;
          if (name.includes('plus')) return 12;
          return 19;
        }
        if (op.includes('gndi') || op.includes('notredame')) {
          if (name.includes('nosso')) return 20;
          if (name.includes('notrelife')) return 21;
          if (name.includes('200')) return 22;
          if (name.includes('400')) return 23;
          return 29;
        }
        if (op.includes('eva')) return 30;
        if (op.includes('fênix') || op.includes('fenix')) return 40;
        if (op.includes('unimed')) return 50;
        if (op.includes('amil')) return 60;
        return 100;
      };
      const weightA = getPlanWeight(a.plan);
      const weightB = getPlanWeight(b.plan);
      if (weightA !== weightB) return weightA - weightB;
      return a.totalPrice - b.totalPrice;
    });

    setCalculatedPlans(results);

    const groupedMap = new Map<string, CalculatedPlan[]>();
    results.forEach(cp => {
      const key = `${cp.plan.operator}|${cp.plan.name}|${cp.plan.type}`;
      if (!groupedMap.has(key)) groupedMap.set(key, []);
      groupedMap.get(key)?.push(cp);
    });
    setGroupedPlans(Array.from(groupedMap.values()));

  }, [userSelection, quoteCategory, isSoloMinor]);

  // --- AUTH EFFECT ---
  useEffect(() => {
    checkUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            setAuthState('UPDATE_PASSWORD');
        } else if (event === 'SIGNED_IN') {
            if (session?.user) {
                fetchUserProfile(session.user.id);
            }
        } else if (event === 'SIGNED_OUT') {
            setAuthState('LOGIN');
            setCurrentUser(null);
        }
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUserSession = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
           await fetchUserProfile(session.user.id);
        } else {
           setAuthState('LOGIN');
        }
    } catch (e) {
        console.error("Error checking session: ", e);
        setAuthState('LOGIN'); // Fallback to login on error
    }
  };

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
       setCurrentUser(data as UserProfile);
       if (data.status === 'approved') {
          setAuthState('APP');
       } else if (data.status === 'rejected') {
          setAuthState('REJECTED');
       } else {
          setAuthState('PENDING');
       }
    } else {
      // User authenticated but no profile found. Force logout to fix state.
      await supabase.auth.signOut();
      setAuthState('LOGIN');
    }
  };

  const handleLoginSuccess = (isAdmin: boolean) => {
    if (isAdmin) {
      setAuthState('ADMIN');
    } else {
      // The onAuthStateChange listener will handle the transition
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // --- HELPER FUNCTIONS ---

  const selectCategory = (category: QuoteCategory) => {
    setQuoteCategory(category);
    const initial: UserSelection = {};
    AGE_RANGES.forEach(range => initial[range as string] = 0);
    setUserSelection(initial);
    setShowLimitAlert(false);
    setComparisonModalPlans(null);
    setStep('age-input');
  };

  const goBack = () => {
    if (step === 'results') {
      setStep('age-input');
      setComparisonModalPlans(null);
    } else if (step === 'age-input') {
      if (quoteCategory === 'PF') {
        setStep('type-selection');
        setQuoteCategory(null);
      } else {
        setStep('lives-selection');
      }
    } else if (step === 'lives-selection') {
      setStep('type-selection');
    }
  };

  const switchToGroupPlan = () => {
    setQuoteCategory('PME_2');
    setShowLimitAlert(false);
  };

  const switchToPME1 = () => {
    setQuoteCategory('PME_1');
    setShowLimitAlert(false);
  };

  const switchToPF = () => {
    setQuoteCategory('PF');
    setShowLimitAlert(false);
  };

  const handleIncrement = (range: string) => {
    setUserSelection(prev => ({ ...prev, [range]: prev[range] + 1 }));
    setShowLimitAlert(false);
  };

  const handleDecrement = (range: string) => {
    setUserSelection(prev => ({ ...prev, [range]: Math.max(0, prev[range] - 1) }));
    setShowLimitAlert(false);
  };

  const handleComparePlans = (plansToCompare: CalculatedPlan[]) => {
      setComparisonModalPlans(plansToCompare);
  };

  const handleContinueToResults = () => {
    if (totalLives === 0) return;
    if (quoteCategory === 'PME_1' && totalLives > 1) return;
    if (quoteCategory === 'PME_2' && totalLives < 2) return;
    if (quoteCategory?.startsWith('PME') && isSoloMinor) return;

    setStep('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCategoryTitle = () => {
    switch (quoteCategory) {
      case 'PF': return 'Pessoa Física';
      case 'PME_1': return 'CNPJ / MEI (1 Vida)';
      case 'PME_2': return 'CNPJ / MEI (2-29 Vidas)';
      case 'PME_30': return 'CNPJ / MEI (+30 Vidas)';
      default: return '';
    }
  };

  const isPME = quoteCategory?.startsWith('PME');


  // --- MAIN RENDER ---

  if (authState === 'LOADING') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-[#003366] font-bold">Carregando...</div>;
  }
  
  if (authState === 'UPDATE_PASSWORD') {
    return <UpdatePasswordScreen onPasswordUpdated={() => setAuthState('LOGIN')} />;
  }

  if (authState === 'ADMIN') {
    return <AdminPanel onLogout={() => setAuthState('LOGIN')} />;
  }

  if (authState === 'LOGIN') {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} onGoToRegister={() => setAuthState('REGISTER')} />;
  }

  if (authState === 'REGISTER') {
    return (
        <RegisterScreen 
            onBackToLogin={() => setAuthState('LOGIN')} 
            onRegisterSuccess={() => setAuthState('PENDING')} 
        />
    );
  }

  if (authState === 'PENDING') {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
           <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
              <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Aguardando Aprovação</h2>
              <p className="text-gray-600 mb-6">Seu cadastro foi realizado com sucesso. Um administrador precisa liberar seu acesso.</p>
              <button onClick={handleLogout} className="text-blue-600 font-bold hover:underline">Voltar ao Login</button>
           </div>
        </div>
    );
  }

  if (authState === 'REJECTED') {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
           <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h2>
              <p className="text-gray-600 mb-6">Infelizmente seu cadastro não foi aprovado pelo administrador.</p>
              <button onClick={handleLogout} className="text-blue-600 font-bold hover:underline">Voltar ao Login</button>
           </div>
        </div>
    );
  }

  // --- APP UI ---
  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end cursor-pointer group select-none" onClick={() => {
               setStep('type-selection');
               setQuoteCategory(null);
            }}>
                <div className="flex items-center gap-1">
                    {/* Venda */}
                    <span className="text-xl md:text-3xl font-bold text-[#003366] tracking-tight">Venda</span>
                    
                    {/* Icon + */}
                    <div className="mx-1 relative flex items-center justify-center h-6 w-6 md:h-9 md:w-9">
                        <div className="absolute inset-0 bg-[#003366] rounded opacity-10 transform rotate-45 transition-transform group-hover:rotate-90 duration-500"></div>
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 md:w-6 md:h-6 text-[#003366] z-10">
                           <path d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M17,13h-3.5V16.5 c0,0.83-0.67,1.5-1.5,1.5s-1.5-0.67-1.5-1.5V13H7c-0.83,0-1.5-0.67-1.5-1.5S6.17,10,7,10h3.5V6.5C10.5,5.67,11.17,5,12,5 s1.5,0.67,1.5,1.5V10H17c0.83,0,1.5,0.67,1.5,1.5S17.83,13,17,13z"/>
                        </svg>
                    </div>
                    
                    {/* Saúde */}
                    <span className="text-2xl md:text-4xl font-cursive text-[#003366] mt-0.5">Saúde</span>
                </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button onClick={handleLogout} className="text-xs md:text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors">
                Sair
             </button>
             <div className="w-8 h-8 md:w-9 md:h-9 bg-blue-100 rounded-full flex items-center justify-center text-[#003366] font-bold text-sm md:text-base border border-blue-200">
                {currentUser?.full_name?.charAt(0) || 'U'}
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VIEW 1: TYPE SELECTION */}
        {step === 'type-selection' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slideUp">
            <h1 className="text-3xl font-bold text-[#003366] mb-2 text-center">Vamos começar sua cotação</h1>
            <p className="text-gray-600 mb-10 text-center">Escolha o tipo de contratação ideal para você ou sua empresa.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
              <button 
                onClick={() => {
                  selectCategory('PF');
                }}
                className="group relative bg-white p-8 rounded-2xl shadow-md border-2 border-transparent hover:border-[#003366] hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#003366] group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Pessoa Física</h3>
                <p className="text-gray-500 text-sm">Planos individuais ou familiares (CPF).</p>
                <p className="mt-4 text-xs font-semibold text-[#003366] opacity-0 group-hover:opacity-100 transition-opacity">
                  Amhemed, GNDI, Fênix
                </p>
              </button>

              <button 
                onClick={() => {
                  setStep('lives-selection');
                }}
                className="group relative bg-white p-8 rounded-2xl shadow-md border-2 border-transparent hover:border-[#003366] hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#003366] group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">CNPJ e MEI</h3>
                <p className="text-gray-500 text-sm">Planos empresariais com tabela reduzida.</p>
                <p className="mt-4 text-xs font-semibold text-[#003366] opacity-0 group-hover:opacity-100 transition-opacity">
                  Unimed, Amil, Eva, e mais...
                </p>
              </button>
            </div>
          </div>
        )}
        
        {/* ... Rest of the component (View 2, 3, 4) remains largely the same ... */}
        {/* VIEW 2: LIVES SELECTION (CNPJ) */}
        {step === 'lives-selection' && (
           <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slideUp">
             <div className="w-full max-w-5xl px-4 mb-4">
                <button onClick={goBack} className="flex items-center text-gray-500 hover:text-[#003366] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    Voltar
                </button>
             </div>

             <h1 className="text-3xl font-bold text-[#003366] mb-2 text-center">Quantas vidas?</h1>
             <p className="text-gray-600 mb-10 text-center">Selecione o porte da sua empresa para ver as opções disponíveis.</p>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl px-4">
                {/* 1 VIDA */}
                <button 
                  onClick={() => selectCategory('PME_1')}
                  className="bg-white p-6 rounded-xl shadow border border-gray-100 hover:border-[#003366] hover:shadow-lg transition-all text-center"
                >
                  <div className="text-4xl font-bold text-[#003366] mb-2">1</div>
                  <div className="text-gray-600 font-medium">Vida</div>
                  <p className="text-xs text-gray-400 mt-2">Amhemed, GNDI, Unimed</p>
                </button>

                {/* 2-29 VIDAS */}
                <button 
                  onClick={() => selectCategory('PME_2')}
                  className="bg-white p-6 rounded-xl shadow border border-gray-100 hover:border-[#003366] hover:shadow-lg transition-all text-center transform scale-105 ring-2 ring-blue-50"
                >
                  <div className="text-4xl font-bold text-[#003366] mb-2">2 a 29</div>
                  <div className="text-gray-600 font-medium">Vidas</div>
                  <p className="text-xs text-gray-400 mt-2">Todas as operadoras + Descontos</p>
                </button>

                {/* 30+ VIDAS */}
                <button 
                  onClick={() => selectCategory('PME_30')}
                  className="bg-white p-6 rounded-xl shadow border border-gray-100 hover:border-[#003366] hover:shadow-lg transition-all text-center"
                >
                  <div className="text-4xl font-bold text-[#003366] mb-2">30+</div>
                  <div className="text-gray-600 font-medium">Vidas</div>
                  <p className="text-xs text-gray-400 mt-2">Condições Especiais</p>
                </button>
             </div>
           </div>
        )}

        {/* VIEW 3: AGE INPUT */}
        {step === 'age-input' && (
          <div className="flex flex-col items-center justify-start min-h-[60vh] animate-slideUp pt-4">
            <div className="w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                 <button onClick={goBack} className="flex items-center text-gray-500 hover:text-[#003366]">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                  Voltar
                 </button>
                 <div className="text-right">
                   <p className="text-sm text-gray-500">Cotação para:</p>
                   <p className="font-bold text-[#003366]">{getCategoryTitle()}</p>
                 </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Quem será coberto?</h2>
              <p className="text-gray-500 mb-8 text-center">Adicione a quantidade de pessoas por faixa etária.</p>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                 
                 {/* Table Header */}
                 <div className="flex justify-between items-center px-3 mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Faixa Etária</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quantidade</span>
                 </div>

                 <div className="space-y-3">
                    {AGE_RANGES.map((range) => (
                      <AgeSelector 
                        key={range}
                        range={range as string}
                        count={userSelection[range as string]}
                        onIncrement={handleIncrement}
                        onDecrement={handleDecrement}
                      />
                    ))}
                 </div>

                 <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-gray-600 font-medium">Total de vidas:</span>
                      <span className="text-3xl font-bold text-blue-600">{totalLives}</span>
                    </div>

                    <button 
                      onClick={handleContinueToResults}
                      disabled={
                          totalLives === 0 || 
                          (isPME && isSoloMinor) || 
                          (quoteCategory === 'PME_1' && totalLives > 1) ||
                          (quoteCategory === 'PME_2' && totalLives === 1)
                      }
                      className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform
                        ${totalLives > 0 && !(isPME && isSoloMinor) && !(quoteCategory === 'PME_1' && totalLives > 1) && !(quoteCategory === 'PME_2' && totalLives === 1)
                          ? 'bg-[#003366] text-white hover:bg-[#002244] hover:scale-[1.02]' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    >
                      Avançar para Cotação
                    </button>
                    
                    {/* Age Restriction Alert for PME (Solo Minor) */}
                    {isPME && isSoloMinor && totalLives > 0 && (
                      <div className="mt-6 bg-red-50 p-5 rounded-xl border border-red-200 animate-fadeIn">
                        <div className="flex items-start gap-3">
                           <div className="p-2 bg-red-100 rounded-full text-red-600 shrink-0">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                               <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                             </svg>
                           </div>
                           <div className="flex-1">
                             <h4 className="font-bold text-red-900 text-base mb-1">É necessário um titular adulto</h4>
                             <p className="text-red-800 text-sm">
                               Planos empresariais não podem ser contratados exclusivamente para menores de idade.
                             </p>
                             <p className="text-red-800 text-sm mt-2">
                               Por favor, <strong>adicione ao menos um adulto</strong> para prosseguir.
                             </p>
                           </div>
                        </div>
                      </div>
                    )}

                    {/* Warning PME 1 > 1 Life */}
                    {quoteCategory === 'PME_1' && totalLives > 1 && !(isPME && isSoloMinor) && (
                      <div className="mt-6 bg-orange-50 p-5 rounded-xl border border-orange-200 animate-fadeIn">
                        <div className="flex items-start gap-3">
                           <div className="p-2 bg-orange-100 rounded-full text-orange-600 shrink-0">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                               <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                             </svg>
                           </div>
                           <div className="flex-1">
                             <h4 className="font-bold text-orange-900 text-base mb-1">Ajuste necessário</h4>
                             <p className="text-orange-800 text-sm mb-3">
                               A modalidade <strong>"1 Vida"</strong> é exclusiva para o <strong>titular do CNPJ</strong>.
                             </p>
                             <p className="text-orange-800 text-sm mb-4">
                               Para prosseguir, <strong>selecione apenas 1 vida acima</strong> ou altere para a modalidade de <strong>2 a 29 vidas</strong>:
                             </p>

                             <button 
                               onClick={switchToGroupPlan}
                               className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg shadow-sm transition-colors flex items-center justify-between group"
                             >
                                <span className="text-sm font-bold">Alterar para 2 a 29 vidas</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 transform group-hover:translate-x-1 transition-transform">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                </svg>
                             </button>
                           </div>
                        </div>
                      </div>
                    )}

                    {/* Warning PME 2-29 with 1 Life */}
                    {quoteCategory === 'PME_2' && totalLives === 1 && !(isPME && isSoloMinor) && (
                      <div className="mt-6 bg-blue-50 p-5 rounded-xl border border-blue-200 animate-fadeIn">
                        <div className="flex items-start gap-3">
                           <div className="p-2 bg-blue-100 rounded-full text-blue-600 shrink-0">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                               <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                             </svg>
                           </div>
                           <div className="flex-1">
                             <h4 className="font-bold text-blue-900 text-base mb-1">Mínimo de 2 vidas</h4>
                             <p className="text-blue-800 text-sm mb-4">
                               Para a modalidade <strong>"2 a 29 vidas"</strong>, é necessário incluir ao menos 2 beneficiários. <br/>
                               Se você deseja cotar apenas para 1 pessoa, escolha uma das opções abaixo:
                             </p>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button 
                                  onClick={switchToPME1}
                                  className="bg-white hover:bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg shadow-sm transition-colors text-left group"
                                >
                                  <span className="text-xs font-bold text-blue-500 uppercase mb-1 block">Sou Titular CNPJ</span>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold">Mudar para CNPJ 1 Vida</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-400 group-hover:text-blue-600">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                    </svg>
                                  </div>
                                </button>

                                <button 
                                  onClick={switchToPF}
                                  className="bg-white hover:bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg shadow-sm transition-colors text-left group"
                                >
                                  <span className="text-xs font-bold text-blue-500 uppercase mb-1 block">Não tenho CNPJ</span>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold">Mudar para Pessoa Física</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-400 group-hover:text-blue-600">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                    </svg>
                                  </div>
                                </button>
                             </div>
                           </div>
                        </div>
                      </div>
                    )}

                 </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: RESULTS */}
        {step === 'results' && (
          <div className="animate-slideUp">
            {/* Breadcrumb / Back */}
            <div className="mb-6 flex items-center justify-between bg-blue-50 px-4 py-3 rounded-lg border border-blue-100">
               <div className="flex items-center">
                 <button onClick={goBack} className="mr-3 p-1 rounded-full hover:bg-blue-100 text-blue-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                 </button>
                 <span className="text-sm text-gray-500 mr-2">Resultados para:</span>
                 <span className="font-bold text-[#003366]">{getCategoryTitle()}</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">{totalLives} Vidas</span>
               </div>
            </div>

            {/* NOTIFICATIONS / RULES */}
            <div className="mb-6 space-y-3">
               {/* RULE 3: PF - NO FÊNIX FOR SOLO MINORS */}
               {quoteCategory === 'PF' && isSoloMinor && (
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r shadow-sm">
                   <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-500 mr-3 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <div>
                       <h3 className="font-bold text-orange-900 text-sm">Cotação para Menor de Idade (PF)</h3>
                       <p className="text-orange-800 text-sm mt-1">
                         Para contratação individual de crianças (0 a 18 anos) sem um responsável no plano, a operadora <strong>Fênix Medical não está disponível</strong>. Exibindo opções da Amhemed e GNDI.
                       </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Planos Disponíveis</h2>
              <p className="text-gray-600 mt-1">Encontramos {groupedPlans.length} opções para o perfil selecionado.</p>
              
              {quoteCategory === 'PME_30' && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                  <strong>Nota para grandes grupos:</strong> Os valores exibidos são baseados na tabela de 2 a 29 vidas para referência. Para empresas acima de 30 vidas, <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-yellow-900">converse conosco pelo WhatsApp (15) 99178-9707</a> ou solicite uma negociação personalizada para isenção de carência e descontos adicionais.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fadeIn">
              {groupedPlans.map((group, idx) => (
                <PlanCard 
                    key={`${group[0].plan.id}-${idx}`} 
                    variants={group} 
                    onComparePlans={handleComparePlans}
                />
              ))}
            </div>

            <PriceSummaryTable groups={groupedPlans} />
          </div>
        )}
      </main>
      
      {/* COMPARISON MODAL */}
      {comparisonModalPlans && (
          <ComparisonModal 
            plans={comparisonModalPlans} 
            onClose={() => setComparisonModalPlans(null)}
            onRemove={() => {}} // Remove functionality disabled/not used in fixed comparison
          />
      )}
    </div>
  );
};

export default App;
