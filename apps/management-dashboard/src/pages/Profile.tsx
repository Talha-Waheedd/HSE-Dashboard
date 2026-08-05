import { Layout } from '../components/Layout';
import { useAuth } from '@cbl/auth';
import { User, Mail, Shield, Building2, BadgeCheck } from 'lucide-react';

export const Profile = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="max-w-3xl mx-auto animate-fade-in-up mt-8">
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="h-32 bg-primary/10 border-b border-border relative">
            <div className="absolute -bottom-12 left-8 h-24 w-24 rounded-full border-4 border-card bg-secondary text-white flex items-center justify-center text-4xl font-bold">
              <User className="h-10 w-10" />
            </div>
          </div>
          
          <div className="pt-16 pb-8 px-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{user?.name || 'Unknown User'}</h1>
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  <BadgeCheck className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">Account Active</span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <h2 className="text-lg font-semibold border-b border-border pb-2">Profile Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/30">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Email Address</p>
                    <p className="font-medium text-foreground mt-1">{user?.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/30">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">System Role</p>
                    <p className="font-medium text-foreground mt-1">{user?.role || 'Guest'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/30">
                  <Building2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Department</p>
                    <p className="font-medium text-foreground mt-1">{user?.department_id || 'All Departments'}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};
