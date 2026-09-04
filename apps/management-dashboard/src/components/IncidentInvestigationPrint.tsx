import './incident-investigation-print.css';
import { createPortal } from 'react-dom';
import { ClcChartPrint } from './ClcChartPrint';
import type { ClcAnalysis } from '../config/clcChart';

type RecordData = Record<string, any>;

interface IncidentInvestigationPrintProps {
  incident: RecordData;
  form: Record<string, string>;
  pictureUrls: string[];
  clcAnalysis: ClcAnalysis;
}

const text = (value: unknown) => value === undefined || value === null ? '' : String(value);

const formatDate = (value: unknown) => {
  const raw = text(value).slice(0, 10);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : raw;
};

const formatTime = (value: unknown) => text(value).slice(0, 5);
const normalized = (value: unknown) => text(value).trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const Check = ({ selected }: { selected: boolean }) => (
  <span className={`incident-print-checkbox${selected ? ' is-selected' : ''}`} aria-hidden="true">{selected ? '✓' : ''}</span>
);

const Value = ({ children }: { children?: unknown }) => <td className="incident-print-value">{text(children)}</td>;

export const IncidentInvestigationPrint = ({ incident, form, pictureUrls, clcAnalysis }: IncidentInvestigationPrintProps) => {
  const metadata = incident.metadata || {};
  const inherited = {
    title: incident.title || metadata.title_of_accident,
    date: formatDate(incident.incidentDate || metadata.date_of_accident),
    time: formatTime(incident.incidentTime || metadata.time),
    place: incident.location || metadata.place_of_accident,
    sufferer: incident.injuredPersonName || metadata.name_of_sufferer,
    designation: metadata.designation || metadata.affected_designation,
    department: incident.department?.code || incident.department?.name || metadata.department,
    details: incident.description || metadata.accident_details,
  };

  const classifications = ['Fatality', 'LTI', 'RWC', 'MTC', 'FA', 'Property Damage', 'Significant Nearmiss', 'Fire Incident'];
  const classification = normalized(form.injury_classification || metadata.injury_classification);
  const probability = normalized(form.probability_of_occurrence || metadata.probability_of_occurrence);

  const sourceActions = Array.isArray(metadata.actions) ? metadata.actions : [];
  const actions: Array<{ action: string; responsibility: string; timeline: string }> = sourceActions.map((item: RecordData) => ({
    action: text(item.action || item.preventive_action || item.safety_measure || item.description),
    responsibility: text(item.responsibility || item.resp || item.responsible_department || item.responsible_person),
    timeline: text(item.timeline || item.deadline || item.target_date),
  }));
  if (actions.length === 0 && (form.preventive_action_safety_measures || metadata.preventive_action_safety_measures)) {
    actions.push({
      action: text(form.preventive_action_safety_measures || metadata.preventive_action_safety_measures),
      responsibility: text(form.responsibility || metadata.responsibility || metadata.preventive_responsibility || metadata.responsible_department),
      timeline: text(form.timeline || metadata.timeline || metadata.preventive_timeline),
    });
  }
  while (actions.length < 5) actions.push({ action: '', responsibility: '', timeline: '' });

  const rawTeam = metadata.investigation_team_members;
  const team = Array.isArray(rawTeam)
    ? rawTeam.slice(0, 3).map((member: RecordData | string) => typeof member === 'string'
      ? { name: member, sign: '' }
      : { name: member.name || member.member || '', sign: member.sign || member.signature || '' })
    : text(form.investigation_team || metadata.investigation_team)
      .split(/[\n,;]+/)
      .map(name => name.trim())
      .filter(Boolean)
      .slice(0, 3)
      .map(name => ({ name, sign: '' }));
  while (team.length < 3) team.push({ name: '', sign: '' });

  const topRows = [
    { left: 'Title of Accident', leftValue: inherited.title, rightLabel: '', rightValue: '', classification: null },
    { left: 'Date of Accident', leftValue: inherited.date, rightLabel: 'Time', rightValue: inherited.time, classification: classifications[0] },
    { left: 'Shift Manager / Incharge', leftValue: form.shift_manager_incharge, rightLabel: 'Shift', rightValue: form.shift, classification: classifications[1] },
    { left: 'Place of Accident', leftValue: inherited.place, rightLabel: '', rightValue: '', classification: classifications[2] },
    { left: 'Name of Sufferer(s)', leftValue: inherited.sufferer, rightLabel: 'Designation', rightValue: inherited.designation, classification: classifications[3] },
    { left: 'Department', leftValue: inherited.department, rightLabel: 'Area / Section', rightValue: form.area_section, classification: classifications[4] },
    { left: 'Area Incharge', leftValue: form.area_incharge, rightLabel: 'Operator', rightValue: form.operator, classification: classifications[5] },
    { left: 'Production Officer', leftValue: form.production_officer, rightLabel: 'Supervisor', rightValue: form.supervisor, classification: classifications[6] },
    { left: 'Witnesses', leftValue: form.witnesses, rightLabel: '', rightValue: '', classification: classifications[7] },
  ];

  return createPortal(
    <article className="incident-print-root" aria-hidden="true">
      <section className="incident-print-page">
        <header className="incident-print-header">
          <div className="incident-print-heading">
            <div>CONTINENTAL BISCUITS LIMITED</div>
            <h1>ACCIDENT INVESTIGATION REPORT</h1>
          </div>
          <div className="incident-print-reference">IMS/04/AIR001<br />Issue Date: 12/03/2019<br />Revision:01</div>
        </header>

        <table className="incident-print-table incident-print-top">
          <colgroup><col className="label-col" /><col className="wide-value-col" /><col className="short-label-col" /><col className="short-value-col" /><col className="classification-col" /></colgroup>
          <tbody>
            {topRows.map((row, index) => (
              <tr key={row.left}>
                <th>{row.left}</th>
                {row.rightLabel
                  ? <><Value>{row.leftValue}</Value><th>{row.rightLabel}</th><Value>{row.rightValue}</Value></>
                  : <td colSpan={3} className="incident-print-value">{text(row.leftValue)}</td>}
                {index === 0
                  ? <th className="incident-print-center">Injury Classification</th>
                  : <td className="incident-print-option"><Check selected={classification === normalized(row.classification)} />{row.classification}</td>}
              </tr>
            ))}
            <tr>
              <th>Probability of Occurrence</th>
              <td colSpan={4} className="incident-print-probability">
                {['Frequent', 'Occasional', 'Seldom'].map(option => <span key={option}><Check selected={probability === normalized(option)} />{option}</span>)}
              </td>
            </tr>
          </tbody>
        </table>

        <section className="incident-print-box incident-print-large">
          <div className="incident-print-section-title"><strong>ACCIDENT DETAILS</strong><span>Describe How the Event Occurred (Photo or Sketch as required). Use additional sheet if needed</span></div>
          <div className="incident-print-section-value">{text(inherited.details)}</div>
        </section>
        <section className="incident-print-box incident-print-large">
          <div className="incident-print-section-title"><strong>MAIN CAUSES OF ACCIDENTS</strong><span>Describe the Unsafe Condition and (or) Act that led to the incident</span></div>
          <div className="incident-print-section-value">{text(form.main_causes || metadata.main_causes)}</div>
        </section>
        <section className="incident-print-box incident-print-medium">
          <div className="incident-print-section-title"><strong>IMMEDIATE ACTION TAKEN</strong><span>Describe the immediate Actions taken to rectify or minimize the loss</span></div>
          <div className="incident-print-section-value">{text(form.immediate_action_taken || incident.immediateAction || metadata.immediate_action_taken)}</div>
        </section>

        <table className="incident-print-table incident-print-actions">
          <colgroup><col /><col className="responsibility-col" /><col className="timeline-col" /></colgroup>
          <thead><tr><th>PREVENTIVE ACTION / SAFETY MEASURES</th><th>Resp</th><th>TimeLine</th></tr></thead>
          <tbody>{actions.map((action, index) => <tr key={index}><Value>{action.action}</Value><Value>{action.responsibility}</Value><Value>{formatDate(action.timeline) || action.timeline}</Value></tr>)}</tbody>
        </table>
      </section>

      <section className="incident-print-page incident-print-page-two">
        <div className="incident-print-continued">ACCIDENT INVESTIGATION REPORT — CONTINUED</div>
        <section className="incident-print-box incident-print-pictures">
          <div className="incident-print-section-title"><strong>Safety Incident Pictures</strong><span>Show the pictures of the event, area and loss</span></div>
          <div className="incident-print-picture-grid">
            {pictureUrls.slice(0, 4).map((url, index) => <img key={url} src={url} alt={`Safety incident evidence ${index + 1}`} />)}
          </div>
        </section>

        <div className="incident-print-safety-officer">To be filled by Safety officer</div>
        <table className="incident-print-table incident-print-verification">
          <colgroup><col className="team-label-col" /><col className="team-name-col" /><col className="team-sign-col" /><col className="capa-label-col" /><col className="capa-value-col" /><col className="approval-col" /></colgroup>
          <tbody>
            <tr><th>Accident Investigation Done by</th><th colSpan={2}>(Signs)</th><th colSpan={2}>CAPA Verification</th><th>Verified by ICM</th></tr>
            <tr><th>Name 1</th><Value>{team[0].name}</Value><Value>{team[0].sign}</Value><th>Responsibility</th><Value>{metadata.capa_responsibility || ''}</Value><Value>{form.verified_by_icm || metadata.verified_by_icm}</Value></tr>
            <tr><th>Name 2</th><Value>{team[1].name}</Value><Value>{team[1].sign}</Value><th>Target date</th><Value>{formatDate(form.target_date || metadata.target_date || metadata.capa_target_date)}</Value><th>Closed by FM :-</th></tr>
            <tr><th>Name 3</th><Value>{team[2].name}</Value><Value>{team[2].sign}</Value><th>Completion status</th><Value>{form.completion_status || metadata.completion_status || metadata.capa_completion_status}</Value><Value>{form.closed_by_fm || metadata.closed_by_fm}</Value></tr>
            <tr><th>Reviewed By FM :-</th><td colSpan={2} className="incident-print-value">{text(form.reviewed_by_fm || metadata.reviewed_by_fm)}</td><th>Completion Date</th><Value>{formatDate(form.completion_date || metadata.completion_date || metadata.capa_completion_date)}</Value><td /></tr>
            <tr><th>CAPA Verification</th><td colSpan={5} className="incident-print-value">{text(form.capa_verification || metadata.capa_verification)}</td></tr>
          </tbody>
        </table>
      </section>
      <ClcChartPrint analysis={clcAnalysis} />
    </article>,
    document.body,
  );
};

export default IncidentInvestigationPrint;
