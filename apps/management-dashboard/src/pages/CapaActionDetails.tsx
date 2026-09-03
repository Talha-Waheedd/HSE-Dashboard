import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ContextHeader } from '../components/ContextHeader';
import { capaService, capaSourceLabel, capaStatusLabel, type CapaAction } from '../services/api/capaService';

const display = (value: unknown) => value === null || value === undefined || value === '' ? '—' : String(value);
const formatDate = (value?: string | null, includeTime = false) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-GB', includeTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(date);
};
const sourceUrl = (action: CapaAction) => {
  if (action.sourceItemKey === 'legacy') return null;
  if (action.sourceType === 'incident') return `/leading-indicators/incident-investigation/${action.sourceId}`;
  if (action.sourceType === 'audit') return `/audit-management/${action.sourceId}`;
  if (action.sourceType === 'hazard') return '/hazard-reporting';
  if (action.sourceType === 'near_miss') return '/near-miss';
  return null;
};

const Detail = ({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) => <div className={`rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 ${wide ? 'sm:col-span-2' : ''}`}><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6B7280]">{label}</p><div className="mt-1.5 whitespace-pre-wrap text-sm font-normal leading-6 text-[#263238]">{children}</div></div>;

export const CapaActionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [action, setAction] = useState<CapaAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) { setError('CAPA Action ID is missing.'); setLoading(false); return; }
    setLoading(true); setError('');
    try { setAction(await capaService.get(id)); }
    catch (requestError: any) { setError(requestError?.response?.data?.message || 'Unable to load this CAPA Action.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);
  const linkedSource = action ? sourceUrl(action) : null;

  return <Layout>
    <ContextHeader
      title="CAPA Action Details"
      breadcrumbs={['Compliance', 'CAPA / Actions', 'Details']}
      subtitle="Traceable action summary linked to its originating HSE record"
      actions={[
        ...(linkedSource ? [{ label: 'View Source Record', icon: <ExternalLink />, onClick: () => navigate(linkedSource), variant: 'primary' as const }] : []),
        { label: 'Back to CAPA / Actions', icon: <ArrowLeft />, onClick: () => navigate('/action-tracker'), variant: 'outlined' as const },
      ]}
    />
    <main className="min-h-full bg-[#F7F7F5] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {loading && <div className="rounded-xl border border-[#E5E7EB] bg-white p-10 text-center text-sm text-[#6B7280]">Loading CAPA Action...</div>}
        {!loading && error && <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-5 text-sm text-[#991B1B]" role="alert">{error}</div>}
        {!loading && action && <section className="overflow-hidden rounded-xl border border-[#D9E1EC] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#FAFAFA] px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">Consolidated Action Register</p><h1 className="mt-1 text-xl font-bold text-[#2C1810]">{action.capaNumber}</h1></div><span className="rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-bold text-[#374151]">{capaStatusLabel(action.status)}</span></div>
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Detail label="CAPA ID">{action.capaNumber}</Detail>
            <Detail label="Status">{capaStatusLabel(action.status)}</Detail>
            <Detail label="Source Module">{capaSourceLabel(action.sourceType)}</Detail>
            <Detail label="Source Reference">{display(action.sourceReference)}</Detail>
            <Detail label="Incident Category">{display(action.incidentCategory)}</Detail>
            <Detail label="Risk / Priority">{action.priority ? action.priority.charAt(0).toUpperCase() + action.priority.slice(1) : '—'}</Detail>
            <Detail label="Action Item" wide>{display(action.description)}</Detail>
            <Detail label="Responsible Department">{display(action.responsibleDepartment?.code || action.responsibleDepartment?.name)}</Detail>
            <Detail label="Responsible Person / Responsibility">{display(action.responsibility)}</Detail>
            <Detail label="Target Date">{formatDate(action.dueDate)}</Detail>
            <Detail label="Created Date">{formatDate(action.createdAt, true)}</Detail>
            <Detail label="Source Record ID">{action.sourceId}</Detail>
            <Detail label="Source Item ID">{display(action.sourceItemId)}</Detail>
          </div>
          {action.sourceItemKey === 'legacy' && <div className="border-t border-[#E5E7EB] bg-[#FFFBEB] px-5 py-3 text-xs text-[#92400E]">This is a preserved legacy Action Tracker record. Its historical source UUID does not resolve to a current source form.</div>}
        </section>}
      </div>
    </main>
  </Layout>;
};

export default CapaActionDetails;
