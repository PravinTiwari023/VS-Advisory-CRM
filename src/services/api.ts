import { Lead, Activity, Task, User, SheetConfig, SpreadsheetInfo, ConnectedSheet } from '../types';

const STORAGE_KEY_CONFIG = 'vs_crm_sheet_config';
const STORAGE_KEY_USER = 'vs_crm_current_user';
export const CURRENT_LATEST_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyUNxbSxgxazp_XoZ4F3az29L_Or3M5Mz36poilP7UBBM8esKLTKPt8pvmY9jT4u4Is/exec';

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
      parsed.scriptUrl = CURRENT_LATEST_SCRIPT_URL;
      
      if (!parsed.sheets || !Array.isArray(parsed.sheets) || parsed.sheets.length === 0) {
        parsed.sheets = [
          {
            id: 'sheet-kanakia',
            name: 'Kanakia',
            spreadsheetId: '1Om_Gjm6Hh6MwXy1zokgG2KIcQoGNg8lcsW4MTj_hI8o',
            tabName: '',
            enabled: true,
            color: 'emerald'
          },
          {
            id: 'sheet-rishabraj',
            name: 'H.Rishabraj',
            spreadsheetId: '1f6ZtbLS5oxDXNjx57FvfBLwJ0Tr30s3R0ip5MwT6nec',
            tabName: '',
            enabled: true,
            color: 'sky'
          }
        ];
      }
      return parsed;
    } catch {
      // ignore
    }
  }

  return {
    scriptUrl: CURRENT_LATEST_SCRIPT_URL,
    sheets: [
      {
        id: 'sheet-kanakia',
        name: 'Kanakia',
        spreadsheetId: '1Om_Gjm6Hh6MwXy1zokgG2KIcQoGNg8lcsW4MTj_hI8o',
        tabName: '',
        enabled: true,
        color: 'emerald'
      },
      {
        id: 'sheet-rishabraj',
        name: 'H.Rishabraj',
        spreadsheetId: '1f6ZtbLS5oxDXNjx57FvfBLwJ0Tr30s3R0ip5MwT6nec',
        tabName: '',
        enabled: true,
        color: 'sky'
      }
    ],
  };
};

export const saveConfig = (config: SheetConfig) => {
  const sanitized = {
    ...config,
    scriptUrl: config.scriptUrl?.trim() || CURRENT_LATEST_SCRIPT_URL,
    sheets: (config.sheets || []).map((s) => ({
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

/**
 * Universal CORS POST request for Google Apps Script
 */
export async function apiPost(action: string, payload: Record<string, any> = {}) {
  const config = getSavedConfig();
  const scriptUrl = cleanScriptUrl(config.scriptUrl || CURRENT_LATEST_SCRIPT_URL);

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
      if (response.status === 404) {
        throw new Error(
          'Google Apps Script returned 404. Please check Web App URL.'
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

export async function testConnection(rawScriptUrl: string) {
  const scriptUrl = cleanScriptUrl(rawScriptUrl || CURRENT_LATEST_SCRIPT_URL);

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'ping' }),
    });

    if (!response.ok) {
      throw new Error(`Connection failed (${response.status}: ${response.statusText})`);
    }

    const data = await response.json();
    return data;
  } catch (err: any) {
    throw err;
  }
}

export async function testSingleSheet(rawScriptUrl: string, sheetId: string, sheetName: string = '') {
  const scriptUrl = cleanScriptUrl(rawScriptUrl || CURRENT_LATEST_SCRIPT_URL);

  const cleanId = extractCleanId(sheetId);
  const response = await fetch(scriptUrl, {
    method: 'POST',
    mode: 'cors',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      action: 'testSheet',
      sheetId: cleanId,
      sheetName: sheetName.trim()
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}`);
  }

  return await response.json();
}

/**
 * Universal safe data fetcher supporting both res.data and top-level res formats
 */
export async function fetchInitialData(): Promise<{
  leads: Lead[];
  users: User[];
  activities: Activity[];
  tasks: Task[];
  sheetCounts?: Record<string, number>;
  diagnostics?: string[];
  spreadsheetInfo?: SpreadsheetInfo;
}> {
  try {
    const res = await apiPost('getInitialData');
    const payload = res && res.data ? res.data : (res || {});

    return {
      leads: Array.isArray(payload.leads) ? payload.leads : (Array.isArray(res.leads) ? res.leads : []),
      users: Array.isArray(payload.users) ? payload.users : (Array.isArray(res.users) ? res.users : []),
      activities: Array.isArray(payload.activities) ? payload.activities : (Array.isArray(res.activities) ? res.activities : []),
      tasks: Array.isArray(payload.tasks) ? payload.tasks : (Array.isArray(res.tasks) ? res.tasks : []),
      sheetCounts: payload.sheetCounts || res.sheetCounts || {},
      diagnostics: payload.diagnostics || res.diagnostics || [],
      spreadsheetInfo: payload.spreadsheetInfo || res.spreadsheetInfo || null,
    };
  } catch (err) {
    console.error("fetchInitialData error:", err);
    throw err;
  }
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
