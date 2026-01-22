interface GoogleSheetsConfig {
  spreadsheetId: string;
  range: string;
  apiKey: string;
}

export interface NVRSheetRow {
  nvr: string;
  location: string;
  district: string;
  onu_ip: string;
  ping_onu: string;
  nvr_ip: string;
  ping_nvr: string;
  hdd_status: string;
  normal_view: string;
  check_login: string;
  camera_count: string;
  date_updated: string;
}

export async function fetchGoogleSheetData(config: GoogleSheetsConfig): Promise<NVRSheetRow[]> {
  const { spreadsheetId, range, apiKey } = config;
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Sheets API error:', errorText);
      throw new Error(`Failed to fetch Google Sheets data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.values || data.values.length === 0) {
      console.log('No data found in Google Sheets');
      return [];
    }
    
    // Skip header row (first row)
    const rows = data.values.slice(1);
    
    // Map to NVR objects
    const nvrData: NVRSheetRow[] = rows.map((row: string[]) => ({
      nvr: row[0] || '',
      location: row[1] || '',
      district: row[2] || '',
      onu_ip: row[3] || '',
      ping_onu: row[4] || 'FALSE',
      nvr_ip: row[5] || '',
      ping_nvr: row[6] || 'FALSE',
      hdd_status: row[7] || 'FALSE',
      normal_view: row[8] || 'FALSE',
      check_login: row[9] || 'FALSE',
      camera_count: row[10] || '0',
      date_updated: row[11] || '',
    }));
    
    return nvrData;
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    throw error;
  }
}

export function transformSheetDataToNVR(sheetData: NVRSheetRow[]) {
  return sheetData.map((row, index) => ({
    id: `${index + 1}`,
    nvr: row.nvr,
    location: row.location,
    district: row.district,
    onu_ip: row.onu_ip,
    ping_onu: row.ping_onu.toUpperCase() === 'TRUE',
    nvr_ip: row.nvr_ip,
    ping_nvr: row.ping_nvr.toUpperCase() === 'TRUE',
    hdd_status: row.hdd_status.toUpperCase() === 'TRUE',
    normal_view: row.normal_view.toUpperCase() === 'TRUE',
    check_login: row.check_login.toUpperCase() === 'TRUE',
    camera_count: parseInt(row.camera_count) || 0,
    date_updated: row.date_updated,
  }));
}
