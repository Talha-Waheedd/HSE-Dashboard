import { createPortal } from 'react-dom';
import './report-print.css';

type Column = { key: string; label: string };

interface ReportPrintProps {
  title: string;
  columns: Column[];
  rows: Record<string, any>[];
  generatedAt: string;
  filterSummary: string[];
}

const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return String(record.code || record.name || record.label || '—');
  }
  return String(value);
};

export const ReportPrint = ({ title, columns, rows, generatedAt, filterSummary }: ReportPrintProps) => createPortal(
  <article className="report-print-root" aria-hidden="true">
    <header className="report-print-header">
      <p>CONTINENTAL BISCUITS LIMITED</p>
      <h1>{title}</h1>
      <p>HSE Management System · LU Sukkur Plant</p>
      <div className="report-print-meta">
        <span>Generated: {generatedAt}</span>
        <span>{rows.length} preview records</span>
      </div>
      {filterSummary.length > 0 && <p className="report-print-filters">Filters: {filterSummary.join(' · ')}</p>}
    </header>
    <table className="report-print-table">
      <thead><tr><th className="report-print-index">#</th>{columns.map(column => <th key={column.key}>{column.label}</th>)}</tr></thead>
      <tbody>
        {rows.length > 0 ? rows.map((row, index) => (
          <tr key={row.id || index}>
            <td className="report-print-index report-print-value">{index + 1}</td>
            {columns.map(column => <td key={column.key} className="report-print-value">{displayValue(row[column.key])}</td>)}
          </tr>
        )) : <tr><td colSpan={columns.length + 1} className="report-print-empty">No records match the selected filters.</td></tr>}
      </tbody>
    </table>
  </article>,
  document.body,
);

export default ReportPrint;
