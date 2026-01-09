import React, { useMemo, useState } from 'react';
import { palette, radii, shadow } from './theme';
import { decisionCriteria as criteriaSeed, reports as seedReports, getStats } from './data';

const cardStyle = { background: palette.surface, borderRadius: radii.lg, border: `1px solid ${palette.border}`, padding: '20px' };

const Section = ({ title, subtitle, children, actions }) => (
  <div style={cardStyle}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: palette.text }}>{title}</h3>
        {subtitle && <p style={{ margin: '4px 0 0', color: palette.muted, fontSize: 13 }}>{subtitle}</p>}
      </div>
      {actions}
    </div>
    {children}
  </div>
);

const StatsCard = ({ label, value, subValue, color = palette.primary }) => (
  <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12, boxShadow: shadow }}>
    <div style={{ width: 48, height: 48, borderRadius: radii.md, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontWeight: 700 }}>
      *
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 700, color: palette.text }}>{value}</div>
      <div style={{ color: palette.muted, fontSize: 13 }}>{label}</div>
      {subValue && <div style={{ fontSize: 12, color }}>{subValue}</div>}
    </div>
  </div>
);

const KnowledgeGraph = ({ reports, filter, onNodeClick, isClassifying }) => {
  const width = 800;
  const height = 440;
  const centerX = width / 2;
  const centerY = height / 2;
  const filtered = filter === 'All' ? reports : reports.filter(r => r.status === filter);
  const sizeForUsers = users => 6 + Math.min(16, users / 4);

  const getPos = (index, total) => {
    const rings = 5;
    const perRing = Math.ceil(total / rings);
    const ring = Math.floor(index / perRing);
    const angle = (index % perRing) / perRing * Math.PI * 2 + ring * 0.3;
    const radius = 60 + ring * 65;
    return { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius };
  };

  const connections = [];
  filtered.slice(0, 60).forEach((report, i) => {
    const deps = Math.min(report.dataSources?.length || 1, 3);
    for (let d = 0; d < deps; d++) {
      const to = (i + d + 3) % Math.min(filtered.length, 60);
      connections.push({ from: i, to });
    }
  });

  const statusColor = (status) => {
    if (status === 'Retire') return palette.warning;
    return palette.primaryStrong;
  };

  return (
    <div style={{ position: 'relative', background: palette.bg, borderRadius: radii.lg, border: `1px solid ${palette.border}` }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <radialGradient id="kg-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={palette.primary} stopOpacity="0.2" />
            <stop offset="100%" stopColor={palette.primary} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={centerX} cy={centerY} r="190" fill="url(#kg-glow)" />
        {connections.map((c, idx) => {
          const a = getPos(c.from, Math.min(filtered.length, 60));
          const b = getPos(c.to, Math.min(filtered.length, 60));
          return <line key={idx} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={palette.border} strokeWidth="1" opacity="0.6" />;
        })}
        <circle cx={centerX} cy={centerY} r="30" fill={palette.primary} />
        <text x={centerX} y={centerY + 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="600">Knowledge</text>
        <text x={centerX} y={centerY + 18} textAnchor="middle" fill="white" fontSize="11" fontWeight="600">Graph</text>
        {filtered.slice(0, 100).map((report, i) => {
          const pos = getPos(i, Math.min(filtered.length, 100));
          const size = sizeForUsers(report.activeUsers);
          return (
            <g key={report.id} onClick={() => onNodeClick(report)} style={{ cursor: 'pointer' }}>
              <circle cx={pos.x} cy={pos.y} r={size} fill={statusColor(report.status)} opacity={isClassifying ? 0.35 : 0.85} />
            </g>
          );
        })}
      </svg>
      {isClassifying && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
          <div style={{ ...cardStyle, boxShadow: shadow, textAlign: 'center' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', border: `3px solid ${palette.border}`, borderTopColor: palette.primary, margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
            <div style={{ fontWeight: 700, color: palette.text }}>Applying decision criteria...</div>
            <div style={{ color: palette.muted, fontSize: 13 }}>Analyzing 8 weighted factors across all reports</div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportCatalog = ({ reports, onRowClick, showStatusMigration = false }) => {
  const [filterArea, setFilterArea] = useState('All');
  const [filterSource, setFilterSource] = useState('All');
  const [search, setSearch] = useState('');

  const functionalAreas = ['All', ...new Set(reports.map(r => r.functionalArea))];
  const sourceTypes = ['All', 'SAP ABAP', 'SAP BW', 'Databricks'];

  const filtered = reports
    .filter(r => filterArea === 'All' || r.functionalArea === filterArea)
    .filter(r => filterSource === 'All' || r.sourceType === filterSource)
    .filter(r => search === '' || r.name.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase()));

  const sourceColors = {
    'SAP ABAP': { bg: '#FEF3C7', text: '#B45309' },
    'SAP BW': { bg: '#DBEAFE', text: '#1D4ED8' },
    'Databricks': { bg: '#F3E8FF', text: '#7C3AED' }
  };
  const statusColors = {
    Needed: { bg: palette.primarySoft, text: palette.primaryStrong },
    Redundant: { bg: '#F3F4F6', text: palette.muted },
    Deprecated: { bg: '#FEF2F2', text: palette.warning },
    Retain: { bg: palette.primarySoft, text: palette.primaryStrong },
    Retire: { bg: '#FEF2F2', text: palette.warning }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reports or IDs"
          style={{ padding: '8px 12px', border: `1px solid ${palette.border}`, borderRadius: radii.md, width: 240, fontSize: 13 }}
        />
        <select value={filterArea} onChange={e => setFilterArea(e.target.value)} style={{ padding: '8px 10px', border: `1px solid ${palette.border}`, borderRadius: radii.md, fontSize: 13 }}>
          {functionalAreas.map(a => <option key={a} value={a}>{a === 'All' ? 'All Functional Areas' : a}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={{ padding: '8px 10px', border: `1px solid ${palette.border}`, borderRadius: radii.md, fontSize: 13 }}>
          {sourceTypes.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sources' : s}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: palette.muted }}>Showing {filtered.length} of {reports.length}</span>
      </div>
      <div style={{ overflowX: 'auto', maxHeight: 520, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead style={{ position: 'sticky', top: 0, background: palette.surface }}>
            <tr style={{ background: palette.bg }}>
              {['Report ID', 'Name', 'Source', 'Functional Area', 'Category', 'Data Sources', 'KPIs', 'Refresh', 'Owner']
                .concat(showStatusMigration ? ['Status', 'Migration Path'] : [])
                .map(header => (
                <th key={header} style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700, color: palette.text, borderBottom: `2px solid ${palette.border}`, whiteSpace: 'nowrap' }}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 60).map(report => (
              <tr key={report.id} onClick={() => onRowClick(report)} style={{ cursor: 'pointer' }}>
                <td style={{ padding: '10px 8px', borderBottom: `1px solid ${palette.border}`, fontFamily: 'monospace', color: palette.muted }}>{report.id}</td>
                <td style={{ padding: '10px 8px', borderBottom: `1px solid ${palette.border}`, fontWeight: 600, color: palette.text }}>{report.name}</td>
                <td style={{ padding: '10px 8px', borderBottom: `1px solid ${palette.border}` }}>
                  <span style={{ padding: '4px 8px', borderRadius: radii.sm, background: sourceColors[report.sourceType].bg, color: sourceColors[report.sourceType].text, fontWeight: 600 }}>
                    {report.sourceType}
                  </span>
                </td>
                <td style={{ padding: '10px 8px', borderBottom: `1px solid ${palette.border}`, color: palette.text }}>{report.functionalArea}</td>
                <td style={{ padding: '10px 8px', borderBottom: `1px solid ${palette.border}`, color: palette.muted }}>{report.category}</td>
                <td style={{ padding: '10px 8px', borderBottom: `1px solid ${palette.border}`, color: palette.muted }}>{report.dataSources.join(', ')}</td>
                <td style={{ padding: '10px 8px', borderBottom: `1px solid ${palette.border}`, color: palette.muted }}>{report.kpiExamples.join(', ')}</td>
                <td style={{ padding: '10px 8px', borderBottom: `1px solid ${palette.border}`, color: palette.muted }}>{report.refreshFrequency}</td>
                <td style={{ padding: '10px 8px', borderBottom: `1px solid ${palette.border}`, color: palette.text }}>{report.businessOwner}</td>
                {showStatusMigration && (
                  <>
                    <td style={{ padding: '10px 8px', borderBottom: `1px solid ${palette.border}` }}>
                      {(() => {
                        const statusLabel = report.migrationPath === 'Retain' ? 'Retain' : report.migrationPath === 'Retire' ? 'Retire' : report.status;
                        const colors = statusColors[statusLabel] || { bg: palette.bg, text: palette.text };
                        return (
                          <span style={{ padding: '4px 8px', borderRadius: radii.sm, background: colors.bg, color: colors.text, fontWeight: 700 }}>
                            {statusLabel}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '10px 8px', borderBottom: `1px solid ${palette.border}`, color: palette.text, fontWeight: 600 }}>
                      {report.migrationPath === 'Retire' ? '' : report.migrationPath}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DecisionCriteriaPanel = ({ criteria, onWeightChange }) => (
  <Section title="Decision Criteria Framework" subtitle="Adjust weights to tune classification and migration recommendations">
    <div style={{ marginBottom: 10, padding: 10, borderRadius: radii.md, background: '#F9FAFB', border: `1px solid ${palette.border}` }}>
      <div style={{ fontWeight: 700, color: palette.text }}>Weights total: {criteria.reduce((s, c) => s + c.weight, 0)}</div>
      <div style={{ color: palette.muted, fontSize: 12 }}>Keep total at 100 for balanced scoring. Adjust sliders to redistribute.</div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
      {criteria.map(c => (
        <div key={c.id} style={{ ...cardStyle, border: `1px solid ${palette.border}`, boxShadow: shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 700, color: palette.text }}>{c.name}</div>
              <div style={{ color: palette.muted, fontSize: 12 }}>{c.shortName}</div>
            </div>
            <div style={{ padding: '6px 10px', background: palette.primarySoft, borderRadius: radii.sm, color: palette.primaryStrong, fontWeight: 700 }}>{c.weight}%</div>
          </div>
          <p style={{ margin: '0 0 8px', color: palette.muted, fontSize: 13 }}>{c.description}</p>
          <input type="range" min={5} max={30} value={c.weight} onChange={(e) => onWeightChange(c.id, Number(e.target.value))} style={{ width: '100%' }} />
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {c.options.map(opt => (
              <span key={opt} style={{ padding: '4px 6px', borderRadius: radii.sm, background: palette.bg, color: palette.muted, fontSize: 11 }}>{opt}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </Section>
);

const pathColors = {
  'S/4HANA Embedded Analytics': palette.primary,
  'SAP Datasphere / BDC': palette.accentPurple,
  'Databricks': palette.accentBlue,
  'SAP BW HANA Cloud': palette.accentGreen || '#10B981',
  'Retain': palette.primaryStrong,
  'Retire': palette.warning
};

const MigrationMatrix = ({ reports }) => {
  const sources = ['SAP ABAP', 'SAP BW', 'Databricks'];
  const targets = ['S/4HANA Embedded Analytics', 'SAP Datasphere / BDC', 'Databricks', 'SAP BW HANA Cloud', 'Retain', 'Retire'];
  const counts = {};
  sources.forEach(s => { counts[s] = {}; targets.forEach(t => { counts[s][t] = 0; }); });

  reports.forEach(r => {
    if (r.status === 'Retire') {
      counts[r.sourceType]['Retire'] += 1;
    } else {
      counts[r.sourceType][r.migrationPath] += 1;
      counts[r.sourceType]['Retain'] += 1;
    }
  });

  const rowTotals = sources.map(s => counts[s]['Retain'] + counts[s]['Retire']);
  const colTotals = targets.map(t => sources.reduce((sum, s) => sum + counts[s][t], 0));
  const grandTotal = reports.length;
  const cellColor = (t) => `${pathColors[t]}25`;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, border: `1px solid ${palette.border}`, borderRadius: radii.md, overflow: 'hidden' }}>
        <thead>
          <tr>
            <th style={{ padding: 12, textAlign: 'left', borderBottom: `2px solid ${palette.border}`, background: palette.bg }}>Source → Path</th>
            {targets.map(t => (
              <th key={t} style={{ padding: 12, textAlign: 'center', borderBottom: `2px solid ${palette.border}`, background: palette.bg, color: palette.text }}>{t}</th>
            ))}
            <th style={{ padding: 12, textAlign: 'center', borderBottom: `2px solid ${palette.border}`, background: palette.bg, color: palette.text }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s, rowIdx) => (
            <tr key={s}>
              <td style={{ padding: 12, borderBottom: `1px solid ${palette.border}`, fontWeight: 700, color: palette.text, background: palette.surface }}>{s}</td>
              {targets.map(t => (
                <td key={t} style={{ padding: 12, borderBottom: `1px solid ${palette.border}`, textAlign: 'center', color: pathColors[t], background: cellColor(t), fontWeight: 700 }}>
                  {counts[s][t]}
                </td>
              ))}
              <td style={{ padding: 12, borderBottom: `1px solid ${palette.border}`, textAlign: 'center', fontWeight: 800, color: palette.text, background: palette.bg }}>{rowTotals[rowIdx]}</td>
            </tr>
          ))}
          <tr>
            <td style={{ padding: 12, borderTop: `2px solid ${palette.border}`, fontWeight: 800, color: palette.text, background: palette.bg }}>Total</td>
            {targets.map((t, idx) => (
              <td key={t} style={{ padding: 12, borderTop: `2px solid ${palette.border}`, textAlign: 'center', fontWeight: 800, color: pathColors[t], background: cellColor(t) }}>
                {colTotals[idx]}
              </td>
            ))}
            <td style={{ padding: 12, borderTop: `2px solid ${palette.border}`, textAlign: 'center', fontWeight: 900, color: palette.primaryStrong, background: palette.surface }}>{grandTotal}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const ReportDetailPanel = ({ report, onClose, criteria }) => (
  <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, background: palette.surface, boxShadow: '-6px 0 30px rgba(0,0,0,0.1)', padding: 20, overflowY: 'auto', borderLeft: `1px solid ${palette.border}` }}>
    <button onClick={onClose} style={{ border: `1px solid ${palette.border}`, background: 'transparent', padding: '6px 10px', borderRadius: radii.sm, cursor: 'pointer', color: palette.muted }}>Close</button>
    <h3 style={{ margin: '12px 0 4px', color: palette.text }}>{report.name}</h3>
    <p style={{ margin: 0, color: palette.muted, fontSize: 13 }}>{report.id} - {report.sourceType} - {report.functionalArea}</p>
    <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {[{ label: 'Status', value: report.status }, { label: 'Migration Path', value: report.migrationPath }, { label: 'Owner', value: report.businessOwner }, { label: 'Refresh', value: report.refreshFrequency }, { label: 'Last Used (days)', value: report.lastUsed }, { label: 'Active Users', value: report.activeUsers }].map(item => (
        <div key={item.label} style={{ padding: '10px 12px', borderRadius: radii.md, background: palette.bg, border: `1px solid ${palette.border}` }}>
          <div style={{ fontSize: 12, color: palette.muted }}>{item.label}</div>
          <div style={{ fontWeight: 700, color: palette.text }}>{item.value}</div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 14 }}>
      <div style={{ fontWeight: 700, color: palette.text, marginBottom: 6 }}>Criteria Scores</div>
      <div style={{ display: 'grid', gap: 6 }}>
        {criteria.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: palette.bg, border: `1px solid ${palette.border}`, color: palette.muted, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{c.id}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: palette.muted }}>{c.shortName}</div>
              <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <div key={n} style={{ height: 6, width: 32, borderRadius: 4, background: n <= report.criteriaScores[c.id] ? palette.primary : palette.border }} />
                ))}
              </div>
            </div>
            <div style={{ fontWeight: 700, color: palette.text }}>{report.criteriaScores[c.id]}/5</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const KnowledgeBaseFlow = () => {
  const steps = [
  { id: 'reports', label: 'Reports', desc: 'BW/BEx, ABAP, Databricks, BO/BI', required: true },
  { id: 'design-docs', label: 'Design Docs', desc: 'BRD/TRD, process maps, KPIs' },
  { id: 'specifications', label: 'Specifications', desc: 'Report specs, joins, filters' },
  { id: 'headers', label: 'Headers/Schemas', desc: 'Table/field metadata, lineage' },
  { id: 'test-scripts', label: 'Test Scripts', desc: 'Validation queries, reconciliations, QA checks' },
  { id: 'training', label: 'Training Docs', desc: 'Enablement decks, SOPs' }, 
  { id: 'knowledge', label: 'Knowledge Base', desc: 'Unified catalog + embeddings' },
  { id: 'dynamic', label: 'Dynamic Stats', desc: 'Source mix, usage, overlaps' }
];

  const [uploads, setUploads] = useState({});

  const onUpload = (id, event) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploads(prev => ({ ...prev, [id]: file.name }));
    }
  };

  const buttonStyle = (primary) => ({
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.md,
    border: primary ? 'none' : `1px solid ${palette.border}`,
    background: primary ? palette.primary : palette.surface,
    color: primary ? '#fff' : palette.text,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13
  });

  return (
    <Section title="Ingestion to Insights" subtitle="Upload artifacts for each stage to enrich the knowledge base and graph">
      <div style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(260px, 1fr)', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
        {steps.map((step, idx) => {
          const inputId = `kb-upload-${step.id}`;
          return (
            <div
              key={step.id}
              style={{
                ...cardStyle,
                border: `1px solid ${palette.border}`,
                boxShadow: shadow,
                minHeight: 150,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontWeight: 800, color: palette.text }}>{step.label}</div>
                    {step.required && (
                      <span style={{ padding: '2px 8px', background: '#FEF2F2', color: palette.warning, borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                        Required
                      </span>
                    )}
                  </div>
                  <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.4 }}>{step.desc}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', width: '100%', overflow: 'hidden' }}>
                  <button style={{ ...buttonStyle(false), minWidth: 32, justifyContent: 'center', padding: '6px 8px', whiteSpace: 'nowrap' }}>
                    <span role="img" aria-label="comment">💬</span>
                  </button>
                  <button
                    style={{ ...buttonStyle(true), minWidth: 92, justifyContent: 'center', padding: '6px 8px', whiteSpace: 'nowrap' }}
                    onClick={() => document.getElementById(inputId)?.click()}
                  >
                    <span role="img" aria-label="upload">⬆️</span>
                    Upload
                  </button>
                  <input id={inputId} type="file" style={{ display: 'none' }} onChange={(e) => onUpload(step.id, e)} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <span style={{ fontSize: 12, color: uploads[step.id] ? palette.primaryStrong : palette.muted, fontWeight: 700 }}>
                  {uploads[step.id] ? `Uploaded: ${uploads[step.id]}` : 'No file yet'}
                </span>
                <span style={{ fontSize: 18, color: palette.muted }}>{idx === steps.length - 1 ? '' : '→'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
};

const KnowledgeBaseNodes = ({ functionalAreas }) => (
  <Section title="Knowledge Base Creation" subtitle="Technical areas represented as nodes">
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {functionalAreas.map(area => (
        <div key={area} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: radii.md, border: `1px solid ${palette.border}`, background: palette.surface, boxShadow: shadow }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: palette.primary }} />
          <div style={{ fontWeight: 700, color: palette.text }}>{area}</div>
        </div>
      ))}
    </div>
  </Section>
);

const Sidebar = ({ active, setActive }) => {
  const nav = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'catalog', label: 'Inputs' },
    { id: 'criteria', label: 'Decision Framework' },
    { id: 'status', label: 'Status & Migration' },
    { id: 'graph', label: 'Knowledge Graph' },
    { id: 'matrix', label: 'Migration Matrix' },
    { id: 'summary', label: 'Summary' },
    { id: 'walkthrough', label: 'Demo Walkthrough' },
    { id: 'plan', label: 'Implementation Plan' }
  ];
  return (
    <aside style={{ width: 240, position: 'fixed', top: 0, bottom: 0, left: 0, background: palette.surface, borderRight: `1px solid ${palette.border}`, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: radii.md, background: palette.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>DN</div>
        <div>
          <div style={{ fontWeight: 800, color: palette.text }}>DataNext</div>
          <div style={{ color: palette.muted, fontSize: 12 }}>S/4HANA Migration</div>
        </div>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {nav.map(item => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            style={{
              padding: '10px 12px',
              borderRadius: radii.md,
              border: `1px solid ${active === item.id ? palette.primary : palette.border}`,
              background: active === item.id ? palette.primarySoft : palette.surface,
              color: active === item.id ? palette.primaryStrong : palette.text,
              cursor: 'pointer',
              textAlign: 'left',
              fontWeight: active === item.id ? 700 : 500
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

const DemoWalkthrough = () => (
  <Section title="Demo Walkthrough" subtitle="Step-by-step showcase">
    <div style={{ color: palette.muted }}>Use nav to explore each stage.</div>
  </Section>
);

const ImplementationPlan = () => (
  <Section title="Implementation Plan" subtitle="Track by ownership">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
      <div style={{ ...cardStyle, border: `1px solid ${palette.border}` }}>
        <div style={{ fontWeight: 700, color: palette.text }}>Admin</div>
        <ul style={{ margin: '6px 0 0', paddingLeft: 16, color: palette.muted, fontSize: 13, lineHeight: 1.6 }}>
          <li>Provision environments and data access</li>
          <li>Set decision-criteria weights and governance rules</li>
          <li>Own migration gates and approvals</li>
        </ul>
      </div>
      <div style={{ ...cardStyle, border: `1px solid ${palette.border}` }}>
        <div style={{ fontWeight: 700, color: palette.text }}>User Management</div>
        <ul style={{ margin: '6px 0 0', paddingLeft: 16, color: palette.muted, fontSize: 13, lineHeight: 1.6 }}>
          <li>Assign report owners and reviewers</li>
          <li>Collect inputs (uploads) per stage</li>
          <li>Train users on catalog, graph, and matrix flows</li>
        </ul>
      </div>
    </div>
  </Section>
);

export default function DataNextApp() {
  const [criteria, setCriteria] = useState(criteriaSeed);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [isClassifying, setIsClassifying] = useState(false);
  const [auth, setAuth] = useState({ user: '', pass: '', error: '' });
  const [authorized, setAuthorized] = useState(false);

  const stats = useMemo(() => getStats(seedReports), []);
  const totalWeight = useMemo(() => criteria.reduce((s, c) => s + c.weight, 0), [criteria]);
  const functionalAreas = useMemo(() => [...new Set(seedReports.map(r => r.functionalArea))], []);

  const handleWeightChange = (id, weight) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, weight } : c));
  };

  const runClassification = () => {
    setIsClassifying(true);
    setTimeout(() => setIsClassifying(false), 2000);
  };

  const tryLogin = (e) => {
    e.preventDefault();
    if (auth.user === 'admin' && auth.pass === 'admin') {
      setAuthorized(true);
      setAuth({ user: '', pass: '', error: '' });
    } else {
      setAuth(prev => ({ ...prev, error: 'Invalid credentials' }));
    }
  };

  if (!authorized) {
    return (
      <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: palette.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ ...cardStyle, width: 360, boxShadow: shadow }}>
          <h2 style={{ margin: 0, color: palette.text }}>DataNext Login</h2>
          <p style={{ margin: '6px 0 16px', color: palette.muted, fontSize: 13 }}>Authorized access only</p>
          <form onSubmit={tryLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              value={auth.user}
              onChange={e => setAuth(prev => ({ ...prev, user: e.target.value }))}
              placeholder="Username"
              style={{ padding: '10px 12px', borderRadius: radii.md, border: `1px solid ${palette.border}`, fontSize: 14 }}
            />
            <input
              type="password"
              value={auth.pass}
              onChange={e => setAuth(prev => ({ ...prev, pass: e.target.value }))}
              placeholder="Password"
              style={{ padding: '10px 12px', borderRadius: radii.md, border: `1px solid ${palette.border}`, fontSize: 14 }}
            />
            {auth.error && <div style={{ color: palette.warning, fontSize: 12, fontWeight: 700 }}>{auth.error}</div>}
            <button type="submit" style={{ padding: '10px 12px', background: palette.primary, color: '#fff', border: 'none', borderRadius: radii.md, cursor: 'pointer', fontWeight: 700 }}>Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: palette.bg, minHeight: '100vh', color: palette.text }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>
      <Sidebar active={activeView} setActive={setActiveView} />
      <main style={{ marginLeft: 260, padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>
              {activeView === 'dashboard' && 'Analytics Rationalization Dashboard'}
              {activeView === 'catalog' && 'Inputs'}
              {activeView === 'criteria' && 'Decision Framework'}
              {activeView === 'status' && 'Status & Migration'}
              {activeView === 'graph' && 'Knowledge Graph Explorer'}
              {activeView === 'matrix' && 'Migration Recommendation Matrix'}
              {activeView === 'summary' && 'Summary'}
              {activeView === 'walkthrough' && 'Demo Walkthrough'}
              {activeView === 'plan' && 'Implementation Plan'}
            </h1>
            <p style={{ margin: '4px 0 0', color: palette.muted, fontSize: 13 }}>Aligned to BRD/TRD - S/4HANA legacy report migration</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {totalWeight !== 100 && (
              <div style={{ padding: '8px 12px', borderRadius: radii.md, background: '#FEF3C7', color: '#92400E', border: '1px solid #FBBF24', fontWeight: 700 }}>
                Criteria weights must sum to 100 (current {totalWeight})
              </div>
            )}
            <button onClick={runClassification} style={{ padding: '10px 16px', background: palette.primary, color: '#fff', border: 'none', borderRadius: radii.md, cursor: 'pointer', fontWeight: 700 }}>
              Run Classification
            </button>
          </div>
        </div>

        {activeView === 'dashboard' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <StatsCard label="Total Reports" value={stats.total} subValue="In catalog" />
              <StatsCard label="Retain" value={stats.retain} subValue={`${Math.round(stats.retain / stats.total * 100)}% retained`} />
              <StatsCard label="Retire" value={stats.retire} color={palette.warning} subValue={`${Math.round(stats.retire / stats.total * 100)}% retiring`} />
              <StatsCard label="Pending Review" value={stats.pending} color={palette.neutral} subValue="Balance to classify" />
            </div>
            <Section title="Readiness Snapshot" subtitle="Visual summary of migration readiness and source mix">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <div style={{ ...cardStyle, border: `1px solid ${palette.border}` }}>
                  <div style={{ fontWeight: 700, color: palette.text, marginBottom: 8 }}>Migration Readiness</div>
                  <div style={{ height: 12, background: palette.bg, borderRadius: radii.sm, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round(stats.retain / stats.total * 100)}%`, height: '100%', background: palette.primary }} />
                  </div>
                  <div style={{ marginTop: 6, color: palette.muted, fontSize: 13 }}>{Math.round(stats.retain / stats.total * 100)}% retain, {Math.round(stats.retire / stats.total * 100)}% retire</div>
                </div>
                <div style={{ ...cardStyle, border: `1px solid ${palette.border}` }}>
                  <div style={{ fontWeight: 700, color: palette.text, marginBottom: 8 }}>Source Composition</div>
                  {Object.entries(stats.bySource).map(([src, count]) => (
                    <div key={src} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: palette.muted }}>
                        <span>{src}</span>
                        <span style={{ color: palette.primaryStrong, fontWeight: 700 }}>{count}</span>
                      </div>
                      <div style={{ height: 8, background: palette.bg, borderRadius: radii.sm }}>
                        <div style={{ width: `${(count / stats.total) * 100}%`, height: '100%', background: src === 'SAP ABAP' ? '#F59E0B' : src === 'SAP BW' ? '#3B82F6' : palette.accentPurple, borderRadius: radii.sm }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ ...cardStyle, border: `1px solid ${palette.border}` }}>
                  <div style={{ fontWeight: 700, color: palette.text, marginBottom: 8 }}>Path Mix</div>
                  {Object.entries(stats.byPath).map(([path, count]) => (
                    <div key={path} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: palette.muted }}>
                        <span>{path}</span>
                        <span style={{ color: pathColors[path], fontWeight: 700 }}>{count}</span>
                      </div>
                      <div style={{ height: 8, background: palette.bg, borderRadius: radii.sm }}>
                        <div style={{ width: `${(count / stats.total) * 100}%`, height: '100%', background: pathColors[path], borderRadius: radii.sm }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
            <Section title="Knowledge Graph Overview" subtitle="Lineage and dependency view across BW, ABAP, and Databricks">
              <KnowledgeGraph reports={seedReports} filter="All" onNodeClick={setSelectedReport} isClassifying={isClassifying} />
            </Section>
          </>
        )}

        {activeView === 'catalog' && (
          <>
            <KnowledgeBaseFlow />
          </>
        )}

        {activeView === 'criteria' && (
          <DecisionCriteriaPanel criteria={criteria} onWeightChange={handleWeightChange} />
        )}

        {activeView === 'status' && (
          <Section title="Status & Migration" subtitle="Full catalog view with status and migration path">
            <ReportCatalog reports={seedReports} onRowClick={setSelectedReport} showStatusMigration />
          </Section>
        )}

        {activeView === 'graph' && (
          <>
            <Section
              title="Interactive Knowledge Graph"
              subtitle="Filter by status to validate classification impact and knowledge base coverage"
              actions={(
                <div style={{ display: 'flex', gap: 8 }}>
                  {['All', 'Retain', 'Retire'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '6px 12px', borderRadius: radii.md, border: `1px solid ${statusFilter === s ? palette.primary : palette.border}`, background: statusFilter === s ? palette.primarySoft : palette.surface, color: statusFilter === s ? palette.primaryStrong : palette.text, cursor: 'pointer' }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <KnowledgeGraph
                  reports={statusFilter === 'All' ? seedReports : seedReports.filter(r => r.status === statusFilter)}
                  filter={statusFilter}
                  onNodeClick={setSelectedReport}
                  isClassifying={isClassifying}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ ...cardStyle, border: `1px solid ${palette.border}` }}>
                    <div style={{ fontWeight: 700, color: palette.text }}>Knowledge Base Coverage</div>
                    <div style={{ color: palette.muted, fontSize: 13 }}>BW/ECC lineage, Databricks assets, BI usage, ownership</div>
                    <div style={{ marginTop: 10 }}>
                      {['SAP BW/ECC', 'Databricks', 'BI Tools', 'Governance'].map((item, idx) => (
                        <div key={item} style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: palette.muted }}>
                            <span>{item}</span>
                            <span style={{ color: palette.primaryStrong }}>{80 + idx * 4}%</span>
                          </div>
                          <div style={{ height: 6, background: palette.bg, borderRadius: radii.sm }}>
                            <div style={{ width: `${80 + idx * 4}%`, height: '100%', background: palette.primary, borderRadius: radii.sm }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ ...cardStyle, border: `1px solid ${palette.border}` }}>
                    <div style={{ fontWeight: 700, color: palette.text }}>Legend</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6, color: palette.muted, fontSize: 13 }}>
                      {[{ label: 'Retain', color: palette.primaryStrong }, { label: 'Retire', color: palette.warning }].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                          <span style={{ color: item.color === palette.primary ? palette.text : item.color }}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ ...cardStyle, border: `1px solid ${palette.border}` }}>
                    <div style={{ fontWeight: 700, color: palette.text }}>Top Signals</div>
                    <ul style={{ margin: 0, paddingLeft: 16, color: palette.muted, fontSize: 13 }}>
                      <li>Highlight high-usage, multi-source reports for BDC rebuild</li>
                      <li>Flag unused greater than 180 days for retirement validation</li>
                      <li>Show AI/ML readiness for Databricks candidates</li>
                    </ul>
                  </div>
                  <div style={{ ...cardStyle, border: `1px solid ${palette.border}` }}>
                    <div style={{ fontWeight: 700, color: palette.text }}>Graph-Powered Actions</div>
                    <ul style={{ margin: 0, paddingLeft: 16, color: palette.muted, fontSize: 13 }}>
                      <li>Summarize report purpose, KPIs, and owners from graph context</li>
                      <li>Trace lineage hop-by-hop (source → transform → report)</li>
                      <li>Impact analysis: who is affected if a source changes</li>
                      <li>Similarity search to find duplicates/overlaps</li>
                      <li>Surface candidate migration paths based on connected attributes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Section>
            <KnowledgeBaseNodes functionalAreas={functionalAreas} />
          </>
        )}

        {activeView === 'matrix' && (
          <Section title="Source to Target Migration Matrix" subtitle="Counts by legacy source and recommended path">
            <MigrationMatrix reports={seedReports} />
          </Section>
        )}

        {activeView === 'summary' && (
          <Section title="Summary" subtitle="Quick highlights after migration matrix">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <StatsCard label="Total Reports" value={stats.total} />
              <StatsCard label="Retain" value={stats.retain} />
              <StatsCard label="Retire" value={stats.retire} color={palette.warning} />
            </div>
          </Section>
        )}

        {activeView === 'walkthrough' && <DemoWalkthrough />}

        {activeView === 'plan' && <ImplementationPlan />}
      </main>

      {selectedReport && (
        <ReportDetailPanel report={selectedReport} onClose={() => setSelectedReport(null)} criteria={criteria} />
      )}
    </div>
  );
}
