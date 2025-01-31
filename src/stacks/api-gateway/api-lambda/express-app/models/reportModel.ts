export const tableName = process.env.BASE_TABLE_NAME;

interface ReportChecklist {
  checklist: {
    [name: string]: number;
  };
}

interface Note {
  note: string;
}

/**
 * @payload only payload should be mutable
 */
export interface Report {
  reportId: string;
  vehicleId: string;
  driverId: string;
  createdAt: number;
  payload: ReportChecklist|Note;
}