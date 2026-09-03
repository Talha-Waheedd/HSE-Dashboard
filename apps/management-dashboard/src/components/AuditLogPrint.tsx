import { createPortal } from 'react-dom';
import type { AuditItem, AuditLog } from '../services/api/auditService';
import './audit-log-print.css';

type Props = {
  audit: AuditLog;
  items: AuditItem[];
  auditors: string;
  personsInterviewed: string;
  departmentNames: Record<string, string>;
};

const display = (value: unknown) => value === null || value === undefined ? '' : String(value);
const formatDate = (value: unknown) => {
  const match = display(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : display(value);
};

const ValueCell = ({ children, colSpan }: { children?: unknown; colSpan?: number }) => <td className="audit-print-value" colSpan={colSpan}>{display(children)}</td>;

export const AuditLogPrint = ({ audit, items, auditors, personsInterviewed, departmentNames }: Props) => {
  const printableItems = items.filter(item => item.description || item.standardReference || item.standardLimitRequirement || item.recommendation || item.score);
  const scores = printableItems.map(item => Number(item.score)).filter(score => Number.isInteger(score) && score >= 1 && score <= 4);
  const pointsScored = scores.reduce((sum, score) => sum + score, 0);
  const pointsAvailable = scores.length * 4;
  const compliance = pointsAvailable ? ((pointsScored / pointsAvailable) * 100).toFixed(2) : '0.00';
  const rows: Array<AuditItem | null> = [...printableItems];
  while (rows.length < 10) rows.push(null);

  return createPortal(
    <article className="audit-log-print-root" aria-hidden="true">
      <header className="audit-print-title">Audit Format</header>
      <section className="audit-print-top-grid">
        <table className="audit-print-table audit-print-criteria">
          <tbody>
            <tr><th colSpan={2}>Scoring Criteria:</th></tr>
            <tr><td className="audit-print-score-number">1</td><ValueCell>Complete Non Conformance: Immediately / Significant Actions Required</ValueCell></tr>
            <tr><td className="audit-print-score-number">2</td><ValueCell>Major Non Conformance: Significant Corrective Actions Required</ValueCell></tr>
            <tr><td className="audit-print-score-number">3</td><ValueCell>Minor Non Conformance: Some Corrective Actions Required</ValueCell></tr>
            <tr><td className="audit-print-score-number">4</td><ValueCell>Full Conformance: Complies with all requirements</ValueCell></tr>
          </tbody>
        </table>
        <table className="audit-print-table audit-print-info">
          <tbody>
            <tr><th>Audit Conducted by:</th><ValueCell>{auditors}</ValueCell></tr>
            <tr><th>Persons Interviewed:</th><ValueCell>{personsInterviewed}</ValueCell></tr>
            <tr><th>Date of Audit:</th><ValueCell>{formatDate(audit.scheduledDate)}</ValueCell></tr>
          </tbody>
        </table>
      </section>

      <table className="audit-print-table audit-print-items">
        <colgroup>
          <col className="audit-print-sr" /><col className="audit-print-reference" /><col className="audit-print-point" />
          <col className="audit-print-limit" /><col className="audit-print-score" /><col className="audit-print-actions" />
          <col className="audit-print-target" /><col className="audit-print-responsibility" /><col className="audit-print-department" /><col className="audit-print-closure" />
        </colgroup>
        <thead><tr><th>Sr. #</th><th>Standard Reference</th><th>Audit Point</th><th>Standard Limit/Requirement</th><th>Scoring (1-4)</th><th>Actions / Recommendations</th><th>Target Date for Completion</th><th>Responsibility</th><th>Responsible Department</th><th>Closure Status (Open/Closed)</th></tr></thead>
        <tbody>
          {rows.map((item, index) => <tr key={item?.id || index}>
            <ValueCell>{index + 1}</ValueCell>
            <ValueCell>{item?.standardReference}</ValueCell>
            <ValueCell>{item?.description}</ValueCell>
            <ValueCell>{item?.standardLimitRequirement}</ValueCell>
            <ValueCell>{item?.score}</ValueCell>
            <ValueCell>{item?.recommendation}</ValueCell>
            <ValueCell>{formatDate(item?.targetDate)}</ValueCell>
            <ValueCell>{item?.responsibility}</ValueCell>
            <ValueCell>{item ? departmentNames[item.responsibleDepartmentId] || item.responsibleDepartment?.code || item.responsibleDepartment?.name : ''}</ValueCell>
            <ValueCell>{item ? (item.status === 'closed' ? 'Closed' : 'Open') : ''}</ValueCell>
          </tr>)}
        </tbody>
      </table>

      <table className="audit-print-table audit-print-summary">
        <tbody>
          <tr><th>Points Scored:</th><ValueCell>{pointsScored}</ValueCell></tr>
          <tr><th>Points Available:</th><ValueCell>{pointsAvailable}</ValueCell></tr>
          <tr><th>Overall % Compliance:</th><ValueCell>{compliance}%</ValueCell></tr>
        </tbody>
      </table>
      <footer className="audit-print-source"><strong>Audit Log:</strong> <span>{audit.auditNumber || audit.id}</span> · <strong>Area:</strong> <span>{audit.title}</span> · <strong>Objective:</strong> <span>{audit.auditObjective || ''}</span></footer>
    </article>,
    document.body,
  );
};
