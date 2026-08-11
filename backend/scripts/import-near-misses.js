'use strict';

/* Transaction-safe importer for Near Miss Records.xlsx. */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const INPUT = process.argv[2] || 'C:/Users/PMLS/Downloads/Near Miss Records.xlsx';
const PLANT_ID = '5126923e-b77f-4eb6-8b98-d5fc9db8d71b';
const USER_ID = 'c7ec4de8-f2cd-457f-a6df-ae4530fe6b0c';
const DEPARTMENT_IDS = {
  PRD: '2b8a3db9-a0b1-4244-a0b1-927f45285ec2',
  PRODUCTION: '2b8a3db9-a0b1-4244-a0b1-927f45285ec2',
  HSE: '36d4db48-05df-4cec-8781-5ff52873718b',
  'HSE DEPARTMENT': '36d4db48-05df-4cec-8781-5ff52873718b',
};

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const xmlDecode = (value) => String(value || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

function readZipEntries(filePath) {
  const buffer = fs.readFileSync(filePath); let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) if (buffer.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('Invalid XLSX archive.');
  const count = buffer.readUInt16LE(eocd + 10); const directoryOffset = buffer.readUInt32LE(eocd + 16); const entries = new Map(); let cursor = directoryOffset;
  for (let i = 0; i < count; i++) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) throw new Error('Invalid XLSX central directory.');
    const method=buffer.readUInt16LE(cursor+10), compressedSize=buffer.readUInt32LE(cursor+20), nameLength=buffer.readUInt16LE(cursor+28), extraLength=buffer.readUInt16LE(cursor+30), commentLength=buffer.readUInt16LE(cursor+32), localOffset=buffer.readUInt32LE(cursor+42);
    const name=buffer.toString('utf8',cursor+46,cursor+46+nameLength); const localNameLength=buffer.readUInt16LE(localOffset+26), localExtraLength=buffer.readUInt16LE(localOffset+28); const start=localOffset+30+localNameLength+localExtraLength;
    const compressed=buffer.subarray(start,start+compressedSize); entries.set(name,(method===0?compressed:zlib.inflateRawSync(compressed)).toString('utf8')); cursor += 46+nameLength+extraLength+commentLength;
  }
  return entries;
}

