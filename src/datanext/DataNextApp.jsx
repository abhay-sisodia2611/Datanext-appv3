import React, { useMemo, useState } from 'react';
import { palette, radii, shadow } from './theme';
import { decisionCriteria as criteriaSeed, reports as seedReports, getStats } from './data';

const cardStyle = {
  background: palette.surface,
  borderRadius: radii.lg,
  border: `1px solid \${palette.border}`,
  padding: '20px'
};

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
    <div style={{ width: 48, height: 48, borderRadius: radii.md, background: `\${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontWeight: 700 }}>
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
    <div style={{ overflow: 'auto', maxWidth: '100%' }}>
      <div style={{ position: 'relative', background: palette.bg, borderRadius: radii.lg, border: `1px solid \${palette.border}`, minWidth: width, minHeight: height }}>
        <svg width={width} height={height} viewBox={`0 0 \${width} \${height}`}>
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
              <div style={{ width: 42, height: 42, borderRadius: '50%', border: `3px solid \${palette.border}`, borderTopColor: palette.primary, margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
              <div style={{ fontWeight: 700, color: palette.text }}>Applying decision criteria...</div>
              <div style={{ color: palette.muted, fontSize: 13 }}>Analyzing 8 weighted factors across all reports</div>
            </div>
          </div>
        )}
      </div>
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
          style={{ padding: '8px 12px', border: `1px solid \${palette.border}`, borderRadius: radii.md, width: 240, fontSize: 13 }}
        />
        <select value={filterArea} onChange={e => setFilterArea(e.target.value)} style={{ padding: '8px 10px', border: `1px solid \${palette.border}`, borderRadius: radii.md, fontSize: 13 }}>
          {functionalAreas.map(a => <option key={a} value={a}>{a === 'All' ? 'All Functional Areas' : a}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={{ padding: '8px 10px', border: `1px solid \${palette.border}`, borderRadius: radii.md, fontSize: 13 }}>
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
                <th key={header} style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700, color: palette.text, borderBottom: `2px solid \${palette.border}`, whiteSpace: 'nowrap' }}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 60).map(report => (
              <tr key={report.id} onClick={() => onRowClick(report)} style={{ cursor: 'pointer' }}>
                <td style={{ padding: '10px 8px', borderBottom: `1px solid \${palette.border}`, fontFamily: 'monospace', color: palette.muted }}>{report.id}</td>
                <td style={{ padding: '10px 8px', borderBottom: `1px solid \${palette.border}`, fontWeight: 600, color: palette.text }}>{report.name}</td>
                <td style={{ padding: '10px 8px', borderBottom: `1px solid \${palette.border}` }}>
                  <span style={{ padding: '4px 8px', borderRadius: radii.sm, background: sourceColors[report.sourceType].bg, color: sourceColors[report.sourceType].text, fontWeight: 600 }}>
                    {report.sourceType}
                  </span>
                </td>
                <td style={{ padding: '10px 8px', borderBottom: `1px solid \${palette.border}`, color: palette.text }}>{report.functionalArea}</td>
                <td style={{ padding: '10px 8px', borderBottom: `1px solid \${palette.border}`, color: palette.muted }}>{report.category}</td>
                <td style={{ padding: '10px 8px', borderBottom: `1px solid \${palette.border}`, color: palette.muted }}>{report.dataSources.join(', ')}</td>
                <td style={{ padding: '10px 8px', borderBottom: `1px solid \${palette.border}`, color: palette.muted }}>{report.kpiExamples.join(', ')}</td>
                <td style={{ padding: '10px 8px', borderBottom: `1px solid \${palette.border}`, color: palette.muted }}>{report.refreshFrequency}</td>
                <td style={{ padding: '10px 8px', borderBottom: `1px solid \${palette.border}`, color: palette.text }}>{report.businessOwner}</td>
                {showStatusMigration && (
                  <>
                    <td style={{ padding: '10px 8px', borderBottom: `1px solid \${palette.border}` }}>
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
                    <td style={{ padding: '10px 8px', borderBottom: `1px solid \${palette.border}`, color: palette.text, fontWeight: 600 }}>
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
    <div style={{ marginBottom: 10, padding: 10, borderRadius: radii.md, background: '#F9FAFB', border: `1px solid \${palette.border}` }}>
      <div style={{ fontWeight: 700, color: palette.text }}>Weights total: {criteria.reduce((s, c) => s + c.weight, 0)}</div>
      <div style={{ color: palette.muted, fontSize: 12 }}>Keep total at 100 for balanced scoring. Adjust sliders to redistribute.</div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
      {criteria.map(c => (
        <div key={c.id} style={{ ...cardStyle, border: `1px solid \${palette.border}`, boxShadow: shadow }}>
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
  const cellColor = (t) => `\${pathColors[t]}25`;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, border: `1px solid \${palette.border}`, borderRadius: radii.md, overflow: 'hidden' }}>
        <thead>
          <tr>
            <th style={{ padding: 12, textAlign: 'left', borderBottom: `2px solid \${palette.border}`, background: palette.bg }}>Source → Path</th>
            {targets.map(t => (
              <th key={t} style={{ padding: 12, textAlign: 'center', borderBottom: `2px solid \${palette.border}`, background: palette.bg, color: palette.text }}>{t}</th>
            ))}
            <th style={{ padding: 12, textAlign: 'center', borderBottom: `2px solid \${palette.border}`, background: palette.bg, color: palette.text }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s, rowIdx) => (
            <tr key={s}>
              <td style={{ padding: 12, borderBottom: `1px solid \${palette.border}`, fontWeight: 700, color: palette.text, background: palette.surface }}>{s}</td>
              {targets.map(t => (
                <td key={t} style={{ padding: 12, borderBottom: `1px solid \${palette.border}`, textAlign: 'center', color: pathColors[t], background: cellColor(t), fontWeight: 700 }}>
                  {counts[s][t]}
                </td>
              ))}
              <td style={{ padding: 12, borderBottom: `1px solid \${palette.border}`, textAlign: 'center', fontWeight: 800, color: palette.text, background: palette.bg }}>{rowTotals[rowIdx]}</td>
            </tr>
          ))}
          <tr>
            <td style={{ padding: 12, borderTop: `2px solid \${palette.border}`, fontWeight: 800, color: palette.text, background: palette.bg }}>Total</td>
            {targets.map((t, idx) => (
              <td key={t} style={{ padding: 12, borderTop: `2px solid \${palette.border}`, textAlign: 'center', fontWeight: 800, color: pathColors[t], background: cellColor(t) }}>
                {colTotals[idx]}
              </td>
            ))}
            <td style={{ padding: 12, borderTop: `2px solid \${palette.border}`, textAlign: 'center', fontWeight: 900, color: palette.primaryStrong, background: palette.surface }}>{grandTotal}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        <div style={{ ...cardStyle, border: `1px solid \${palette.border}` }}>
          <div style={{ fontWeight: 700, color: palette.text }}>Executive View</div>
          <ul style={{ margin: '6px 0 0', paddingLeft: 16, color: palette.muted, fontSize: 13, lineHeight: 1.6 }}>
            {targets.map(t => (
              <li key={t}>{t}: {sources.reduce((s, src) => s + counts[src][t], 0)}</li>
            ))}
          </ul>
        </div>
        <div style={{ ...cardStyle, border: `1px solid \${palette.border}` }}>
          <div style={{ fontWeight: 700, color: palette.text }}>Risk Hotspots</div>
          <ul style={{ margin: '6px 0 0', paddingLeft: 16, color: palette.muted, fontSize: 13, lineHeight: 1.6 }}>
            <li>High Retire counts need business validation</li>
            <li>High-complexity Databricks or BW HANA Cloud moves need data readiness checks</li>
            <li>Ownership gaps delay migrations—fill before execution</li>
          </ul>
        </div>
        <div style={{ ...cardStyle, border: `1px solid \${palette.border}` }}>
          <div style={{ fontWeight: 700, color: palette.text }}>Action Queue</div>
          <ul style={{ margin: '6px 0 0', paddingLeft: 16, color: palette.muted, fontSize: 13, lineHeight: 1.6 }}>
            <li>Prioritize high-usage SAP Datasphere / BDC rebuilds</li>
            <li>Schedule Databricks moves with AI/ML dependencies</li>
            <li>Lock retirements after governance sign-off</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const ReportDetailPanel = ({ report, onClose, criteria }) => (
  <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, background: palette.surface, boxShadow: '-6px 0 30px rgba(0,0,0,0.1)', padding: 20, overflowY: 'auto', borderLeft: `1px solid \${palette.border}` }}>
    <button onClick={onClose} style={{ border: `1px solid \${palette.border}`, background: 'transparent', padding: '6px 10px', borderRadius: radii.sm, cursor: 'pointer', color: palette.muted }}>Close</button>
    <h3 style={{ margin: '12px 0 4px', color: palette.text }}>{report.name}</h3>
    <p style={{ margin: 0, color: palette.muted, fontSize: 13 }}>{report.id} - {report.sourceType} - {report.functionalArea}</p>
    <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {[{ label: 'Status', value: report.status }, { label: 'Migration Path', value: report.migrationPath }, { label: 'Owner', value: report.businessOwner }, { label: 'Refresh', value: report.refreshFrequency }, { label: 'Last Used (days)', value: report.lastUsed }, { label: 'Active Users', value: report.activeUsers }].map(item => (
        <div key={item.label} style={{ padding: '10px 12px', borderRadius: radii.md, background: palette.bg, border: `1px solid \${palette.border}` }}>
          <div style={{ fontSize: 12, color: palette.muted }}>{item.label}</div>
          <div style={{ fontWeight: 700, color: palette.text }}>{item.value}</div>
        </div>
      ))}
    </div>
    <Section title="Criteria Scores" subtitle="Weighted inputs driving classification and path">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
        {criteria.map(c => (
          <div key={c.id} style={{ padding: '10px 12px', borderRadius: radii.md, background: palette.bg, border: `1px solid \${palette.border}` }}>
            <div style={{ fontSize: 12, color: palette.muted }}>{c.shortName}</div>
            <div style={{ fontWeight: 700, color: palette.text }}>{report.criteriaScores[c.id]}</div>
            <div style={{ fontSize: 11, color: palette.muted }}>Weight {c.weight}%</div>
          </div>
        ))}
      </div>
    </Section>
    <Section title="Data Sources and KPIs">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ color: palette.muted, fontSize: 13 }}>Data Sources: {report.dataSources.join(', ')}</div>
        <div style={{ color: palette.muted, fontSize: 13 }}>KPIs: {report.kpiExamples.join(', ')}</div>
        <div style={{ color: palette.muted, fontSize: 13 }}>Rationale: {report.rationale}</div>
      </div>
    </Section>
  </div>
);

const ImplementationPlan = () => (
  <Section title="Administration" subtitle="Execution guide aligned to BRD/TRD scope">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
      <div style={{ ...cardStyle, boxShadow: shadow }}>
        <h4 style={{ margin: '0 0 8px', color: palette.text }}>Admin</h4>
        <div style={{ display: 'grid', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700, color: palette.text }}>Connectors & Ingestion</div>
            <ul style={{ margin: '4px 0 0', paddingLeft: 16, color: palette.muted, fontSize: 13 }}>
              <li>SAP BW/ECC metadata (RS* tables, InfoProviders, ACDOCA/CDS, ABAP catalog)</li>
              <li>BI metadata (Power BI/Tableau APIs) + BO audit/usage logs</li>
              <li>Synapse/Purview/Databricks lineage, KPI catalog, ServiceNow/Jira ownership</li>
            </ul>
            <div style={{ marginTop: 6, padding: 8, borderRadius: radii.md, background: palette.primarySoft, color: palette.primaryStrong, fontWeight: 700 }}>Exit: Access validated, sample ingest completed</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: palette.text }}>APIs & Data Model</div>
            <ul style={{ margin: '4px 0 0', paddingLeft: 16, color: palette.muted, fontSize: 13 }}>
              <li>/reports (filters, pagination) · /reports/:id (metadata + lineage refs)</li>
              <li>/graph (nodes/edges with limits) · /matrix (source → path counts)</li>
              <li>/classify (run), /weights (versioned), /export (catalog/matrix/graph)</li>
            </ul>
            <div style={{ marginTop: 6, padding: 8, borderRadius: radii.md, background: palette.bg, color: palette.text, fontSize: 12 }}>Schema anchors: Report, CriteriaScores, Classification, Migration, Relationship</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: palette.text }}>Security, NFRs, Ops</div>
            <ul style={{ margin: '4px 0 0', paddingLeft: 16, color: palette.muted, fontSize: 13 }}>
              <li>SSO + RBAC (Viewer/Analyst/Admin), HTTPS only</li>
              <li>Least-privilege read-only connectors, rate limits, input validation</li>
              <li>UI summary loads &lt; 3s @ ~250 reports; paginated tables; audit logs</li>
            </ul>
            <div style={{ marginTop: 6, padding: 8, borderRadius: radii.md, background: palette.primarySoft, color: palette.primaryStrong, fontWeight: 700 }}>Exit: Health checks + metrics wired; audit log enabled</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: palette.text }}>Governance & Handover</div>
            <ul style={{ margin: '4px 0 0', paddingLeft: 16, color: palette.muted, fontSize: 13 }}>
              <li>Playbook export (catalog + matrix + graph snapshot)</li>
              <li>Jira/ServiceNow linkbacks for ownership and approvals</li>
              <li>Executive-ready summary with KPIs and migration intents</li>
            </ul>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: palette.text }}>Risks & Guards</div>
            <ul style={{ margin: '4px 0 0', paddingLeft: 16, color: palette.muted, fontSize: 13 }}>
              <li>Access delays → pre-approved creds, sandbox extracts</li>
              <li>Incomplete logs → fallback exports, data quality checks</li>
              <li>Low confidence → business validation loop, overrides logged</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, boxShadow: shadow }}>
        <h4 style={{ margin: '0 0 8px', color: palette.text }}>User Management</h4>
        <div style={{ display: 'grid', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700, color: palette.text }}>Classification & Paths</div>
            <ul style={{ margin: '4px 0 0', paddingLeft: 16, color: palette.muted, fontSize: 13 }}>
              <li>8 weighted criteria (1-5) with adjustable weights; warning if total ≠ 100</li>
              <li>Status: Needed / Redundant / Deprecated with confidence + rationale</li>
              <li>Paths: S/4HANA Embedded Analytics, SAP Datasphere / BDC, Databricks, SAP BW HANA Cloud, Retain, Retire; migration matrix</li>
            </ul>
            <div style={{ marginTop: 6, padding: 8, borderRadius: radii.md, background: palette.bg, color: palette.text, fontSize: 12 }}>Exit: Classification run completed; business validation round recorded</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: palette.text }}>Milestones</div>
            <ol style={{ margin: '4px 0 0', paddingLeft: 18, color: palette.muted, fontSize: 13 }}>
              <li>W1: Access + ingestion baseline + schema</li>
              <li>W2: Graph + catalog + dashboard KPIs</li>
              <li>W3: Classification + matrix + rationale surfacing</li>
              <li>W4: Exports + RBAC + audit + executive readout</li>
            </ol>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: palette.text }}>Enablement & Ownership</div>
            <ul style={{ margin: '4px 0 0', paddingLeft: 16, color: palette.muted, fontSize: 13 }}>
              <li>Assign report owners/reviewers; collect uploads by stage</li>
              <li>Business validation loop with overrides logged</li>
              <li>Executive-ready summary for sign-off</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </Section>
);

const DemoWalkthrough = () => (
  <Section title="Demo Walkthrough" subtitle="Step-by-step storyline to demo the full experience">
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, alignItems: 'stretch' }}>
      <div style={{ ...cardStyle, border: `1px solid \${palette.border}`, boxShadow: shadow }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h4 style={{ margin: 0, color: palette.text }}>Live Demo Flow (8-10 mins)</h4>
          <span style={{ padding: '4px 8px', borderRadius: radii.sm, background: palette.primarySoft, color: palette.primaryStrong, fontWeight: 700 }}>Script</span>
        </div>
        <ol style={{ margin: 0, paddingLeft: 18, color: palette.muted, fontSize: 13, lineHeight: 1.6 }}>
          <li>Login as admin to show basic RBAC.</li>
          <li>Dashboard: explain KPIs, source mix, path mix, readiness bar.</li>
          <li>Criteria: adjust weights and re-run classification to show warnings when total ≠ 100.</li>
          <li>Catalog: search/filter reports, open a report to show criteria scores and rationale.</li>
          <li>Graph: switch statuses, click nodes to show lineage context and signals.</li>
          <li>Matrix: highlight source-to-target counts, executive/risk/action callouts.</li>
          <li>Plan: show phased delivery, exits, and governance hooks.</li>
        </ol>
      </div>
      <div style={{ ...cardStyle, border: `1px solid \${palette.border}`, boxShadow: shadow }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, color: palette.text }}>Short Video / Slides</h4>
          <span style={{ padding: '4px 8px', borderRadius: radii.sm, background: palette.bg, color: palette.muted, fontWeight: 700 }}>2-3 mins</span>
        </div>
        <div style={{ marginTop: 10, borderRadius: radii.md, overflow: 'hidden', border: `1px dashed \${palette.border}`, background: palette.bg, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.muted, textAlign: 'center', padding: 12 }}>
          Embed your MP4 or YouTube link here. Recommended: 90s overview of problem, criteria, demo highlights, and outcomes.
        </div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          <a href="https://www.youtube.com/embed/placeholder" target="_blank" rel="noreferrer" style={{ color: palette.primary, fontWeight: 700 }}>Open video in new tab</a>
          <a href="https://example.com/datanext-demo-walkthrough.pdf" target="_blank" rel="noreferrer" style={{ color: palette.primary, fontWeight: 700 }}>Download slides (PDF)</a>
          <span style={{ color: palette.muted }}>Tip: keep slides to 6-8 pages with the same sequence as the live demo.</span>
        </div>
      </div>
    </div>
    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
      <div style={{ ...cardStyle, border: `1px solid \${palette.border}` }}>
        <div style={{ fontWeight: 700, color: palette.text }}>Speaker Notes</div>
        <ul style={{ margin: '6px 0 0', paddingLeft: 16, color: palette.muted, fontSize: 13, lineHeight: 1.6 }}>
          <li>Frame business context: S/4HANA migration, rationalization goals.</li>
          <li>Call out decision criteria and how they map to paths.</li>
          <li>Show one example report end-to-end (catalog → graph → matrix).</li>
          <li>Close with plan, risks, and next approvals.</li>
        </ul>
      </div>
      <div style={{ ...cardStyle, border: `1px solid \${palette.border}` }}>
        <div style={{ fontWeight: 700, color: palette.text }}>Environment Checklist</div>
        <ul style={{ margin: '6px 0 0', paddingLeft: 16, color: palette.muted, fontSize: 13, lineHeight: 1.6 }}>
          <li>Demo user: admin/admin (or update to client SSO).</li>
          <li>Dataset: at least 200 sample reports with mixed sources.</li>
          <li>Ensure classification spinner visible (Run Classification).</li>
          <li>Matrix and graph render within 2 seconds locally.</li>
        </ul>
      </div>
      <div style={{ ...cardStyle, border: `1px solid \${palette.border}` }}>
        <div style={{ fontWeight: 700, color: palette.text }}>What to Highlight</div>
        <ul style={{ margin: '6px 0 0', paddingLeft: 16, color: palette.muted, fontSize: 13, lineHeight: 1.6 }}>
          <li>Traceability: criteria weights, scores, migration path.</li>
          <li>Actionability: risk hotspots, action queue, path counts.</li>
          <li>Governance: owners, refresh, rationale, validation points.</li>
          <li>Extensibility: connectors, APIs, export options.</li>
        </ul>
      </div>
    </div>
  </Section>
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
    border: primary ? 'none' : `1px solid \${palette.border}`,
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
          const inputId = `kb-upload-\${step.id}`;
          return (
            <div
              key={step.id}
              style={{
                ...cardStyle,
                border: `1px solid \${palette.border}`,
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
                    style={{ ...buttonStyle(true), minWidth: 88, justifyContent: 'center', padding: '6px 8px', whiteSpace: 'nowrap' }}
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
                  {uploads[step.id] ? `Uploaded: \${uploads[step.id]}` : 'No file yet'}
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

const KnowledgeBaseNodes = ({ functionalAreas }) => {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = React.useRef(null);

  const width = 1100;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;

  // Define node categories based on the KG document
  const nodeCategories = {
    core: {
      label: 'Knowledge\nGraph',
      color: palette.primary,
      size: 45,
      pos: { x: centerX, y: centerY },
      description: 'Central hub connecting all entities in the SAP migration knowledge base'
    },
    systems: [
      { 
        id: 'ecc', 
        label: 'SAP ECC', 
        type: 'ERP', 
        color: '#F59E0B', 
        icon: '🏢',
        description: 'Legacy SAP ECC tables and structures (VBAK, VBAP, BSEG, MSEG)',
        entities: 156
      },
      { 
        id: 'bw', 
        label: 'SAP BW', 
        type: 'DWH', 
        color: '#3B82F6', 
        icon: '📊',
        description: 'BW InfoProviders, ADSOs, CompositeProviders, and transformations',
        entities: 89
      },
      { 
        id: 'dbx', 
        label: 'Databricks', 
        type: 'Lakehouse', 
        color: '#8B5CF6', 
        icon: '⚡',
        description: 'Databricks tables, views, and Spark transformation jobs',
        entities: 67
      }
    ],
    reporting: [
      { 
        id: 'report', 
        label: 'Reports', 
        icon: '📄', 
        color: '#10B981',
        description: 'Business-facing reports across all functional areas',
        entities: 234,
        relationships: ['SOURCES_FROM DataObject', 'HAS_METRIC Metric', 'DOCUMENTED_BY Document']
      },
      { 
        id: 'metric', 
        label: 'Metrics/KPIs', 
        icon: '📈', 
        color: '#EC4899',
        description: 'Key performance indicators and calculated metrics',
        entities: 187,
        relationships: ['DERIVED_BY BusinessRule', 'STANDARDIZED_BY GlossaryTerm']
      },
      { 
        id: 'dimension', 
        label: 'Dimensions', 
        icon: '🔢', 
        color: '#6366F1',
        description: 'Dimensional attributes like Plant, Customer, Material, Time',
        entities: 45,
        relationships: ['USED_IN Report', 'SOURCED_FROM DataObject']
      }
    ],
    data: [
      { 
        id: 'dataobj', 
        label: 'Data Objects', 
        icon: '🗃️', 
        color: '#14B8A6',
        description: 'Tables, views, InfoProviders across all source systems',
        entities: 312,
        relationships: ['HOSTED_IN System', 'HAS_COLUMN DataColumn']
      },
      { 
        id: 'column', 
        label: 'Data Columns', 
        icon: '📋', 
        color: '#8B5CF6',
        description: 'Individual fields and attributes within data objects',
        entities: 1847,
        relationships: ['BELONGS_TO DataObject', 'USED_BY BusinessRule']
      },
      { 
        id: 'transform', 
        label: 'Transformations', 
        icon: '⚙️', 
        color: '#F97316',
        description: 'ETL/ELT processes, BW transformations, Spark jobs',
        entities: 156,
        relationships: ['READS_FROM DataObject', 'WRITES_TO DataObject']
      }
    ],
    semantics: [
      { 
        id: 'rule', 
        label: 'Business Rules', 
        icon: '📐', 
        color: '#EF4444',
        description: 'Business logic definitions and calculation rules',
        entities: 203,
        relationships: ['USES_COLUMN DataColumn', 'DEFINES Metric', 'DOCUMENTED_BY Document']
      },
      { 
        id: 'calc', 
        label: 'Calculations', 
        icon: '🧮', 
        color: '#06B6D4',
        description: 'Formula representations and computational logic',
        entities: 178,
        relationships: ['PART_OF BusinessRule', 'USES DataColumn']
      },
      { 
        id: 'glossary', 
        label: 'Glossary Terms', 
        icon: '📖', 
        color: '#84CC16',
        description: 'Standardized business terminology and definitions',
        entities: 134,
        relationships: ['STANDARDIZES Metric', 'DEFINES_CONCEPT BusinessRule']
      }
    ],
    documentation: [
      { 
        id: 'docs', 
        label: 'Documents', 
        icon: '📑', 
        color: '#A855F7',
        description: 'Design docs, specifications, BRD/TRD, schemas',
        entities: 267,
        relationships: ['DOCUMENTS Report', 'SPECIFIES_RULE BusinessRule']
      },
      { 
        id: 'test', 
        label: 'Test Cases', 
        icon: '✅', 
        color: '#22C55E',
        description: 'Validation queries, reconciliation checks, QA tests',
        entities: 189,
        relationships: ['VALIDATES_METRIC Metric', 'TESTS Report']
      },
      { 
        id: 'owner', 
        label: 'Owners', 
        icon: '👤', 
        color: '#F472B6',
        description: 'Business and IT ownership assignments',
        entities: 78,
        relationships: ['OWNS Report', 'RESPONSIBLE_FOR BusinessRule']
      }
    ]
  };

  // Calculate positions in rings
  const getRingPosition = (categoryIndex, itemIndex, totalInCategory, ringRadius) => {
    const angle = (itemIndex / totalInCategory) * Math.PI * 2 - Math.PI / 2 + (categoryIndex * 0.3);
    return {
      x: centerX + Math.cos(angle) * ringRadius,
      y: centerY + Math.sin(angle) * ringRadius
    };
  };

  // Define rings
  const rings = [
    { items: nodeCategories.systems, radius: 140, label: 'Systems & Platform', color: '#F59E0B' },
    { items: nodeCategories.reporting, radius: 220, label: 'Reporting Layer', color: '#10B981' },
    { items: nodeCategories.data, radius: 300, label: 'Data & Lineage', color: '#14B8A6' },
    { items: nodeCategories.semantics, radius: 380, label: 'Semantics & Logic', color: '#EF4444' },
    { items: nodeCategories.documentation, radius: 460, label: 'Process & Governance', color: '#A855F7' }
  ];

  // Generate connections based on KG relationships
  const generateConnections = () => {
    const connections = [];
    rings.forEach((ring, ringIdx) => {
      ring.items.forEach((item, itemIdx) => {
        const pos = getRingPosition(ringIdx, itemIdx, ring.items.length, ring.radius);
        // Connect to center
        connections.push({
          from: { x: centerX, y: centerY },
          to: pos,
          type: 'core',
          opacity: 0.15,
          source: 'core',
          target: item.id
        });
        
        // Connect to next item in ring
        if (itemIdx < ring.items.length - 1) {
          const nextPos = getRingPosition(ringIdx, itemIdx + 1, ring.items.length, ring.radius);
          connections.push({
            from: pos,
            to: nextPos,
            type: 'lateral',
            opacity: 0.08,
            source: item.id,
            target: ring.items[itemIdx + 1].id
          });
        }

        // Connect to inner ring
        if (ringIdx > 0) {
          const innerRing = rings[ringIdx - 1];
          const innerPos = getRingPosition(ringIdx - 1, itemIdx % innerRing.items.length, innerRing.items.length, innerRing.radius);
          connections.push({
            from: pos,
            to: innerPos,
            type: 'hierarchy',
            opacity: 0.1,
            source: item.id,
            target: innerRing.items[itemIdx % innerRing.items.length].id
          });
        }
      });
    });
    return connections;
  };

  const connections = generateConnections();

  // Handle mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(0.3, zoom + delta), 4);
    setZoom(newZoom);
  };

  // Handle pan start
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // Handle pan move
  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  // Handle pan end
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset view
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  // Zoom to fit
  const zoomToFit = () => {
    setZoom(0.8);
    setPan({ x: 0, y: 0 });
  };

  // Get highlighted connections
  const getHighlightedConnections = () => {
    if (!hoveredNode && !selectedNode) return [];
    const nodeId = selectedNode || hoveredNode;
    return connections.filter(c => c.source === nodeId || c.target === nodeId);
  };

  const highlightedConnections = getHighlightedConnections();

  // Calculate scaled dimensions
  const scaledWidth = width * zoom;
  const scaledHeight = height * zoom;

  return (
    <Section title="Knowledge Graph Architecture" subtitle="Interactive node types and relationships - Zoom with scroll, drag to pan, click nodes for details">
      <div 
        style={{ 
          position: 'relative', 
          background: palette.bg, 
          borderRadius: radii.lg, 
          border: `1px solid \${palette.border}`, 
          overflow: 'hidden'
        }}
      >
        
        {/* Controls */}
        <div style={{ 
          position: 'absolute', 
          top: 16, 
          right: 16, 
          zIndex: 10, 
          display: 'flex', 
          gap: 8,
          flexWrap: 'wrap',
          maxWidth: 300
        }}>
          <button
            onClick={() => setZoom(Math.min(zoom + 0.25, 4))}
            style={{
              padding: '8px 12px',
              background: palette.surface,
              border: `1px solid \${palette.border}`,
              borderRadius: radii.md,
              cursor: 'pointer',
              fontWeight: 700,
              color: palette.text,
              fontSize: 16
            }}
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => setZoom(Math.max(zoom - 0.25, 0.3))}
            style={{
              padding: '8px 12px',
              background: palette.surface,
              border: `1px solid \${palette.border}`,
              borderRadius: radii.md,
              cursor: 'pointer',
              fontWeight: 700,
              color: palette.text,
              fontSize: 16
            }}
            title="Zoom Out"
          >
            −
          </button>
          <button
            onClick={zoomToFit}
            style={{
              padding: '8px 12px',
              background: palette.surface,
              border: `1px solid \${palette.border}`,
              borderRadius: radii.md,
              cursor: 'pointer',
              fontWeight: 700,
              color: palette.text,
              fontSize: 12
            }}
            title="Fit to View"
          >
            Fit
          </button>
          <button
            onClick={resetView}
            style={{
              padding: '8px 12px',
              background: palette.surface,
              border: `1px solid \${palette.border}`,
              borderRadius: radii.md,
              cursor: 'pointer',
              fontWeight: 700,
              color: palette.text,
              fontSize: 12
            }}
            title="Reset View"
          >
            Reset
          </button>
          <div style={{
            padding: '8px 12px',
            background: palette.primarySoft,
            border: `1px solid \${palette.primary}`,
            borderRadius: radii.md,
            fontWeight: 700,
            color: palette.primaryStrong,
            fontSize: 13,
            minWidth: 60,
            textAlign: 'center'
          }}>
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Scrollable SVG Container */}
        <div 
          ref={containerRef}
          style={{ 
            width: '100%',
            height: 550,
            overflow: 'auto',
            cursor: isDragging ? 'grabbing' : 'grab',
            position: 'relative',
            background: `linear-gradient(135deg, \${palette.bg} 0%, \${palette.surface} 100%)`
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            style={{
              width: Math.max(scaledWidth, width),
              height: Math.max(scaledHeight, height),
              position: 'relative',
              transform: `translate(\${pan.x}px, \${pan.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            <svg 
              width={scaledWidth} 
              height={scaledHeight} 
              viewBox={`0 0 \${width} \${height}`}
              style={{
                display: 'block'
              }}
            >
              <defs>
                <radialGradient id="kg-architecture-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={palette.primary} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={palette.primary} stopOpacity="0" />
                </radialGradient>
                <filter id="node-shadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
                </filter>
                <filter id="node-glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Background glow */}
              <circle cx={centerX} cy={centerY} r="480" fill="url(#kg-architecture-glow)" />

              {/* Ring labels background arcs */}
              {rings.map((ring, idx) => (
                <g key={`ring-\${idx}`}>
                  <circle 
                    cx={centerX} 
                    cy={centerY} 
                    r={ring.radius} 
                    fill="none" 
                    stroke={ring.color} 
                    strokeWidth="1" 
                    strokeDasharray="4 4" 
                    opacity="0.2"
                  />
                </g>
              ))}

              {/* Connections - normal */}
              {connections.map((conn, idx) => {
                const isHighlighted = highlightedConnections.some(hc => 
                  hc.source === conn.source && hc.target === conn.target
                );
                return (
                  <line
                    key={`conn-\${idx}`}
                    x1={conn.from.x}
                    y1={conn.from.y}
                    x2={conn.to.x}
                    y2={conn.to.y}
                    stroke={isHighlighted ? palette.primary : (conn.type === 'core' ? palette.primary : palette.border)}
                    strokeWidth={isHighlighted ? 2.5 : (conn.type === 'core' ? 1.5 : 1)}
                    opacity={isHighlighted ? 0.8 : conn.opacity}
                    style={{ transition: 'all 0.2s ease' }}
                  />
                );
              })}

              {/* Center node */}
              <g
                onMouseEnter={() => setHoveredNode('core')}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(selectedNode === 'core' ? null : 'core');
                }}
                style={{ cursor: 'pointer' }}
              >
                <circle 
                  cx={centerX} 
                  cy={centerY} 
                  r={nodeCategories.core.size} 
                  fill={nodeCategories.core.color} 
                  filter={hoveredNode === 'core' || selectedNode === 'core' ? "url(#node-glow)" : "url(#node-shadow)"}
                  opacity={hoveredNode === 'core' || selectedNode === 'core' ? 1 : 0.9}
                  style={{ transition: 'all 0.2s ease' }}
                />
                <text 
                  x={centerX} 
                  y={centerY - 5} 
                  textAnchor="middle" 
                  fill="white" 
                  fontSize="13" 
                  fontWeight="700"
                  pointerEvents="none"
                >
                  Knowledge
                </text>
                <text 
                  x={centerX} 
                  y={centerY + 10} 
                  textAnchor="middle" 
                  fill="white" 
                  fontSize="13" 
                  fontWeight="700"
                  pointerEvents="none"
                >
                  Graph
                </text>
              </g>

              {/* Ring nodes */}
              {rings.map((ring, ringIdx) => (
                <g key={`ring-nodes-\${ringIdx}`}>
                  {ring.items.map((item, itemIdx) => {
                    const pos = getRingPosition(ringIdx, itemIdx, ring.items.length, ring.radius);
                    const nodeSize = 32;
                    const isHovered = hoveredNode === item.id;
                    const isSelected = selectedNode === item.id;
                    
                    return (
                      <g 
                        key={item.id} 
                        onMouseEnter={() => setHoveredNode(item.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNode(isSelected ? null : item.id);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={isHovered || isSelected ? nodeSize + 4 : nodeSize}
                          fill={palette.surface}
                          stroke={item.color}
                          strokeWidth={isHovered || isSelected ? 3.5 : 2.5}
                          filter={isHovered || isSelected ? "url(#node-glow)" : "url(#node-shadow)"}
                          style={{ transition: 'all 0.2s ease' }}
                        />
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={nodeSize - 5}
                          fill={`\${item.color}\${isHovered || isSelected ? '40' : '20'}`}
                          style={{ transition: 'all 0.2s ease' }}
                          pointerEvents="none"
                        />
                        <text
                          x={pos.x}
                          y={pos.y + 5}
                          textAnchor="middle"
                          fontSize={isHovered || isSelected ? 22 : 18}
                          style={{ transition: 'all 0.2s ease' }}
                          pointerEvents="none"
                        >
                          {item.icon}
                        </text>
                        <text
                          x={pos.x}
                          y={pos.y + nodeSize + 18}
                          textAnchor="middle"
                          fill={palette.text}
                          fontSize={isHovered || isSelected ? 12 : 11}
                          fontWeight={isHovered || isSelected ? 700 : 600}
                          style={{ transition: 'all 0.2s ease' }}
                          pointerEvents="none"
                        >
                          {item.label}
                        </text>
                        {item.type && (
                          <text
                            x={pos.x}
                            y={pos.y + nodeSize + 32}
                            textAnchor="middle"
                            fill={palette.muted}
                            fontSize="9"
                            pointerEvents="none"
                          >
                            {item.type}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              ))}

              {/* Ring labels */}
              {rings.map((ring, idx) => {
                const labelAngle = Math.PI / 4;
                const labelX = centerX + Math.cos(labelAngle) * (ring.radius + 25);
                const labelY = centerY + Math.sin(labelAngle) * (ring.radius + 25);
                
                return (
                  <g key={`ring-label-\${idx}`}>
                    <rect
                      x={labelX - 70}
                      y={labelY - 12}
                      width="140"
                      height="24"
                      fill={palette.surface}
                      rx="6"
                      opacity="0.95"
                      stroke={ring.color}
                      strokeWidth="2"
                    />
                    <text
                      x={labelX}
                      y={labelY + 5}
                      textAnchor="middle"
                      fill={ring.color}
                      fontSize="11"
                      fontWeight="700"
                    >
                      {ring.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Tooltip / Detail Panel */}
        {(hoveredNode || selectedNode) && (
          <div style={{
            position: 'absolute',
            top: 16,
            left: 16,
            maxWidth: 360,
            background: palette.surface,
            border: `2px solid \${palette.primary}`,
            borderRadius: radii.lg,
            padding: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 20,
            maxHeight: 400,
            overflowY: 'auto'
          }}>
            {(() => {
              const nodeId = selectedNode || hoveredNode;
              let nodeData;
              
              if (nodeId === 'core') {
                nodeData = nodeCategories.core;
              } else {
                // Find in rings
                for (const ring of rings) {
                  const found = ring.items.find(item => item.id === nodeId);
                  if (found) {
                    nodeData = found;
                    break;
                  }
                }
              }

              if (!nodeData) return null;

              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: `\${nodeData.color}20`,
                      border: `2px solid \${nodeData.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      flexShrink: 0
                    }}>
                      {nodeData.icon || '🔷'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: palette.text, fontSize: 16 }}>
                        {nodeData.label}
                      </div>
                      {nodeData.type && (
                        <div style={{ color: palette.muted, fontSize: 12, fontWeight: 600 }}>
                          {nodeData.type}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ color: palette.muted, fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
                    {nodeData.description}
                  </div>

                  {nodeData.entities && (
                    <div style={{
                      padding: '8px 12px',
                      background: palette.bg,
                      borderRadius: radii.md,
                      marginBottom: 8
                    }}>
                      <div style={{ fontSize: 11, color: palette.muted, fontWeight: 600 }}>ENTITIES</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: nodeData.color }}>
                        {nodeData.entities.toLocaleString()}
                      </div>
                    </div>
                  )}

                  {nodeData.relationships && (
                    <div>
                      <div style={{ fontSize: 11, color: palette.muted, fontWeight: 700, marginBottom: 6 }}>
                        KEY RELATIONSHIPS
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {nodeData.relationships.map((rel, idx) => (
                          <div key={idx} style={{
                            fontSize: 11,
                            color: palette.text,
                            background: palette.bg,
                            padding: '4px 8px',
                            borderRadius: radii.sm,
                            fontFamily: 'monospace'
                          }}>
                            → {rel}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Instructions hint */}
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          padding: '8px 12px',
          background: `\${palette.surface}ee`,
          borderRadius: radii.md,
          fontSize: 11,
          color: palette.muted,
          border: `1px solid \${palette.border}`,
          zIndex: 10
        }}>
        </div>

        {/* Legend and relationship details */}
        <div style={{ 
          padding: '16px 20px', 
          borderTop: `1px solid \${palette.border}`, 
          background: palette.surface,
          maxHeight: 300,
          overflowY: 'auto'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            
            {/* Node Types Legend */}
            <div>
              <div style={{ fontWeight: 700, color: palette.text, marginBottom: 10, fontSize: 13 }}>Core Node Types</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {Object.entries(nodeCategories).filter(([key]) => key !== 'core').map(([category, items]) => (
                  <div key={category}>
                    <div style={{ fontSize: 11, color: palette.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                      {category}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {items.map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedNode(item.id)}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 6, 
                            padding: '4px 10px', 
                            borderRadius: radii.sm, 
                            border: `1px solid \${item.color}40`,
                            background: selectedNode === item.id ? `\${item.color}30` : `\${item.color}15`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = `\${item.color}30`}
                          onMouseLeave={(e) => {
                            if (selectedNode !== item.id) {
                              e.currentTarget.style.background = `\${item.color}15`;
                            }
                          }}
                        >
                          <span style={{ fontSize: 14 }}>{item.icon}</span>
                          <span style={{ fontSize: 11, color: palette.text, fontWeight: 600 }}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Relationships */}
            <div>
              <div style={{ fontWeight: 700, color: palette.text, marginBottom: 10, fontSize: 13 }}>Key Relationships</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: palette.muted }}>
                {[
                  'Report -[:SOURCES_FROM]→ DataObject',
                  'Report -[:HAS_METRIC]→ Metric',
                  'Metric -[:DERIVED_BY]→ BusinessRule',
                  'BusinessRule -[:USES_COLUMN]→ DataColumn',
                  'DataColumn -[:BELONGS_TO]→ DataObject',
                  'DataObject -[:HOSTED_IN]→ System',
                  'Report -[:TESTED_BY]→ TestCase',
                  'Report -[:DOCUMENTED_BY]→ Document'
                ].map((rel, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: palette.primary }}>→</span>
                    <code style={{ background: palette.bg, padding: '2px 6px', borderRadius: radii.sm, fontSize: 11 }}>
                      {rel}
                    </code>
                  </div>
                ))}
              </div>
            </div>

            {/* Example Queries */}
            <div>
              <div style={{ fontWeight: 700, color: palette.text, marginBottom: 10, fontSize: 13 }}>Example KG Queries</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: palette.muted, fontSize: 12, lineHeight: 1.7 }}>
                <li>Which reports depend on VBAP table?</li>
                <li>What is the lineage from "Net Sales" KPI to source system?</li>
                <li>Which business rules are reused across Sales and Finance?</li>
                <li>Find calculation inconsistencies across functional areas</li>
                <li>Which reports lack test coverage?</li>
                <li>Map all BW objects to Databricks equivalents</li>
              </ul>
            </div>

          </div>
        </div>

        {/* Functional Area Coverage */}
        <div style={{ 
          padding: '16px 20px', 
          borderTop: `1px solid \${palette.border}`, 
          background: palette.bg, 
          maxHeight: 220, 
          overflowY: 'auto' 
        }}>
          <div style={{ fontWeight: 700, color: palette.text, marginBottom: 12, fontSize: 13 }}>Functional Area Coverage</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {functionalAreas.map(area => {
              const initials = area.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
              const reportCount = Math.floor(Math.random() * 30) + 10; // Mock data
              
              return (
                <div 
                  key={area} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 10, 
                    padding: '8px 14px', 
                    borderRadius: radii.md, 
                    border: `1px solid \${palette.border}`, 
                    background: palette.surface,
                    boxShadow: shadow,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = shadow;
                  }}
                >
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    background: palette.primarySoft, 
                    border: `2px solid \${palette.primary}`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 800, 
                    color: palette.primaryStrong, 
                    fontSize: 11 
                  }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: palette.text, fontSize: 13 }}>{area}</div>
                    <div style={{ color: palette.muted, fontSize: 11 }}>{reportCount} reports · {Math.floor(reportCount * 2.5)} entities</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </Section>
  );
};

const Sidebar = ({ active, setActive }) => {
  const nav = [
    { id: 'catalog', label: 'Inputs' },
    { id: 'graph', label: 'Knowledge Graph' },
    { id: 'dashboard', label: 'Summary' },
    { id: 'criteria', label: 'Decision Framework' },
    { id: 'status', label: 'Status & Migration' },
    { id: 'matrix', label: 'Migration Matrix' },
    { id: 'walkthrough', label: 'Demo Walkthrough' },
    { id: 'plan', label: 'Administration' }
  ];
  return (
    <aside style={{ width: 240, position: 'fixed', top: 0, bottom: 0, left: 0, background: palette.surface, borderRight: `1px solid \${palette.border}`, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: radii.md, background: palette.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>DN</div>
        <div>
          <div style={{ fontWeight: 800, color: palette.text }}>DataNext</div>
          <div style={{ color: palette.muted, fontSize: 12 }}>S/4HANA Modernization</div>
        </div>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {nav.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: radii.md, border: 'none', cursor: 'pointer', background: active === item.id ? palette.primarySoft : 'transparent', color: active === item.id ? palette.primaryStrong : palette.text, fontWeight: active === item.id ? 700 : 500 }}>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

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
              style={{ padding: '10px 12px', borderRadius: radii.md, border: `1px solid \${palette.border}`, fontSize: 14 }}
            />
            <input
              type="password"
              value={auth.pass}
              onChange={e => setAuth(prev => ({ ...prev, pass: e.target.value }))}
              placeholder="Password"
              style={{ padding: '10px 12px', borderRadius: radii.md, border: `1px solid \${palette.border}`, fontSize: 14 }}
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
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } * { box-sizing: border-box; } h1,h2,h3,h4,h5,h6 { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; } p,div,span,button,input,select { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }`}</style>
      <Sidebar active={activeView} setActive={setActiveView} />
      <main style={{ marginLeft: 260, padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>
              {activeView === 'dashboard' && 'Analytics Rationalization Dashboard'}
              {activeView === 'catalog' && 'Inputs'}
              {activeView === 'criteria' && 'Decision Criteria Framework'}
              {activeView === 'status' && 'Status & Migration'}
              {activeView === 'graph' && 'Knowledge Graph Explorer'}
              {activeView === 'matrix' && 'Migration Recommendation Matrix'}
              {activeView === 'walkthrough' && 'Demo Walkthrough'}
              {activeView === 'plan' && 'Administration'}
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
                <div style={{ ...cardStyle, border: `1px solid \${palette.border}` }}>
                  <div style={{ fontWeight: 700, color: palette.text, marginBottom: 8 }}>Migration Readiness</div>
                  <div style={{ height: 12, background: palette.bg, borderRadius: radii.sm, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round(stats.retain / stats.total * 100)}%`, height: '100%', background: palette.primary }} />
                  </div>
                  <div style={{ marginTop: 6, color: palette.muted, fontSize: 13 }}>{Math.round(stats.retain / stats.total * 100)}% retain, {Math.round(stats.retire / stats.total * 100)}% retire</div>
                </div>
                <div style={{ ...cardStyle, border: `1px solid \${palette.border}` }}>
                  <div style={{ fontWeight: 700, color: palette.text, marginBottom: 8 }}>Source Composition</div>
                  {Object.entries(stats.bySource).map(([src, count]) => (
                    <div key={src} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: palette.muted }}>
                        <span>{src}</span>
                        <span style={{ color: palette.primaryStrong, fontWeight: 700 }}>{count}</span>
                      </div>
                      <div style={{ height: 8, background: palette.bg, borderRadius: radii.sm }}>
                        <div style={{ width: `\${(count / stats.total) * 100}%`, height: '100%', background: src === 'SAP ABAP' ? '#F59E0B' : src === 'SAP BW' ? '#3B82F6' : palette.accentPurple, borderRadius: radii.sm }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ ...cardStyle, border: `1px solid \${palette.border}` }}>
                  <div style={{ fontWeight: 700, color: palette.text, marginBottom: 8 }}>Path Mix</div>
                  {Object.entries(stats.byPath).map(([path, count]) => (
                    <div key={path} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: palette.muted }}>
                        <span>{path}</span>
                        <span style={{ color: pathColors[path], fontWeight: 700 }}>{count}</span>
                      </div>
                      <div style={{ height: 8, background: palette.bg, borderRadius: radii.sm }}>
                        <div style={{ width: `\${(count / stats.total) * 100}%`, height: '100%', background: pathColors[path], borderRadius: radii.sm }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              <Section title="Reports by Source" subtitle="Volume split across legacy systems">
                {Object.entries(stats.bySource).map(([source, count]) => (
                  <div key={source} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600 }}>{source}</span>
                      <span style={{ fontWeight: 700, color: palette.primary }}>{count}</span>
                    </div>
                    <div style={{ height: 8, background: palette.bg, borderRadius: radii.sm }}>
                      <div style={{ width: `\${(count / stats.total) * 100}%`, height: '100%', background: source === 'SAP ABAP' ? '#F59E0B' : source === 'SAP BW' ? '#3B82F6' : palette.accentPurple, borderRadius: radii.sm }} />
                    </div>
                  </div>
                ))}
              </Section>
              <Section title="Migration Path Summary" subtitle="Recommended landing by decision criteria">
                {Object.entries(stats.byPath).map(([path, count]) => (
                  <div key={path} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600 }}>{path}</span>
                      <span style={{ fontWeight: 700, color: palette.primary }}>{count}</span>
                    </div>
                    <div style={{ height: 8, background: palette.bg, borderRadius: radii.sm }}>
                      <div style={{ width: `\${(count / stats.total) * 100}%`, height: '100%', background: pathColors[path] || palette.primary, borderRadius: radii.sm }} />
                    </div>
                  </div>
                ))}
              </Section>
            </div>
            <Section title="Knowledge Graph Overview" subtitle="Lineage and dependency view across BW, ABAP, and Databricks">
              <KnowledgeGraph reports={seedReports} filter="All" onNodeClick={setSelectedReport} isClassifying={isClassifying} />
            </Section>
            <KnowledgeBaseFlow />
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
                    <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '6px 12px', borderRadius: radii.md, border: `1px solid \${statusFilter === s ? palette.primary : palette.border}`, background: statusFilter === s ? palette.primarySoft : palette.surface, color: statusFilter === s ? palette.primaryStrong : palette.text, cursor: 'pointer' }}>
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
                  <div style={{ ...cardStyle, border: `1px solid \${palette.border}` }}>
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
                            <div style={{ width: `\${80 + idx * 4}%`, height: '100%', background: palette.primary, borderRadius: radii.sm }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ ...cardStyle, border: `1px solid \${palette.border}` }}>
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
                  <div style={{ ...cardStyle, border: `1px solid \${palette.border}` }}>
                    <div style={{ fontWeight: 700, color: palette.text }}>Top Signals</div>
                    <ul style={{ margin: 0, paddingLeft: 16, color: palette.muted, fontSize: 13 }}>
                      <li>Highlight high-usage, multi-source reports for BDC rebuild</li>
                      <li>Flag unused greater than 180 days for retirement validation</li>
                      <li>Show AI/ML readiness for Databricks candidates</li>
                    </ul>
                  </div>
                  <div style={{ ...cardStyle, border: `1px solid \${palette.border}` }}>
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
          <>
            <Section title="Source to Target Migration Matrix" subtitle="Counts by legacy source and recommended path">
              <MigrationMatrix reports={seedReports} />
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                <div style={{ ...cardStyle, border: `1px solid \${palette.border}` }}>
                  <div style={{ fontWeight: 700, color: palette.text }}>Executive Summary</div>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 16, color: palette.muted, fontSize: 13, lineHeight: 1.6 }}>
                    <li>{stats.byPath['S/4HANA Embedded Analytics']} to S/4HANA Embedded Analytics</li>
                    <li>{stats.byPath['SAP Datasphere / BDC']} to SAP Datasphere / BDC</li>
                    <li>{stats.byPath['Databricks']} to Databricks</li>
                    <li>{stats.byPath['SAP BW HANA Cloud']} to SAP BW HANA Cloud</li>
                    <li>{stats.byPath['Retain']} retained</li>
                    <li>{stats.byPath['Retire']} to Retire</li>
                  </ul>
                </div>
                <div style={{ ...cardStyle, border: `1px solid \${palette.border}` }}>
                  <div style={{ fontWeight: 700, color: palette.text }}>Decision Gates</div>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 16, color: palette.muted, fontSize: 13, lineHeight: 1.6 }}>
                    <li>S/4HANA Embedded Analytics: low complexity + real-time</li>
                    <li>SAP Datasphere / BDC: high reuse + high value</li>
                    <li>Databricks: high AI/ML need or high complexity</li>
                    <li>SAP BW HANA Cloud: BW modernization or reuse-first lift</li>
                    <li>Retire: low value + low reuse + stale usage</li>
                  </ul>
                </div>
                <div style={{ ...cardStyle, border: `1px solid \${palette.border}` }}>
                  <div style={{ fontWeight: 700, color: palette.text }}>Action Playbook</div>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 16, color: palette.muted, fontSize: 13, lineHeight: 1.6 }}>
                    <li>Sequence rebuilds by business criticality and owner availability</li>
                    <li>Pair retirements with governance approval</li>
                    <li>Track velocity: #converted per week, #validated</li>
                  </ul>
                </div>
              </div>
            </Section>
          </>
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
