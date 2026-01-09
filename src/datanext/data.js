import { palette } from './theme';

export const decisionCriteria = [
  { id: 1, name: 'Strategic Objectives', shortName: 'S/4HANA Alignment', description: 'Based on the functions e.g. Reimagine Finance', weight: 15, options: ['Core Finance', 'Supply Chain', 'Sales & Distribution', 'HR', 'Manufacturing', 'Procurement'] },
  { id: 2, name: 'Business Value', shortName: 'Strategic Importance', description: 'How critical the reporting is for decision-making, competitive advantage', weight: 20, options: ['Mission Critical', 'High', 'Medium', 'Low', 'Minimal'] },
  { id: 3, name: 'Data Complexity', shortName: 'Heterogeneity', description: 'Mix of SAP sources, non-SAP (e.g., Kinaxis, Salesforce) and transformations', weight: 10, options: ['SAP Only', 'SAP + 1 External', 'Multi-Source', 'Complex Transformations', 'Highly Complex'] },
  { id: 4, name: 'Historical Depth', shortName: 'Archival/Analytics', description: 'Historical data requirement for past several years, planning, advanced analytics', weight: 10, options: ['Current Only', '1 Year', '3 Years', '5+ Years', 'Full History'] },
  { id: 5, name: 'Real-time Requirement', shortName: 'Operational Need', description: 'Business need for near-real-time, batch or transactional speed', weight: 15, options: ['Real-time', 'Near Real-time', 'Hourly', 'Daily Batch', 'Weekly/Monthly'] },
  { id: 6, name: 'Legacy Reuse Potential', shortName: 'Model Reusability', description: 'Existing BW reports/models can be reused or must be re-designed', weight: 10, options: ['Direct Reuse', 'Minor Changes', 'Moderate Redesign', 'Major Redesign', 'Full Rebuild'] },
  { id: 7, name: 'Effort vs Value', shortName: 'Cost/Time to Value', description: 'Effort of migration versus expected value; availability of business/user readiness', weight: 10, options: ['Quick Win', 'Low Effort/High Value', 'Balanced', 'High Effort/High Value', 'High Effort/Low Value'] },
  { id: 8, name: 'Innovation/AI Readiness', shortName: 'Advanced Analytics', description: 'Need for advanced analytics, ML, combining with external data (social, IoT)', weight: 10, options: ['AI/ML Required', 'Predictive Analytics', 'Advanced Reporting', 'Standard Analytics', 'Basic Reporting'] }
];

const reportTypes = ['SAP ABAP', 'SAP BW', 'Databricks'];
const functionalAreas = ['Finance', 'Sales', 'Supply Chain', 'HR', 'Manufacturing', 'Procurement', 'Customer Service', 'Marketing'];
const reportCategories = ['Operational Dashboard', 'KPI Scorecard', 'Management Report', 'Analytical Report', 'Transactional Report', 'Compliance Report'];
const dataSources = {
  'SAP ABAP': ['ACDOCA', 'BKPF/BSEG', 'VBAK/VBAP', 'EKKO/EKPO', 'MARA/MARC', 'PA0001/PA0002'],
  'SAP BW': ['InfoCube', 'DSO', 'CompositeProvider', 'HANA View', 'Open ODS', 'BEx Query'],
  'Databricks': ['Delta Lake', 'Unity Catalog', 'Feature Store', 'MLflow Model', 'Structured Streaming']
};
const businessOwners = ['CFO Office', 'VP Sales', 'COO', 'CHRO', 'VP Supply Chain', 'Controller', 'CMO', 'CIO'];
const refreshFrequencies = ['Real-time', 'Hourly', 'Daily', 'Weekly', 'Monthly'];
const reportNames = [
  'Revenue Analysis', 'Cost Center Report', 'Inventory Status', 'Sales Pipeline', 'Budget Variance', 'Headcount Report', 'Procurement Spend', 'Customer Insights',
  'Product Profitability', 'Cash Flow Analysis', 'Order Fulfillment', 'Vendor Performance', 'Employee Turnover', 'Campaign ROI', 'Logistics Tracking', 'Quality Metrics',
  'Margin Analysis', 'Working Capital', 'DSO Tracking', 'Forecast Accuracy', 'Production Efficiency', 'Supplier Scorecard', 'Territory Performance', 'Churn Analysis'
];

const pathOptions = [
  'S/4HANA Embedded Analytics',
  'SAP Datasphere / BDC',
  'Databricks',
  'SAP BW HANA Cloud'
];

