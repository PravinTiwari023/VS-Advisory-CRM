import React from 'react';
import { 
  KanbanSquare, 
  Table2, 
  BarChart3, 
  CheckSquare, 
  Settings2, 
  FileSpreadsheet, 
  Layers,
  Sparkles,
  ExternalLink,
  Plus
} from 'lucide-react';
import { SheetConfig, SHEET_COLORS } from '../types';

export type ActiveTab = 'pipeline' | 'table' | 'analytics' | 'tasks' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  totalLeads: number;
  sheetCounts?: Record<string, number>;
  pendingTasksCount: number;
  config: SheetConfig;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  totalLeads,
  sheetCounts = {},
  pendingTasksCount,
  config
}) => {
  const navItems = [
    {
      id: 'pipeline' as ActiveTab,
      label: 'Pipeline Board',
      icon: KanbanSquare,
      badge: totalLeads > 0 ? String(totalLeads) : undefined,
    },
    {
      id: 'table' as ActiveTab,
      label: 'All Leads Grid',
      icon: Table2,
      badge: totalLeads > 0 ? String(totalLeads) : undefined,
    },
    {
      id: 'analytics' as ActiveTab,
      label: 'Meta Analytics',
      icon: BarChart3,
    },
    {
      id: 'tasks' as ActiveTab,
      label: 'Tasks & Follow-ups',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? String(pendingTasksCount) : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Google Sheets Setup',
      icon: Settings2,
      badge: config.sheets && config.sheets.length > 0 ? String(config.sheets.length) : undefined,
    },
  ];

  const getSheetUrl = (id?: string) => {
    if (!id) return null;
    return `https://docs.google.com/spreadsheets/d/${id}/edit`;
  };

  const getColorClasses = (colorId: string) => {
    const found = SHEET_COLORS.find((c) => c.id === colorId);
    return found ? found.text : 'text-brand-400';
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0 hidden lg:flex">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-3 mb-2">
            CRM Modules
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                        item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dynamic Connected Sheets List */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Connected Sheets ({config.sheets?.length || 0})
            </p>
            <button
              onClick={() => onSelectTab('settings')}
              title="Add more sheets in settings"
              className="text-slate-400 hover:text-brand-400 p-0.5"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
            {(!config.sheets || config.sheets.length === 0) ? (
              <p className="text-xs text-slate-400 px-3 py-2">No sheets configured</p>
            ) : (
              config.sheets.map((sheet, idx) => {
                const count = sheetCounts[sheet.id] ?? sheetCounts[`sheet-${idx}`] ?? 0;
                const textColor = getColorClasses(sheet.color);

                return (
                  <div
                    key={sheet.id}
                    className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <FileSpreadsheet className={`w-3.5 h-3.5 shrink-0 ${textColor}`} />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-200 truncate">
                          {sheet.name || `Sheet #${idx + 1}`}
                        </p>
                        <p className="text-[10px] text-slate-400">{count} leads loaded</p>
                      </div>
                    </div>

                    {sheet.spreadsheetId && (
                      <a
                        href={getSheetUrl(sheet.spreadsheetId)!}
                        target="_blank"
                        rel="noreferrer"
                        title="Open in Google Sheets"
                        className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-700/60 rounded shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Advisory Tagline / Info */}
      <div className="p-3 rounded-2xl bg-gradient-to-br from-brand-900/30 to-slate-800/40 border border-brand-500/20 text-xs">
        <div className="flex items-center space-x-2 text-brand-400 font-semibold mb-1">
          <Sparkles className="w-4 h-4" />
          <span>VS Advisory CRM</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Aggregating unlimited Meta Ads Google Sheets in real-time.
        </p>
      </div>
    </aside>
  );
};
