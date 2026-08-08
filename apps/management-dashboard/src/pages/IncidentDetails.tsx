import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, FileText, ShieldAlert } from 'lucide-react';
import { Layout } from '../components/Layout';
import { ContextHeader } from '../components/ContextHeader';
import { StatusBadge } from '../components/StatusBadge';
import { apiClient } from '@cbl/api';

const valueOrDash = (value: unknown) => value === undefined || value === null || value === '' ? '—' : String(value);

const DetailItem = ({ label, value }: { label: string; value: unknown }) => (
  <div className="rounded-lg border border-[#F0F0F0] bg-[#FBFBFA] px-3.5 py-3">
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF]">{label}</p>
    <p className="mt-1.5 break-words text-[13px] font-semibold text-[#374151]">{valueOrDash(value)}</p>
  </div>
);

export const IncidentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadIncident = async () => {
      if (!id) {
        setError('Incident ID is missing.');
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get(`/incidents/${id}`);
        if (!cancelled) setIncident(response.data?.data ?? response.data);
      } catch (requestError: any) {
        if (!cancelled) setError(requestError.response?.data?.message || 'Unable to load this incident.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadIncident();
    return () => { cancelled = true; };
  }, [id]);

  const metadata = incident?.metadata || {};
  const field = (key: string, fallback?: unknown) => incident?.[key] ?? metadata[key] ?? fallback;

  return (
    <Layout>
      <ContextHeader
        title="Incident Details"
        breadcrumbs={['Incident Log', 'Details']}
        subtitle="Review the complete record for the selected incident."
        actions={[{
          label: 'Back to Incident Log',
          icon: <ArrowLeft />,
          onClick: () => navigate('/incident-log'),
          variant: 'outlined',
        }]}
      />

      <main className="min-h-full bg-[#F7F7F5] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-5">
          {loading && <div className="rounded-xl border border-[#E8E0D2] bg-white p-8 text-center text-[13px] text-[#8A8F98]">Loading incident details...</div>}

          {!loading && error && (
            <div className="rounded-xl border border-[#FECACA] bg-[#FFF7F7] p-5 text-[13px] text-[#991B1B]">{error}</div>
          )}

          {!loading && !error && incident && (
            <>
              <section className="overflow-hidden rounded-xl border border-[#E8E0D2] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <div className="flex flex-col gap-4 border-b border-[#F0F0F0] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">Incident record</p>
                    <h1 className="mt-1.5 break-all text-xl font-bold tracking-tight text-[#2C1810]">{valueOrDash(field('incidentNumber', id))}</h1>
                    <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#4B5563]">{valueOrDash(field('description'))}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <StatusBadge status={valueOrDash(field('severityLevel', field('risk_rating_id', 'Unknown')))} size="md" />
                    <StatusBadge status={valueOrDash(field('status', field('status_id', 'Unknown')))} size="md" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
                  <DetailItem label="Incident category" value={field('incidentType', field('incident_category_id'))} />
                  <DetailItem label="Incident date" value={field('incidentDate', field('date'))} />
                  <DetailItem label="Incident time" value={field('incidentTime', field('time'))} />
                  <DetailItem label="Location" value={field('location')} />
                </div>
              </section>

              <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
                <section className="rounded-xl border border-[#E8E0D2] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] sm:p-6">
                  <div className="flex items-center gap-2 border-b border-[#F0F0F0] pb-4">
                    <FileText className="h-4 w-4 text-[#CB0017]" />
                    <h2 className="text-[15px] font-bold text-[#2C1810]">Incident information</h2>
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <DetailItem label="Employee ID" value={field('emp_id')} />
                    <DetailItem label="Shift" value={field('shift')} />
                    <DetailItem label="Department" value={field('departmentId', field('department_id'))} />
                    <DetailItem label="Area manager" value={field('area_manager')} />
                    <DetailItem label="Gender" value={field('gender')} />
                    <DetailItem label="Reported by" value={field('reportedBy', field('reported_by'))} />
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <DetailItem label="Immediate action" value={field('immediateAction', field('immediate_cause'))} />
                    <DetailItem label="Root cause" value={field('rootCause', field('root_cause'))} />
                    <DetailItem label="Action items" value={field('action_items')} />
                    <DetailItem label="Corrective actions" value={field('corrective_actions')} />
                  </div>
                </section>

                <section className="rounded-xl border border-[#E8E0D2] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] sm:p-6">
                  <div className="flex items-center gap-2 border-b border-[#F0F0F0] pb-4">
                    <ShieldAlert className="h-4 w-4 text-[#CB0017]" />
                    <h2 className="text-[15px] font-bold text-[#2C1810]">Investigation & ownership</h2>
                  </div>
                  <div className="mt-5 space-y-3">
                    <DetailItem label="Responsible person" value={field('responsible_person')} />
                    <DetailItem label="Investigated by" value={field('investigatedBy', field('investigated_by'))} />
                    <DetailItem label="Investigation findings" value={field('investigationFindings', field('investigation_findings'))} />
                    <DetailItem label="Created at" value={field('createdAt', field('created_at'))} />
                  </div>
                </section>
              </div>

              <section className="rounded-xl border border-[#E8E0D2] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] sm:p-6">
                <div className="flex items-center gap-2 border-b border-[#F0F0F0] pb-4">
                  <CalendarDays className="h-4 w-4 text-[#CB0017]" />
                  <h2 className="text-[15px] font-bold text-[#2C1810]">Additional record fields</h2>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailItem label="Incident number" value={field('incidentNumber', field('incident_number'))} />
                  <DetailItem label="Plant" value={field('plantId', field('plant_id'))} />
                  <DetailItem label="Lost days" value={field('lostDays', field('lost_days'))} />
                  <DetailItem label="Restricted days" value={field('restrictedDays', field('restricted_days'))} />
                  <DetailItem label="First aid given" value={field('firstAidGiven', field('first_aid_given'))} />
                  <DetailItem label="Evidence" value={field('evidence_upload')} />
                  <DetailItem label="Preventive actions" value={field('preventive_actions')} />
                  <DetailItem label="Timeline" value={field('timeline')} />
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default IncidentDetails;
