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
import { DataEntrySection } from './components/DataEntrySection';
import { ALL_SECTIONS } from './config/sectionSchemas';
import { FilterProvider } from './context/FilterContext';
import { ThemeProvider } from './context/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@cbl/ui';



const LoginPage = () => {
  const { login, isLoggingIn, isAuthenticated, error } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>

      <Card className="w-full max-w-md glass border-border bg-black text-white shadow-xl z-10">
        <CardHeader className="space-y-2 bg-black text-center pb-6 text-white">
          <div className="mx-auto mb-4 flex justify-center">
            <img src="/logo.svg" alt="Continental Biscuits Limited" className="h-20 w-auto drop-shadow-md" />
          </div>
          <CardTitle className="text-2xl text-white tracking-tight font-bold">HSE Management System</CardTitle>
        </CardHeader>
        <CardContent className="bg-black text-white">
          {error && (
            <div className="mb-4 p-3 bg-danger/10 text-danger text-sm rounded-md border border-danger/20 text-center">
              {error}
            </div>
          )}
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6 text-base shadow-md transition-all hover:shadow-lg"
            onClick={login}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? "Authenticating..." : "Sign in with Microsoft SSO"}
          </Button>
        </CardContent>
      </Card>
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
          <Route path="/leading-indicators/emergency-drills" element={<ProtectedRoute fallback={<Navigate to="/login" />}><LeadingIndicatorDetails kind="emergency-drills" /></ProtectedRoute>} />
          <Route path="/leading-indicators/action-plan-closure" element={<ProtectedRoute fallback={<Navigate to="/login" />}><LeadingIndicatorDetails kind="action-plan-closure" /></ProtectedRoute>} />
          <Route path="/lagging-indicators/fire" element={<ProtectedRoute fallback={<Navigate to="/login" />}><LaggingIndicatorDetails kind="fire" /></ProtectedRoute>} />
          <Route path="/lagging-indicators/ltir" element={<ProtectedRoute fallback={<Navigate to="/login" />}><LaggingIndicatorDetails kind="ltir" /></ProtectedRoute>} />
          <Route path="/lagging-indicators/trir" element={<ProtectedRoute fallback={<Navigate to="/login" />}><LaggingIndicatorDetails kind="trir" /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute fallback={<Navigate to="/login" />}><Settings /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute fallback={<Navigate to="/login" />}><Reports /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute fallback={<Navigate to="/login" />}><Profile /></ProtectedRoute>} />
          <Route path="/master-management" element={<ProtectedRoute fallback={<Navigate to="/login" />}><MasterManagement /></ProtectedRoute>} />
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
