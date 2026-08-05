import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth, useAuthStore } from '@cbl/auth';
import { useTheme } from '../context/ThemeContext';
import { Settings as SettingsIcon, User, Bell, Moon, Sun, MonitorSmartphone, Database } from 'lucide-react';
import { plantService, type Plant } from '../services/api/plantService';
import { DEPARTMENTS } from '../config/constants';

export const Settings = () => {
  const { user } = useAuth();
  const { hasRole } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [overdueAlerts, setOverdueAlerts] = useState(true);
  const [density, setDensity] = useState('comfortable');

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Dashboard Settings</h1>
        </div>

        {/* Account Info */}
        <section className="bg-card border border-border rounded-lg p-6 card-shadow">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" /> Account Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium text-foreground">{user?.name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">{user?.email || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Department Scope</p>
              <p className="font-medium text-foreground">{user?.department_id || 'All Departments (Admin)'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">System Roles</p>
              <div className="flex gap-2 mt-1">
                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md font-medium">
                  {user?.role || 'None'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Master Data Management (System Admin Only) */}
        {hasRole("System Administrator") && (
          <section className="bg-card border border-border rounded-lg p-6 card-shadow">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-muted-foreground" /> Master Data Management
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Manage system-wide lookup lists. Changes here will reflect across all modules.
            </p>
            <div className="space-y-4 border border-border rounded-md p-4">
              <h3 className="font-medium text-foreground">Departments</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {DEPARTMENTS.map(d => <li key={d}>{d}</li>)}
              </ul>
              <button 
                onClick={() => navigate('/master-management')}
                className="mt-2 bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              >
                + Add Department
              </button>
            </div>
          </section>
        )}

        {/* Display & Theme */}
        <section className="bg-card border border-border rounded-lg p-6 card-shadow">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <MonitorSmartphone className="h-5 w-5 text-muted-foreground" /> Display & Theme
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="font-medium text-foreground">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Switch between light and dark warm themes.</p>
              </div>
              <button 
                onClick={toggleTheme}
                className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-md transition-colors"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Table Density</p>
                <p className="text-sm text-muted-foreground">Adjust the spacing in data tables.</p>
              </div>
              <select 
                value={density}
                onChange={(e) => setDensity(e.target.value)}
                className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="spacious">Spacious</option>
              </select>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-card border border-border rounded-lg p-6 card-shadow">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" /> Notification Preferences
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-foreground">Weekly Digest Emails</p>
                <p className="text-sm text-muted-foreground">Receive a summary of KPI changes every Monday.</p>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors relative ${emailAlerts ? 'bg-success' : 'bg-muted-foreground'}`} onClick={() => setEmailAlerts(!emailAlerts)}>
                <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-transform ${emailAlerts ? 'left-6' : 'left-1'}`}></div>
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer pt-4 border-t border-border">
              <div>
                <p className="font-medium text-foreground">Overdue Hazard Alerts</p>
                <p className="text-sm text-muted-foreground">Immediate email notification when a high-priority hazard becomes overdue.</p>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors relative ${overdueAlerts ? 'bg-success' : 'bg-muted-foreground'}`} onClick={() => setOverdueAlerts(!overdueAlerts)}>
                <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-transform ${overdueAlerts ? 'left-6' : 'left-1'}`}></div>
              </div>
            </label>
          </div>
        </section>
        
      </div>
    </Layout>
  );
};
