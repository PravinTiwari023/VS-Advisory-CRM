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
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { SheetConfig, SpreadsheetInfo, ConnectedSheet, SHEET_COLORS } from '../types';
import { testConnection, testSingleSheet, runMasterSetup, extractCleanId } from '../services/api';

interface SettingsViewProps {
  config: SheetConfig;
  onSaveConfig: (newConfig: SheetConfig) => void;
  isConnected: boolean;
  onRefreshData: () => void;
  spreadsheetInfo?: SpreadsheetInfo | null;
  diagnostics?: string[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onSaveConfig,
  isConnected,
  onRefreshData,
  spreadsheetInfo,
  diagnostics
}) => {
  const [scriptUrl, setScriptUrl] = useState(config.scriptUrl || '');
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
          if (field === 'spreadsheetId') {
            return { ...s, [field]: value };
          }
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
      // Auto Save
      onSaveConfig({
        scriptUrl: scriptUrl.trim(),
        sheets: sheets.map(s => ({ ...s, spreadsheetId: extractCleanId(s.spreadsheetId) })),
        lastSynced: new Date().toISOString()
      });
      onRefreshData();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect. Make sure Web App access is set to "Anyone".'
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
      message: `Configuration saved for ${sheets.length} Google Sheets! Refreshing live pipeline...`
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

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar space-y-6 max-w-5xl">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Database className="w-5 h-5 text-brand-400" />
          <span>Multi-Sheet Google Integration Hub</span>
        </h2>
        <p className="text-xs text-slate-400">
          Connect unlimited Meta Ads Google Sheets. Leads from all sheets will merge seamlessly into your CRM.
        </p>
      </div>

      {/* Live Spreadsheet Inspector */}
      {isConnected && spreadsheetInfo && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800/80 border border-slate-700/80 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="text-sm font-bold text-slate-100">{spreadsheetInfo.title}</h4>
                <p className="text-[11px] text-slate-400">
                  Spreadsheet ID: <span className="font-mono text-slate-300">{spreadsheetInfo.id}</span>
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
              Live Connected ({sheets.length} Sheets Configured)
            </span>
          </div>

          {diagnostics && diagnostics.length > 0 && (
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-0.5">
              {diagnostics.map((d, i) => (
                <p key={i} className="text-slate-400 flex items-center gap-1.5">
                  <span className="text-brand-400">▸</span> {d}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Form */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
        {/* Apps Script Endpoint URL */}
        <div className="space-y-1">
          <label className="block text-slate-300 font-semibold text-xs">
            Google Apps Script Web App URL <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={scriptUrl}
            onChange={(e) => setScriptUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-mono text-xs"
          />
        </div>

        {/* Dynamic Multi-Sheets Section */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-400" />
                <span>Connected Google Sheets ({sheets.length})</span>
              </h3>
              <p className="text-xs text-slate-400">
                Add each of your Meta Ads Google Sheets. You can add as many as you need!
              </p>
            </div>

            <button
              onClick={handleAddSheet}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Another Google Sheet</span>
            </button>
          </div>

          {/* Sheet Cards */}
          <div className="space-y-3">
            {sheets.map((sheet, index) => {
              const testState = sheetTests[sheet.id];
              return (
                <div
                  key={sheet.id}
                  className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300 flex items-center justify-center">
                        #{index + 1}
                      </span>
                      <input
                        type="text"
                        value={sheet.name}
                        onChange={(e) => handleUpdateSheet(sheet.id, 'name', e.target.value)}
                        placeholder="Sheet Display Name (e.g. Bangalore 3BHK Campaign)"
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Color Selector */}
                      <select
                        value={sheet.color || 'emerald'}
                        onChange={(e) => handleUpdateSheet(sheet.id, 'color', e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
                      >
                        {SHEET_COLORS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>

                      {/* Test Sheet */}
                      {scriptUrl && (
                        <button
                          type="button"
                          onClick={() => handleTestSingleSheet(sheet)}
                          disabled={testState?.loading}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-brand-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <SearchCode className="w-3.5 h-3.5" />
                          <span>{testState?.loading ? 'Testing...' : 'Test Sheet'}</span>
                        </button>
                      )}

                      {/* Delete Button */}
                      {sheets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSheet(sheet.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                          title="Remove Sheet"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ID / URL and Tab Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="md:col-span-2">
                      <label className="block text-slate-400 mb-1">
                        Spreadsheet ID or Full Google Sheet URL
                      </label>
                      <input
                        type="text"
                        value={sheet.spreadsheetId}
                        onChange={(e) => handleUpdateSheet(sheet.id, 'spreadsheetId', e.target.value)}
                        placeholder="Paste full URL (https://docs.google.com/spreadsheets/d/...) or ID"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Tab Name (Optional)</label>
                      <input
                        type="text"
                        value={sheet.tabName || ''}
                        onChange={(e) => handleUpdateSheet(sheet.id, 'tabName', e.target.value)}
                        placeholder="Auto-scans tabs if blank"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
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
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={handleTestConnection}
            disabled={testing || !scriptUrl.trim()}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Syncing...' : 'Test & Sync All Connected Sheets'}</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
          >
            <Save className="w-3.5 h-3.5 text-slate-400" />
            <span>Save Configuration</span>
          </button>

          <button
            onClick={handleInitMaster}
            disabled={initializing || !isConnected}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition-all disabled:opacity-50"
          >
            {initializing ? 'Setting up...' : 'Verify Users & Task Tabs in Master Sheet'}
          </button>
        </div>

        {testResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center space-x-2 ${
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
            <span>{testResult.message}</span>
          </div>
        )}

        {initResult && (
          <div className="p-3 rounded-xl bg-brand-950/30 border border-brand-500/30 text-brand-300 text-xs">
            {initResult}
          </div>
        )}
      </div>

      {/* Script Copy Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <FileCode className="w-4 h-4 text-amber-400" />
            <span>Google Apps Script Multi-Sheet Engine (v3.0)</span>
          </h3>
          <button
            onClick={copyCode}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-all shadow-md shadow-brand-600/20"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Code.gs Script'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          The backend script is updated with full multi-sheet routing. If you update your Google Apps Script, click <strong>Deploy &gt; Manage deployments &gt; Edit &gt; New version &gt; Deploy</strong>!
        </p>
      </div>
    </div>
  );
};