const deriveMigrationPath = ({ compositeScore, criteriaScores, sourceType, idx }) => {
  const businessValue = criteriaScores[2];
  const dataComplexity = criteriaScores[3];
  const realTime = criteriaScores[5];
  const reusePotential = criteriaScores[6];
  const aiReadiness = criteriaScores[8];
  const basePath = pathOptions[idx % pathOptions.length];

  if (businessValue <= 2 && compositeScore < 2) return { path: 'Retire', status: 'Retire', color: palette.warning };
  if (businessValue <= 3 && reusePotential >= 4) return { path: 'Retire', status: 'Retire', color: palette.warning };
  if (reusePotential <= 2) return { path: basePath, status: 'Retain', color: palette.primaryStrong };
  if (realTime <= 2 && dataComplexity <= 2 && sourceType !== 'Databricks') return { path: 'S/4HANA Embedded Analytics', status: 'Retain', color: palette.primary };
  if (aiReadiness <= 2 || dataComplexity >= 4) return { path: 'Databricks', status: 'Retain', color: palette.accentBlue };
  return { path: basePath, status: 'Retain', color: palette.accentPurple };
};

export const generateReportCatalog = () => {
  return Array.from({ length: 250 }, (_, i) => {
    const sourceType = reportTypes[i % reportTypes.length];
    const functionalArea = functionalAreas[i % functionalAreas.length];
    const criteriaScores = {
      1: Math.floor(Math.random() * 5) + 1,
      2: Math.floor(Math.random() * 5) + 1,
      3: Math.floor(Math.random() * 5) + 1,
      4: Math.floor(Math.random() * 5) + 1,
      5: Math.floor(Math.random() * 5) + 1,
      6: Math.floor(Math.random() * 5) + 1,
      7: Math.floor(Math.random() * 5) + 1,
      8: Math.floor(Math.random() * 5) + 1
    };

    const compositeScore = Object.entries(criteriaScores).reduce((sum, [id, score]) => {
      const criteria = decisionCriteria.find(c => c.id === parseInt(id, 10));
      return sum + (score * criteria.weight / 100);
    }, 0);

    const migration = deriveMigrationPath({ compositeScore, criteriaScores, sourceType, idx: i });

    return {
      id: `RPT-${String(i + 1).padStart(4, '0')}`,
      name: `${reportNames[i % reportNames.length]} ${Math.floor(i / reportNames.length) + 1}`,
      sourceType,
      functionalArea,
      category: reportCategories[i % reportCategories.length],
      dataSources: dataSources[sourceType].slice(0, Math.floor(Math.random() * 3) + 1),
      businessOwner: businessOwners[i % businessOwners.length],
      refreshFrequency: refreshFrequencies[Math.floor(Math.random() * refreshFrequencies.length)],
      lastUsed: Math.floor(Math.random() * 365),
      activeUsers: Math.floor(Math.random() * 50) + 1,
      createdYear: 2015 + Math.floor(Math.random() * 8),
      complexity: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
      hasExternalData: Math.random() > 0.7,
      kpiExamples: functionalArea === 'Finance'
        ? ['Revenue', 'EBITDA', 'Working Capital', 'DSO']
        : functionalArea === 'Sales'
        ? ['Pipeline Value', 'Win Rate', 'ASP', 'Quota Attainment']
        : functionalArea === 'Supply Chain'
        ? ['OTIF', 'Inventory Turns', 'Lead Time', 'Fill Rate']
        : ['Efficiency', 'Utilization', 'Quality', 'Throughput'],
      criteriaScores,
      compositeScore: Math.round(compositeScore * 100) / 100,
      migrationPath: migration.path,
      status: migration.status,
      confidence: Math.floor(Math.random() * 20) + 80,
      rationale: `Based on ${decisionCriteria[criteriaScores[2] > 3 ? 1 : 6].name} assessment`,
      color: migration.color
    };
  });
};

export const reports = generateReportCatalog();

export const getStats = (reportList) => {
  const retainStatuses = new Set(['Retain', 'Needed']);
  const retireStatuses = new Set(['Retire', 'Deprecated']);
  const retain = reportList.filter(r => retainStatuses.has(r.status)).length;
  const retire = reportList.filter(r => retireStatuses.has(r.status)).length;

  return {
    total: reportList.length,
    retain,
    retire,
    pending: Math.max(reportList.length - retain - retire, 0),
    bySource: {
      'SAP ABAP': reportList.filter(r => r.sourceType === 'SAP ABAP').length,
      'SAP BW': reportList.filter(r => r.sourceType === 'SAP BW').length,
      'Databricks': reportList.filter(r => r.sourceType === 'Databricks').length
    },
    byPath: {
      'S/4HANA Embedded Analytics': reportList.filter(r => r.migrationPath === 'S/4HANA Embedded Analytics').length,
      'SAP Datasphere / BDC': reportList.filter(r => r.migrationPath === 'SAP Datasphere / BDC').length,
      'Databricks': reportList.filter(r => r.migrationPath === 'Databricks').length,
      'SAP BW HANA Cloud': reportList.filter(r => r.migrationPath === 'SAP BW HANA Cloud').length,
      'Retain': retain,
      'Retire': retire
    }
  };
};