function readRows(filePath) {
  const entries=readZipEntries(filePath); const shared=[...(entries.get('xl/sharedStrings.xml')||'').matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map(m=>[...m[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(x=>xmlDecode(x[1])).join(''));
  const sheet=entries.get('xl/worksheets/sheet1.xml'); if(!sheet) throw new Error('Missing first worksheet.'); const rows=[];
  for(const rm of sheet.matchAll(/<row\b[^>]*\br="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)){ const values={}; for(const cm of rm[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)){const attrs=cm[1], ref=/\br="([A-Z]+)\d+"/.exec(attrs)?.[1]; if(!ref)continue; const body=cm[2]||'', raw=/<v>([\s\S]*?)<\/v>/.exec(body)?.[1]||''; values[ref]=/\bt="s"/.test(attrs)?(shared[Number(raw)]||''):xmlDecode(raw);} if(clean(values.A) && values.A !== 'S#' && clean(values.A) !== 'NEAR MISS RECORD') rows.push({row:Number(rm[1]),values}); }
  return rows;
}

function parseDate(value) {
  const text=clean(value); if(!text) return null;
  if(/^\d+(\.\d+)?$/.test(text)){ const d=new Date(Date.UTC(1899,11,30)+Number(text)*86400000); return Number.isNaN(d.getTime())?null:d.toISOString().slice(0,10); }
  const m=/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(text); if(!m)return null;
  const d=new Date(Date.UTC(Number(m[3]),Number(m[2])-1,Number(m[1]))); return d.getUTCFullYear()===Number(m[3])&&d.getUTCMonth()===Number(m[2])-1&&d.getUTCDate()===Number(m[1])?d.toISOString().slice(0,10):null;
}

const normalize = (value) => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ');
const fingerprint = (row) => crypto.createHash('sha256').update([row.reportedAt,row.department,row.reporter,row.location,row.description,row.immediateAction].map(normalize).join('|')).digest('hex');

async function main() {
  const sourceRows=readRows(INPUT); const report={source:INPUT,sourceRows:sourceRows.length,successful:0,skipped:0,duplicates:0,failed:0,warnings:0,rows:[]};
  const pool=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME});
  const [existing]=await pool.query('SELECT metadata FROM near_misses'); const known=new Set(); for(const item of existing){try{const metadata=typeof item.metadata==='string'?JSON.parse(item.metadata):item.metadata;if(metadata?.importFingerprint)known.add(metadata.importFingerprint);}catch{}}
  const connection=pool;
  await connection.beginTransaction();
  try {
    for(const source of sourceRows){
      const v=source.values; const issues=[]; const reportedAt=parseDate(v.C); const department=clean(v.D); const description=clean(v.K); const reporter=clean(v.E); const location=clean(v.J); const immediateAction=clean(v.L);
      if(!reportedAt) issues.push('Invalid or missing date in column C');
      if(!description) issues.push('Missing near miss details in column K');
      const normalizedDepartment=normalize(department); const departmentId=DEPARTMENT_IDS[department.toUpperCase()] || null; if(department && !departmentId) issues.push(`Department '${department}' not mapped to a department UUID`);
      const row={reportedAt,department,reporter,location,description,immediateAction}; const importFingerprint=fingerprint(row);
      if(known.has(importFingerprint)){
        // Idempotent reruns also repair source labels in metadata without
        // creating a second database record.
        await connection.query("UPDATE near_misses SET metadata = JSON_SET(COALESCE(metadata, JSON_OBJECT()), '$.department', ?, '$.department_id', ?, '$.date', ?) WHERE JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.importFingerprint')) = ?", [department, departmentId || department, reportedAt, importFingerprint]);
        report.duplicates++;report.rows.push({row:source.row,result:'duplicate',fingerprint:importFingerprint});continue;
      }
      if(issues.some(x=>x.startsWith('Invalid')||x.startsWith('Missing'))){report.failed++;report.rows.push({row:source.row,result:'failed',issues});continue;}
      const status=normalize(v.P)==='closed'?'closed':normalize(v.P)==='open'?'submitted':'under_review';
      const severity=normalize(v.N)==='yes'?'high':'medium';
      const metadata={sourceRow:source.row,importSource:path.basename(INPUT),importFingerprint,date:reportedAt,month:clean(v.B),department,department_id:departmentId || department,reportedByName:reporter,reporterDesignation:clean(v.F),affectedPersonName:clean(v.G),affectedPersonDesignation:clean(v.H),time24Hours:clean(v.I),responsibleDepartment:clean(v.M),investigationRequired:clean(v.N),reportedInHazard:clean(v.O),sourceStatus:clean(v.P),remarks:clean(v.Q),importIssues:issues};
      await connection.query('INSERT INTO near_misses (id,reported_by,plant_id,department_id,title,description,location,severity_level,status,immediate_action,reported_at,created_by,updated_by,metadata,created_at,updated_at) VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())',[USER_ID,PLANT_ID,departmentId,description.slice(0,255),description,location||null,severity,status,immediateAction||null,reportedAt,USER_ID,USER_ID,JSON.stringify(metadata)]);
      known.add(importFingerprint); report.successful++; if(issues.length)report.warnings++; report.rows.push({row:source.row,result:'imported',issues});
    }
    await connection.commit();
  } catch(error){await connection.rollback();throw error;} finally {await pool.end();}
  const reportDir=path.resolve(__dirname,'../import-reports'); fs.mkdirSync(reportDir,{recursive:true}); const reportPath=path.join(reportDir,'near-miss-import.json'); fs.writeFileSync(reportPath,JSON.stringify(report,null,2)); console.log(JSON.stringify({...report,reportPath},null,2));
}
main().catch(error=>{console.error(error);process.exit(1);});
