import { Lead, Activity, Task, User, SheetConfig, SpreadsheetInfo, ConnectedSheet } from '../types';

const STORAGE_KEY_CONFIG = 'vs_crm_sheet_config';
const STORAGE_KEY_USER = 'vs_crm_current_user';

export function extractCleanId(input: string): string {
  if (!input) return '';
  let str = input.trim();
  const match = str.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return str.split('/')[0].split('?')[0].split('#')[0].trim();
}

export const getSavedConfig = (): SheetConfig => {
  const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Migrate legacy config if needed
      if (!parsed.sheets || !Array.isArray(parsed.sheets)) {
        const migratedSheets: ConnectedSheet[] = [];
        if (parsed.sheet1Id) {
          migratedSheets.push({
            id: 'sheet-1',
            name: parsed.sheet1Name || 'Meta Campaign 1',
            spreadsheetId: extractCleanId(parsed.sheet1Id),
            tabName: parsed.sheet1Name || '',
            enabled: true,
            color: 'emerald'
          });
        }
        if (parsed.sheet2Id) {
          migratedSheets.push({
            id: 'sheet-2',
            name: parsed.sheet2Name || 'Meta Campaign 2',
            spreadsheetId: extractCleanId(parsed.sheet2Id),
            tabName: parsed.sheet2Name || '',
            enabled: true,
            color: 'sky'
          });
        }
        parsed.sheets = migratedSheets;
      }
      return parsed;
    } catch {
      // ignore
    }
  }

  return {
    scriptUrl: '',
    sheets: [
      {
        id: 'sheet-1',
        name: 'Meta Campaign 1',
        spreadsheetId: '',
        tabName: '',
        enabled: true,
        color: 'emerald'
      }
    ],
  };
};

export const saveConfig = (config: SheetConfig) => {
  const sanitized = {
    ...config,
    sheets: config.sheets.map((s) => ({
      ...s,
      spreadsheetId: extractCleanId(s.spreadsheetId || ''),
    })),
  };
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(sanitized));
};

export const getSavedUser = (): User | null => {
  const saved = localStorage.getItem(STORAGE_KEY_USER);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return null;
};

export const saveUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY_USER);
  }
};

function cleanScriptUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  url = url.replace(/^["']|["']$/g, '');
  if (url.endsWith('/dev')) {
    url = url.slice(0, -4) + '/exec';
  }
  return url;
}

export async function apiGet(action: string, params: Record<string, string> = {}) {
  const config = getSavedConfig();
  const scriptUrl = cleanScriptUrl(config.scriptUrl || '');

  if (!scriptUrl || !scriptUrl.startsWith('http')) {
    throw new Error('Google Apps Script Web App URL is not configured.');
  }

  const url = new URL(scriptUrl);
  url.searchParams.append('action', action);
  
  // Pass sheets configuration
  if (config.sheets && config.sheets.length > 0) {
    url.searchParams.append('sheets', JSON.stringify(config.sheets));
  }

  Object.entries(params).forEach(([key, val]) => {
    url.searchParams.append(key, val);
  });

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          'Google Apps Script returned 404. In Apps Script, click Deploy > New deployment > Web App with "Who has access: Anyone".'
        );
      }
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status === 'error') {
      throw new Error(data.message || 'Error occurred in Google Apps Script');
    }

    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Network request failed');
  }
}

export async function apiPost(action: string, payload: Record<string, any> = {}) {
  const config = getSavedConfig();
  const scriptUrl = cleanScriptUrl(config.scriptUrl || '');

  if (!scriptUrl || !scriptUrl.startsWith('http')) {
    throw new Error('Google Apps Script Web App URL is not configured.');
  }

  const requestBody = {
    action,
    sheets: config.sheets,
    ...payload,
  };

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status === 'error') {
      throw new Error(data.message || 'Error occurred in Google Apps Script');
    }

    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Network request failed');
  }
}

export async function testConnection(rawScriptUrl: string) {
  const scriptUrl = cleanScriptUrl(rawScriptUrl || '');

  if (!scriptUrl || !scriptUrl.startsWith('http')) {
    throw new Error('Invalid URL. Please enter the full Web App URL.');
  }

  const url = new URL(scriptUrl);
  url.searchParams.append('action', 'ping');

  const response = await fetch(url.toString(), {
    method: 'GET',
    mode: 'cors',
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Connection failed (${response.status}: ${response.statusText})`);
  }

  const data = await response.json();
  return data;
}

export async function testSingleSheet(rawScriptUrl: string, sheetId: string, sheetName: string = '') {
  const scriptUrl = cleanScriptUrl(rawScriptUrl || '');
  if (!scriptUrl || !scriptUrl.startsWith('http')) {
    throw new Error('Please enter your Apps Script Web App URL first.');
  }

  const cleanId = extractCleanId(sheetId);
  const url = new URL(scriptUrl);
  url.searchParams.append('action', 'testSheet');
  if (cleanId) url.searchParams.append('sheetId', cleanId);
  if (sheetName) url.searchParams.append('sheetName', sheetName.trim());

  const response = await fetch(url.toString(), {
    method: 'GET',
    mode: 'cors',
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}`);
  }

  return await response.json();
}

export async function fetchInitialData(): Promise<{
  leads: Lead[];
  users: User[];
  activities: Activity[];
  tasks: Task[];
  sheetCounts?: Record<string, number>;
  diagnostics?: string[];
  spreadsheetInfo?: SpreadsheetInfo;
}> {
  const res = await apiGet('getInitialData');
  return res.data;
}

export async function updateLeadInSheet(lead: Partial<Lead>): Promise<void> {
  await apiPost('updateLead', lead);
}

export async function createLeadInSheet(lead: Partial<Lead>): Promise<void> {
  await apiPost('createLead', lead);
}

export async function logActivityInSheet(activity: Partial<Activity>): Promise<void> {
  await apiPost('logActivity', activity);
}

export async function createTaskInSheet(task: Partial<Task>): Promise<void> {
  await apiPost('createTask', task);
}

export async function updateTaskInSheet(taskId: string, status: 'Pending' | 'Completed'): Promise<void> {
  await apiPost('updateTask', { id: taskId, status });
}

export async function runMasterSetup(): Promise<any> {
  return await apiPost('setupMasterCRM');
}
