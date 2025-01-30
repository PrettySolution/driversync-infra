export const tableName = process.env.BASE_TABLE_NAME;

interface ReportChecklist {
  oil: number;
  brake: number;
  tair: number;
}

export interface Report {
  reportId: string;
  vehicleId: string;
  driverId: string;
  timestamp: number;
  checklist: ReportChecklist;
}

export interface ReportProps {
  vehicleId: string;
  username: string;
}

export interface ReportItem {
  pk: string;
  sk: string;
  data: ReportChecklist;
}