import { moduleService } from '../services/api/moduleService';
import { ALL_SECTIONS } from '../config/sectionSchemas';
import { formatDateOnly, formatDateTimeLocal } from './dateFormat';

export const exportCSV = async (schemaId: string, filters: Record<string, any>, reportTitle?: string) => {
  try {
    // 1. In Phase 5, this call should eventually accept filters directly:
    // const res = await moduleService.getAll(schemaId, filters);
    // For now, fetch all and filter locally
    const res = await moduleService.getAll(schemaId);
    let data: any[] = res.data || [];

    // Local filtering (mimics what backend will do)
    if (filters.department && filters.department !== 'All') {
      data = data.filter(d => d.department_id === filters.department);
    }
    if (filters.status && filters.status !== 'All') {
      data = data.filter(d => d.status_id === filters.status);
    }
    if (filters.year && filters.year !== 'All') {
      data = data.filter(d => d.date?.startsWith(filters.year) || d.target_date?.startsWith(filters.year));
    }
    if (filters.fromDate) {
      data = data.filter(d => {
        const recordDate = d.date || d.target_date;
        return recordDate && recordDate >= filters.fromDate;
      });
    }
    if (filters.toDate) {
      data = data.filter(d => {
        const recordDate = d.date || d.target_date;
        return recordDate && recordDate <= filters.toDate;
      });
    }
    // Additional report-specific filters
    if (filters.riskRating && filters.riskRating !== 'All') {
      data = data.filter(d => d.risk_rating_id === filters.riskRating);
    }
    if (filters.incidentCategory && filters.incidentCategory !== 'All') {
      data = data.filter(d => d.incident_category_id === filters.incidentCategory);
    }

    if (data.length === 0) {
      alert("No records found for the selected filters.");
      return;
    }

    // 2. Map schema headers
    const schema = ALL_SECTIONS.find(s => s.id === schemaId);
    if (!schema) return;

    // Filter out columns that are meant to be purely invisible or strictly not exported (we export all by default)
    const headers = schema.columns.map(col => col.label);
    const csvRows = [];
    csvRows.push(headers.join(','));

    // 3. Construct CSV
    for (const entry of data) {
      const row = schema.columns.map(col => {
        let val = col.type === 'date'
          ? formatDateOnly(entry[col.key])
          : col.type === 'datetime'
            ? formatDateTimeLocal(entry[col.key])
          : (entry[col.key] || '');
        val = val.toString().replace(/"/g, '""');
        if (val.search(/("|,|\n)/g) >= 0) {
          val = `"${val}"`;
        }
        return val;
      });
      csvRows.push(row.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const fileName = reportTitle ? reportTitle.replace(/\s+/g, '_') : schema.title.replace(/\s+/g, '_');
    link.setAttribute("download", `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Failed to export CSV", err);
    alert("An error occurred while generating the CSV.");
  }
};
