import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, useAuth } from '@cbl/auth';
import { Dashboard } from './pages/Dashboard';

import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Reports } from './pages/Reports';
import { Profile } from './pages/Profile';
import { MasterManagement } from './pages/MasterManagement';
import { LeadingLaggingIndicators } from './pages/LeadingLaggingIndicators';
import { LeadingIndicatorDetails } from './pages/LeadingIndicatorDetails';
import { LaggingIndicatorDetails } from './pages/LaggingIndicatorDetails';
import { IncidentDetails } from './pages/IncidentDetails';
import { IncidentInvestigationDetails } from './pages/IncidentInvestigationDetails';
import { MasterAnalysisDashboard } from './pages/MasterAnalysis/MasterAnalysisDashboard';
import { MasterAnalysisDetail } from './pages/MasterAnalysis/MasterAnalysisDetail';
import { DataEntrySection } from './components/DataEntrySection';
import { ALL_SECTIONS } from './config/sectionSchemas';
import { FilterProvider } from './context/FilterContext';
import { ThemeProvider } from './context/ThemeContext';
import { Button } from '@cbl/ui';

const LoginPage = () => {
  const { login, isLoggingIn, isAuthenticated, error } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative flex h-screen min-h-[620px] w-full flex-col overflow-hidden bg-[#FAFAF9] text-[#17191D] lg:flex-row">
      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#FFFDF8] lg:h-auto lg:w-[52%] lg:flex-none">
        <div className="relative z-10 flex items-center gap-4 px-7 pt-8 sm:px-12 sm:pt-10 lg:px-16">
          <img src="/image.png" alt="Continental Biscuits Limited" className="h-20 w-20 object-contain sm:h-24 sm:w-24" />
          <span className="max-w-[180px] text-[21px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[25px]">Continental<br />Biscuits<br />Ltd.</span>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[650px] flex-1 flex-col justify-center px-8 pb-36 pt-8 sm:px-16 lg:px-24 lg:pb-40">
          <p className="text-[36px] font-semibold leading-[1.08] tracking-[-0.045em] sm:text-[52px]">Safer operations.</p>
          <p className="mt-1 text-[36px] font-bold leading-[1.08] tracking-[-0.045em] text-[#C51626] sm:text-[52px]">Better visibility.</p>
          <p className="mt-6 max-w-[470px] text-[16px] leading-7 text-[#5C6068] sm:text-[18px]">Report hazards, monitor incidents, and track HSE performance in one secure workspace.</p>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] overflow-hidden">
          <div className="absolute -bottom-[45%] -left-[14%] h-[95%] w-[125%] rotate-[8deg] rounded-[50%] bg-[#D9001B] shadow-[0_-3px_0_#F0B323]" />
          <div className="absolute -bottom-[52%] -left-[12%] h-[89%] w-[120%] rotate-[8deg] rounded-[50%] border-t-2 border-[#F02B37]" />
          <div className="absolute bottom-[25%] left-[4%] h-32 w-32 rounded-full border border-[#F0B323]/60 sm:left-[8%]" />
          <div className="absolute bottom-[35%] left-[19%] flex h-16 w-16 items-center justify-center rounded-full border border-[#F0B323] bg-[#FFFDF8] text-3xl text-[#D9001B] shadow-sm">⌁</div>
          <div className="absolute bottom-[10%] left-[34%] flex h-16 w-16 items-center justify-center rounded-full border border-[#F0B323] bg-[#FFFDF8] text-3xl text-[#D79A13] shadow-sm">⌁</div>
          <div className="absolute bottom-[45%] left-[5%] h-24 w-px rotate-[-25deg] bg-[#F0B323]/70" />
          <div className="absolute bottom-[17%] left-[22%] h-20 w-px rotate-[-32deg] bg-[#F0B323]/70" />
        </div>
      </main>

      <section className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center bg-[#FAFAFA] px-5 py-5 pb-16 sm:px-10 sm:py-8 lg:h-auto lg:w-[48%] lg:flex-none lg:px-16">
        <div className="w-full max-w-[600px] rounded-2xl border border-[#D9D9D9] bg-white px-7 py-9 shadow-[0_16px_45px_rgba(0,0,0,.10)] sm:px-12 sm:py-11">
          <div className="flex justify-center">
            <img src="/image.png" alt="Continental Biscuits Limited" className="h-16 w-16 object-contain" />
          </div>
          <div className="mt-2 text-center text-[17px] font-semibold leading-[1.05] tracking-[-0.04em]">Continental<br />Biscuits<br />Ltd.</div>
          <h1 className="mt-8 text-center text-[30px] font-semibold tracking-[-0.04em] sm:text-[38px]">Welcome to HSE</h1>
          <p className="mt-3 text-center text-[15px] text-[#555A62] sm:text-[17px]">Health, Safety &amp; Environment Management System</p>
          <div className="my-8 flex items-center gap-4 text-[#E6A914]"><span className="h-px flex-1 bg-[#E5E5E5]" /><span className="text-2xl">♢</span><span className="h-px flex-1 bg-[#E5E5E5]" /></div>
          {error && <div role="alert" className="mb-5 rounded-lg border border-[#F2B8BE] bg-[#FFF3F4] px-4 py-3 text-center text-sm text-[#A40E1E]">{error}</div>}
          <p className="text-center text-[15px] text-[#555A62]">Sign in securely with your organizational account.</p>
          <Button onClick={login} disabled={isLoggingIn} aria-busy={isLoggingIn} className="mt-8 flex h-16 w-full items-center justify-center gap-4 rounded-md bg-[#D9001B] text-[18px] font-semibold text-white shadow-[0_5px_12px_rgba(217,0,27,.20)] transition hover:bg-[#B90017] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D9001B]/25 disabled:cursor-not-allowed disabled:opacity-70">
            {isLoggingIn ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> : <span className="grid grid-cols-2 gap-0.5" aria-hidden="true"><i className="h-3 w-3 bg-[#F25022]" /><i className="h-3 w-3 bg-[#7FBA00]" /><i className="h-3 w-3 bg-[#00A4EF]" /><i className="h-3 w-3 bg-[#FFB900]" /></span>}
            {isLoggingIn ? 'Authenticating…' : 'Sign in with Microsoft'}
          </Button>
          <p className="mt-7 flex items-center justify-center gap-2 text-[14px] text-[#686D75]"><span aria-hidden="true">▣</span> Authorized personnel only</p>
        </div>
      </section>

      <footer className="absolute inset-x-0 bottom-0 z-20 flex h-14 items-center justify-center border-t border-[#E5E5E5] bg-white/95 px-4 text-center text-[12px] text-[#666B73] backdrop-blur sm:text-[14px]">© 2026 Continental Biscuits Ltd. <span className="mx-4 text-[#D9001B]">•</span> Privacy <span className="mx-4 text-[#D9001B]">•</span> IT Support</footer>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <FilterProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Management Dashboard Route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute fallback={<Navigate to="/login" />}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* New Sidebar Routes */}
          <Route path="/analytics" element={<ProtectedRoute fallback={<Navigate to="/login" />}><Analytics /></ProtectedRoute>} />
          <Route path="/leading-lagging-indicators" element={<ProtectedRoute fallback={<Navigate to="/login" />}><LeadingLaggingIndicators /></ProtectedRoute>} />
          <Route path="/leading-indicators/hazard-closing" element={<ProtectedRoute fallback={<Navigate to="/login" />}><LeadingIndicatorDetails kind="hazard-closing" /></ProtectedRoute>} />
          <Route path="/leading-indicators/incident-investigation" element={<ProtectedRoute fallback={<Navigate to="/login" />}><LeadingIndicatorDetails kind="incident-investigation" /></ProtectedRoute>} />
          <Route path="/leading-indicators/incident-investigation/:id" element={<ProtectedRoute fallback={<Navigate to="/login" />}><IncidentInvestigationDetails /></ProtectedRoute>} />
          <Route path="/leading-indicators/emergency-drills" element={<ProtectedRoute fallback={<Navigate to="/login" />}><LeadingIndicatorDetails kind="emergency-drills" /></ProtectedRoute>} />
          <Route path="/leading-indicators/action-plan-closure" element={<ProtectedRoute fallback={<Navigate to="/login" />}><LeadingIndicatorDetails kind="action-plan-closure" /></ProtectedRoute>} />
          <Route path="/leading-indicators/legal-compliance" element={<ProtectedRoute fallback={<Navigate to="/login" />}><Analytics focus="legal-compliance" /></ProtectedRoute>} />
          <Route path="/lagging-indicators/fire" element={<ProtectedRoute fallback={<Navigate to="/login" />}><LaggingIndicatorDetails kind="fire" /></ProtectedRoute>} />
          <Route path="/lagging-indicators/ltir" element={<ProtectedRoute fallback={<Navigate to="/login" />}><LaggingIndicatorDetails kind="ltir" /></ProtectedRoute>} />
          <Route path="/lagging-indicators/trir" element={<ProtectedRoute fallback={<Navigate to="/login" />}><LaggingIndicatorDetails kind="trir" /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute fallback={<Navigate to="/login" />}><Settings /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute fallback={<Navigate to="/login" />}><Reports /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute fallback={<Navigate to="/login" />}><Profile /></ProtectedRoute>} />
          <Route path="/master-management" element={<ProtectedRoute fallback={<Navigate to="/login" />}><MasterManagement /></ProtectedRoute>} />
          <Route path="/master-analysis" element={<ProtectedRoute fallback={<Navigate to="/login" />}><MasterAnalysisDashboard /></ProtectedRoute>} />
          <Route path="/master-analysis/:id" element={<ProtectedRoute fallback={<Navigate to="/login" />}><MasterAnalysisDetail /></ProtectedRoute>} />
          <Route path="/incident-log/:id" element={<ProtectedRoute fallback={<Navigate to="/login" />}><IncidentDetails /></ProtectedRoute>} />

          {/* Dynamic Data Entry Sections */}
          {ALL_SECTIONS.map(section => (
            <Route 
              key={section.id} 
              path={section.path} 
              element={
                <ProtectedRoute fallback={<Navigate to="/login" />}>
                  <DataEntrySection schema={section} />
                </ProtectedRoute>
              } 
            />
          ))}

        {/* Default route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </FilterProvider>
    </ThemeProvider>
  );
}

export default App;
