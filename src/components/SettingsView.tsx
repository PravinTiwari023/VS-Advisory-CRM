import React, { useState } from 'react';
import { 
  Settings2, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Save, 
  RefreshCw, 
  FileCode, 
  Database, 
  SearchCode, 
  FileSpreadsheet,
  Plus,
  Trash2,
  Layers,
  Lock,
  Unlock,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { SheetConfig, SpreadsheetInfo, ConnectedSheet, SHEET_COLORS } from '../types';
import { testConnection, testSingleSheet, runMasterSetup, extractCleanId, CURRENT_LATEST_SCRIPT_URL } from '../services/api';

interface SettingsViewProps {
  config: SheetConfig;
  onSaveConfig: (newConfig: SheetConfig) => void;
  isConnected: boolean;
  onRefreshData: () => void;
  spreadsheetInfo?: SpreadsheetInfo | null;
  diagnostics?: string[];
}

const ADMIN_SETUP_PASSWORD = 'Vivek@VS2026';
const SESSION_STORAGE_KEY_UNLOCKED = 'vs_crm_setup_unlocked_session';

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onSaveConfig,
  isConnected,
  onRefreshData,
  spreadsheetInfo,
  diagnostics
}) => {
  // Password Lock State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_STORAGE_KEY_UNLOCKED) === 'true';
    } catch {
      return false;
    }
  });
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [scriptUrl, setScriptUrl] = useState(config.scriptUrl || CURRENT_LATEST_SCRIPT_URL);
  const [sheets, setSheets] = useState<ConnectedSheet[]>(config.sheets || [
    {
      id: 'sheet-1',
      name: 'Meta Campaign 1',
      spreadsheetId: '',
      tabName: '',
      enabled: true,
      color: 'emerald'
    }
  ]);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sheetTests, setSheetTests] = useState<Record<string, { loading: boolean; result?: { success: boolean; message: string } }>>({});

  const [copiedCode, setCopiedCode] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [initResult, setInitResult] = useState<string | null>(null);

  // Handle Password Unlock
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === ADMIN_SETUP_PASSWORD) {
      setIsUnlocked(true);
      setPasswordError(null);
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY_UNLOCKED, 'true');
      } catch {}
    } else {
      setPasswordError('Invalid Admin Password. Access Denied.');
    }
  };

  // Re-lock
  const handleLock = () => {
    setIsUnlocked(false);
    setInputPassword('');
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY_UNLOCKED);
    } catch {}
  };

  // Add new sheet card
  const handleAddSheet = () => {
    const newIdx = sheets.length + 1;
    const colorCycle = SHEET_COLORS[(newIdx - 1) % SHEET_COLORS.length].id;
    const newSheet: ConnectedSheet = {
      id: 'sheet-' + Date.now(),
      name: `Meta Campaign ${newIdx}`,
      spreadsheetId: '',
      tabName: '',
      enabled: true,
      color: colorCycle
    };
    setSheets([...sheets, newSheet]);
  };

  // Remove sheet card
  const handleRemoveSheet = (id: string) => {
    if (sheets.length <= 1) {
      alert("You need at least one Google Sheet configuration.");
      return;
    }
    setSheets(sheets.filter((s) => s.id !== id));
  };

  // Update specific sheet property
  const handleUpdateSheet = (id: string, field: keyof ConnectedSheet, value: any) => {
    setSheets(
      sheets.map((s) => {
        if (s.id === id) {
          return { ...s, [field]: value };
        }
        return s;
      })
    );
  };

  // Test single sheet
  const handleTestSingleSheet = async (sheet: ConnectedSheet) => {
    if (!scriptUrl.trim()) {
      alert('Please enter your Apps Script Web App URL first.');
      return;
    }

    setSheetTests((prev) => ({ ...prev, [sheet.id]: { loading: true } }));
    try {
      const res = await testSingleSheet(scriptUrl.trim(), sheet.spreadsheetId.trim(), sheet.tabName?.trim() || '');
      if (res.status === 'success') {
        setSheetTests((prev) => ({
          ...prev,
          [sheet.id]: {
            loading: false,
            result: {
              success: true,
              message: `✅ Found ${res.rowCount} rows in '${res.spreadsheetTitle}' (${res.tabName})`
            }
          }
        }));
      } else {
        setSheetTests((prev) => ({
          ...prev,
          [sheet.id]: {
            loading: false,
            result: {
              success: false,
              message: `❌ ${res.message}`
            }
          }
        }));
      }
    } catch (e: any) {
      setSheetTests((prev) => ({
        ...prev,
        [sheet.id]: {
          loading: false,
          result: {
            success: false,
            message: `❌ Error: ${e.message}`
          }
        }
      }));
    }
  };

  // Test overall connection
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection(scriptUrl.trim());
      setTestResult({
        success: true,
        message: res.message || 'Connected successfully to Google Apps Script!'
      });
      onSaveConfig({
        scriptUrl: scriptUrl.trim(),
        sheets: sheets.map(s => ({ ...s, spreadsheetId: extractCleanId(s.spreadsheetId) })),
        lastSynced: new Date().toISOString()
      });
      onRefreshData();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveConfig({
      scriptUrl: scriptUrl.trim(),
      sheets: sheets.map(s => ({ ...s, spreadsheetId: extractCleanId(s.spreadsheetId) })),
      lastSynced: new Date().toISOString()
    });
    setTestResult({
      success: true,
      message: `Configuration saved for ${sheets.length} Google Sheets!`
    });
    onRefreshData();
  };

  const handleInitMaster = async () => {
    setInitializing(true);
    setInitResult(null);
    try {
      const res = await runMasterSetup();
      setInitResult(res.message || 'Master CRM tabs initialized in your Google Sheet!');
      onRefreshData();
    } catch (err: any) {
      setInitResult('Error: ' + (err.message || 'Failed to initialize sheets'));
    } finally {
      setInitializing(false);
    }
  };

  const copyCode = () => {
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // =========================================================================
  // IF LOCKED: RENDER ADMIN SECURITY LOCK SCREEN
  // =========================================================================
  if (!isUnlocked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-in fade-in-50">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 relative">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/10">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-100">Admin Security Verification</h3>
            <p className="text-xs text-slate-400">
              Google Sheets configuration and API endpoints are restricted. Please enter the master password.
            </p>
          </div>

          {passwordError && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-3 text-xs">
            <div className="relative text-left">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                placeholder="Enter Admin Password"
                required
                autoFocus
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center space-x-2 active:scale-95"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Unlock Google Sheets Setup</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Protected Admin Area</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // IF UNLOCKED: RENDER FULL SETTINGS VIEW
  // =========================================================================
  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto custom-scrollbar space-y-4 sm:space-y-6 max-w-4xl pb-24 lg:pb-8">
      {/* Top Header with Re-Lock Button */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-400 shrink-0" />
            <span>Google Sheets Setup</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Connect your Meta Ads Google Sheets. Leads merge into your CRM in real-time.
          </p>
        </div>

        <button
          onClick={handleLock}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors shrink-0"
          title="Lock Setup Area"
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Lock</span>
        </button>
      </div>

      {/* Live Spreadsheet Inspector */}
      {isConnected && spreadsheetInfo && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800/80 border border-slate-700/80 shadow-lg space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5 min-w-0">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-100 truncate">{spreadsheetInfo.title}</h4>
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  ID: {spreadsheetInfo.id}
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
              Live Connected ({sheets.length} Sheets)
            </span>
          </div>

          {diagnostics && diagnostics.length > 0 && (
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              {diagnostics.map((d, i) => (
                <p key={i} className="text-slate-300 break-words">
                  {d}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Settings Form */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        {/* Apps Script Endpoint URL */}
        <div className="space-y-1.5">
          <label className="block text-slate-300 font-semibold text-xs">
            Google Apps Script Web App URL
          </label>
          <input
            type="text"
            value={scriptUrl}
            onChange={(e) => setScriptUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 placeholder-slate-500 font-mono text-[11px] sm:text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 break-all"
          />
        </div>

        {/* Dynamic Multi-Sheets Section */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-400" />
                <span>Connected Google Sheets ({sheets.length})</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Add each of your Meta Ads Google Sheets.
              </p>
            </div>

            <button
              onClick={handleAddSheet}
              className="w-full sm:w-auto flex items-center justify-center space-x-1 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Sheet</span>
            </button>
          </div>

          {/* Sheet Cards */}
          <div className="space-y-3">
            {sheets.map((sheet, index) => {
              const testState = sheetTests[sheet.id];
              return (
                <div
                  key={sheet.id}
                  className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3"
                >
                  {/* Top Bar of Sheet Card */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 flex items-center justify-center shrink-0">
                        #{index + 1}
                      </span>
                      <input
                        type="text"
                        value={sheet.name}
                        onChange={(e) => handleUpdateSheet(sheet.id, 'name', e.target.value)}
                        placeholder="Campaign Name (e.g. Bangalore 3BHK)"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-100 focus:outline-none min-w-0"
                      />
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {/* Color Selector */}
                      <select
                        value={sheet.color || 'emerald'}
                        onChange={(e) => handleUpdateSheet(sheet.id, 'color', e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                      >
                        {SHEET_COLORS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label.split(' ')[0]}
                          </option>
                        ))}
                      </select>

                      {/* Delete */}
                      {sheets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSheet(sheet.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Remove Sheet"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ID / URL and Tab Inputs */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">
                        Spreadsheet ID or Full Google Sheet URL
                      </label>
                      <input
                        type="text"
                        value={sheet.spreadsheetId}
                        onChange={(e) => handleUpdateSheet(sheet.id, 'spreadsheetId', e.target.value)}
                        placeholder="Paste full Sheet URL or ID"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 font-mono text-[11px] focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={sheet.tabName || ''}
                          onChange={(e) => handleUpdateSheet(sheet.id, 'tabName', e.target.value)}
                          placeholder="Tab Name (auto-scans if empty)"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 text-xs focus:outline-none"
                        />
                      </div>

                      {scriptUrl && (
                        <button
                          type="button"
                          onClick={() => handleTestSingleSheet(sheet)}
                          disabled={testState?.loading}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-brand-400 text-xs font-semibold flex items-center justify-center gap-1 shrink-0"
                        >
                          <SearchCode className="w-3.5 h-3.5" />
                          <span>{testState?.loading ? 'Testing...' : 'Test Sheet'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {testState?.result && (
                    <p className={`text-[11px] ${testState.result.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {testState.result.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Save & Sync Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3 border-t border-slate-800">
          <button
            onClick={handleTestConnection}
            disabled={testing || !scriptUrl.trim()}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Syncing...' : 'Test & Sync All Sheets'}</span>
          </button>

          <button
            onClick={handleSave}
            className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
          >
            <Save className="w-3.5 h-3.5 text-slate-400" />
            <span>Save Settings</span>
          </button>

          <button
            onClick={handleInitMaster}
            disabled={initializing || !isConnected}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition-all disabled:opacity-50 text-center"
          >
            {initializing ? 'Setting up...' : 'Verify Sheet Tabs'}
          </button>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
              testResult.success
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="break-words">{testResult.message}</span>
          </div>
        )}

        {initResult && (
          <div className="p-3 rounded-xl bg-brand-950/30 border border-brand-500/30 text-brand-300 text-xs">
            {initResult}
          </div>
        )}
      </div>

      {/* Script Copy Card */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <FileCode className="w-4 h-4 text-amber-400" />
            <span>Google Apps Script Code</span>
          </h3>
          <button
            onClick={copyCode}
            className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-all"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied!' : 'Copy Code.gs Script'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
