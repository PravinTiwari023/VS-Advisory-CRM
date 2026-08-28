import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { KanbanBoard } from './components/KanbanBoard';
import { TableView } from './components/TableView';
import { AnalyticsView } from './components/AnalyticsView';
import { TasksView } from './components/TasksView';
import { SettingsView } from './components/SettingsView';
import { LeadDetailModal } from './components/LeadDetailModal';
import { WhatsAppTemplateModal } from './components/WhatsAppTemplateModal';
import { NewLeadModal } from './components/NewLeadModal';
import { AuthScreen } from './components/AuthScreen';
import { 
  Lead, 
  User, 
  Activity, 
  Task, 
  SheetConfig,
  SpreadsheetInfo 
} from './types';
import { 
  getSavedConfig, 
  saveConfig, 
  fetchInitialData, 
  updateLeadInSheet, 
  createLeadInSheet,
  logActivityInSheet,
  createTaskInSheet,
  updateTaskInSheet
} from './services/api';
import { onAuthChange } from './services/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  AlertCircle, 
  CheckCircle2, 
  X, 
  KanbanSquare, 
  Table2, 
  BarChart3, 
  CheckSquare, 
  Settings2,
  Sparkles,
  Loader2
} from 'lucide-react';

export function App() {
  const [config, setConfig] = useState<SheetConfig>(getSavedConfig());
  const [activeTab, setActiveTab] = useState<ActiveTab>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');

  // Firebase Auth State
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Live Data State (No sample data, strictly live from sheets)
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sheetCounts, setSheetCounts] = useState<Record<string, number>>({});
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<SpreadsheetInfo | null>(null);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);

  // Status & Modal States
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [whatsAppLead, setWhatsAppLead] = useState<Lead | null>(null);
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [newLeadStage, setNewLeadStage] = useState<string>('New Lead');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // Subscribe to Firebase Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setAuthUser(user);
      setAuthLoading(false);
      if (user) {
        showToast(`Welcome back, ${user.displayName || user.email}!`, 'success');
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch live data from all connected Google Sheets
  const loadData = useCallback(async () => {
    if (!config.scriptUrl || !config.scriptUrl.startsWith('http')) {
      setIsConnected(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchInitialData();
      setLeads(data.leads || []);
      setUsers(data.users || []);
      setActivities(data.activities || []);
      setTasks(data.tasks || []);
      if (data.sheetCounts) setSheetCounts(data.sheetCounts);
      if (data.spreadsheetInfo) setSpreadsheetInfo(data.spreadsheetInfo);
      if (data.diagnostics) setDiagnostics(data.diagnostics);
      
      setIsConnected(true);
      showToast(`Loaded ${data.leads?.length || 0} leads across your connected sheets!`, 'success');
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setIsConnected(false);
      showToast(err.message || 'Failed to connect to Google Sheets', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [config.scriptUrl, config.sheets]);

  useEffect(() => {
    if (authUser) {
      loadData();
    }
  }, [authUser, loadData]);

  // Update Config
  const handleSaveConfig = (newConfig: SheetConfig) => {
    setConfig(newConfig);
    saveConfig(newConfig);
    showToast('Settings saved successfully!', 'success');
  };

  // Optimistic Lead Stage Update
  const handleUpdateLeadStage = async (leadId: string, newStage: string) => {
    const previousLeads = [...leads];
    
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, lead_status: newStage } : l))
    );

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, lead_status: newStage } : null));
    }

    showToast(`Lead stage updated to ${newStage}`, 'success');

    // Background sync to Google Sheet
    try {
      const leadToUpdate = leads.find((l) => l.id === leadId);
      if (leadToUpdate) {
        await updateLeadInSheet({
          ...leadToUpdate,
          lead_status: newStage,
        });
      }
    } catch (err: any) {
      console.error('Failed to sync stage update to sheet:', err);
      setLeads(previousLeads);
      showToast(`Sync error: ${err.message}. Changes reverted.`, 'error');
    }
  };

  // Full Lead Update from Detail Modal
  const handleUpdateLead = async (updatedLead: Lead) => {
    const previousLeads = [...leads];

    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
    );
    setSelectedLead(updatedLead);
    showToast('Lead details updated & synced to Google Sheet!', 'success');

    try {
      await updateLeadInSheet(updatedLead);
    } catch (err: any) {
      console.error('Failed to update lead:', err);
      setLeads(previousLeads);
      showToast(`Sync failed: ${err.message}`, 'error');
    }
  };

  // Create Manual Lead
  const handleCreateLead = async (newLeadData: Partial<Lead>) => {
    setIsLoading(true);
    try {
      const advisorName = authUser?.displayName || authUser?.email || 'Advisor';
      await createLeadInSheet({
        ...newLeadData,
        crm_assigned_to: newLeadData.crm_assigned_to || advisorName
      });
      showToast('Lead created successfully in Google Sheet!', 'success');
      await loadData();
    } catch (err: any) {
      console.error('Failed to create lead:', err);
      showToast(`Failed to create lead: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Log Activity
  const handleLogActivity = async (activity: Partial<Activity>) => {
    try {
      const advisorName = authUser?.displayName || authUser?.email || 'Advisor';
      await logActivityInSheet({
        ...activity,
        logged_by: activity.logged_by || advisorName
      });
      showToast('Activity logged to Google Sheet!', 'success');
      await loadData();
    } catch (err: any) {
      console.error('Failed to log activity:', err);
      showToast(`Failed to log activity: ${err.message}`, 'error');
    }
  };

  // Create Task
  const handleAddTask = async (task: Partial<Task>) => {
    try {
      const advisorName = authUser?.displayName || authUser?.email || 'Advisor';
      await createTaskInSheet({
        ...task,
        assigned_to: task.assigned_to || advisorName
      });
      showToast('Task added to Google Sheet!', 'success');
      await loadData();
    } catch (err: any) {
      console.error('Failed to create task:', err);
      showToast(`Failed to create task: ${err.message}`, 'error');
    }
  };

  // Toggle Task Status
  const handleToggleTask = async (taskId: string, currentStatus: 'Pending' | 'Completed') => {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTaskInSheet(taskId, newStatus);
      showToast(`Task marked as ${newStatus}`, 'success');
    } catch (err: any) {
      console.error('Failed to update task:', err);
      showToast(`Failed to sync task: ${err.message}`, 'error');
      await loadData();
    }
  };

  // Global search filtering
  const searchedLeads = leads.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.full_name?.toLowerCase().includes(q) ||
      l.phone_number?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.campaign_name?.toLowerCase().includes(q) ||
      l.ad_name?.toLowerCase().includes(q) ||
      l.sheet_source?.toLowerCase().includes(q) ||
      l['which_configuration_are_you_interested_in?']?.toLowerCase().includes(q) ||
      l['what_is_your_budget?']?.toLowerCase().includes(q)
    );
  });

  const pendingTasksCount = tasks.filter((t) => t.status === 'Pending').length;

  // Initial Auth Loading Spinner
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
          Initializing VS Advisory CRM...
        </p>
      </div>
    );
  }

  // If Not Logged In, Render Firebase Auth Screen
  if (!authUser) {
    return <AuthScreen onSuccess={() => {}} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center space-x-3 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-brand-950/90 border-brand-500/40 text-brand-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-brand-400" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-200 ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        config={config}
        authUser={authUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={loadData}
        isLoading={isLoading}
        isConnected={isConnected}
        onOpenNewLead={() => {
          setNewLeadStage('New Lead');
          setIsNewLeadOpen(true);
        }}
        onNavigateSettings={() => setActiveTab('settings')}
      />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          totalLeads={leads.length}
          sheetCounts={sheetCounts}
          pendingTasksCount={pendingTasksCount}
          config={config}
        />

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {/* Disconnected Alert Banner if not configured */}
          {!isConnected && activeTab !== 'settings' && (
            <div className="p-4 bg-amber-950/30 border-b border-amber-500/30 flex items-center justify-between px-6 text-xs">
              <div className="flex items-center space-x-3 text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Google Sheets backend not connected yet.</strong> Link your Apps Script Web App URL to load your live Meta Ads leads.
                </span>
              </div>
              <button
                onClick={() => setActiveTab('settings')}
                className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-semibold"
              >
                Connect Sheets Now
              </button>
            </div>
          )}

          {/* Active Tab View */}
          {activeTab === 'pipeline' && (
            <KanbanBoard
              leads={searchedLeads}
              onUpdateLeadStage={handleUpdateLeadStage}
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenWhatsApp={(l) => setWhatsAppLead(l)}
              onOpenNewLead={(stage) => {
                setNewLeadStage(stage || 'New Lead');
                setIsNewLeadOpen(true);
              }}
            />
          )}

          {activeTab === 'table' && (
            <TableView
              leads={searchedLeads}
              config={config}
              onSelectLead={(l) => setSelectedLead(l)}
              onOpenWhatsApp={(l) => setWhatsAppLead(l)}
              onUpdateLeadStage={handleUpdateLeadStage}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsView leads={leads} />}

          {activeTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              leads={leads}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              config={config}
              onSaveConfig={handleSaveConfig}
              isConnected={isConnected}
              onRefreshData={loadData}
              spreadsheetInfo={spreadsheetInfo}
              diagnostics={diagnostics}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 shrink-0 z-30">
        {[
          { id: 'pipeline' as ActiveTab, label: 'Pipeline', icon: KanbanSquare },
          { id: 'table' as ActiveTab, label: 'Leads', icon: Table2 },
          { id: 'analytics' as ActiveTab, label: 'Analytics', icon: BarChart3 },
          { id: 'tasks' as ActiveTab, label: 'Tasks', icon: CheckSquare },
          { id: 'settings' as ActiveTab, label: 'Setup', icon: Settings2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center space-y-1 py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-brand-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Modals & Slide-overs */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          users={users}
          activities={activities}
          tasks={tasks}
          onClose={() => setSelectedLead(null)}
          onUpdateLead={handleUpdateLead}
          onOpenWhatsApp={(l) => setWhatsAppLead(l)}
          onLogActivity={handleLogActivity}
          onAddTask={handleAddTask}
        />
      )}

      {whatsAppLead && (
        <WhatsAppTemplateModal
          lead={whatsAppLead}
          onClose={() => setWhatsAppLead(null)}
        />
      )}

      {isNewLeadOpen && (
        <NewLeadModal
          initialStage={newLeadStage}
          users={users}
          onClose={() => setIsNewLeadOpen(false)}
          onCreateLead={handleCreateLead}
        />
      )}
    </div>
  );
}
export default App;
