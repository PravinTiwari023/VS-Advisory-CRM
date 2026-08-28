import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  MessageSquare, 
  Mail, 
  Calendar, 
  Tag, 
  Wallet, 
  Layers, 
  Clock, 
  UserCheck, 
  CheckCircle2, 
  Save, 
  PlusCircle, 
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Lead, Activity, Task, User, DEFAULT_STAGES } from '../types';

interface LeadDetailModalProps {
  lead: Lead | null;
  users: User[];
  activities: Activity[];
  tasks: Task[];
  onClose: () => void;
  onUpdateLead: (updated: Lead) => Promise<void>;
  onOpenWhatsApp: (lead: Lead) => void;
  onLogActivity: (activity: Partial<Activity>) => Promise<void>;
  onAddTask: (task: Partial<Task>) => Promise<void>;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  users,
  activities,
  tasks,
  onClose,
  onUpdateLead,
  onOpenWhatsApp,
  onLogActivity,
  onAddTask
}) => {
  if (!lead) return null;

  const [leadStatus, setLeadStatus] = useState(lead.lead_status || 'New Lead');
  const [crmNotes, setCrmNotes] = useState(lead.crm_notes || '');
  const [assignedTo, setAssignedTo] = useState(lead.crm_assigned_to || '');
  const [dealValue, setDealValue] = useState(lead.crm_deal_value || '');
  const [nextFollowUp, setNextFollowUp] = useState(lead.crm_next_follow_up || '');
  const [isSaving, setIsSaving] = useState(false);

  // New Note state
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'Call' | 'Meeting' | 'Note' | 'WhatsApp'>('Call');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // New Task state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const handleSaveLead = async () => {
    setIsSaving(true);
    try {
      await onUpdateLead({
        ...lead,
        lead_status: leadStatus,
        crm_notes: crmNotes,
        crm_assigned_to: assignedTo,
        crm_deal_value: dealValue,
        crm_next_follow_up: nextFollowUp,
        crm_last_contacted: new Date().toISOString()
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsAddingNote(true);
    try {
      await onLogActivity({
        lead_id: lead.id,
        type: noteType,
        summary: newNote.trim(),
        date: new Date().toISOString(),
        logged_by: assignedTo || 'Advisor'
      });
      setNewNote('');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setIsAddingTask(true);
    try {
      await onAddTask({
        lead_id: lead.id,
        lead_name: lead.full_name,
        title: newTaskTitle.trim(),
        due_date: newTaskDueDate || new Date().toISOString().slice(0, 10),
        priority: 'High',
        status: 'Pending',
        assigned_to: assignedTo || ''
      });
      setNewTaskTitle('');
      setNewTaskDueDate('');
    } finally {
      setIsAddingTask(false);
    }
  };

  const leadActivities = activities.filter((a) => a.lead_id === lead.id);
  const leadTasks = tasks.filter((t) => t.lead_id === lead.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-lg">
              {lead.full_name?.charAt(0) || 'L'}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-100 truncate">{lead.full_name || 'Unnamed Lead'}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{lead.phone_number || 'No Phone'}</span>
                {lead.sheet_source && (
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                    {lead.sheet_source}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveLead}
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
          {/* Quick Action Bar */}
          <div className="grid grid-cols-3 gap-2.5">
            {lead.phone_number ? (
              <button
                onClick={() => onOpenWhatsApp(lead)}
                className="flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-medium text-xs transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-800/40 text-slate-400 text-center text-xs border border-slate-800">
                No WhatsApp
              </div>
            )}

            {lead.phone_number ? (
              <a
                href={`tel:${lead.phone_number}`}
                className="flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 font-medium text-xs transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>Call</span>
              </a>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-800/40 text-slate-400 text-center text-xs border border-slate-800">
                No Phone
              </div>
            )}

            {lead.email ? (
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 font-medium text-xs transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </a>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-800/40 text-slate-400 text-center text-xs border border-slate-800">
                No Email
              </div>
            )}
          </div>

          {/* CRM Status & Assignment Grid */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
              <span>CRM Status & Assignment</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Stage */}
              <div>
                <label className="block text-slate-400 mb-1">Lead Stage</label>
                <select
                  value={leadStatus}
                  onChange={(e) => setLeadStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                >
                  {DEFAULT_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assigned Advisor */}
              <div>
                <label className="block text-slate-400 mb-1">Assigned Advisor</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Next Follow Up Date */}
              <div>
                <label className="block text-slate-400 mb-1">Next Follow-up Date</label>
                <input
                  type="date"
                  value={nextFollowUp}
                  onChange={(e) => setNextFollowUp(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Deal Value */}
              <div>
                <label className="block text-slate-400 mb-1">Deal / Contract Value</label>
                <input
                  type="text"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  placeholder="e.g. ₹5,00,000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-slate-400 mb-1 text-xs">Consultation Notes (Synced to Sheet)</label>
              <textarea
                value={crmNotes}
                onChange={(e) => setCrmNotes(e.target.value)}
                placeholder="Add ongoing client notes, requirements, meeting highlights..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Meta Form Responses */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Meta Form Answers</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Configuration Interested In:</span>
                <span className="font-semibold text-brand-300 text-sm">
                  {lead['which_configuration_are_you_interested_in?'] || 'Not specified'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Stated Budget:</span>
                <span className="font-semibold text-emerald-400 text-sm">
                  {lead['what_is_your_budget?'] || 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Meta Ads Campaign Attribution */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Meta Ad Attribution</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Campaign Name</span>
                <span className="font-medium text-slate-200 truncate block" title={lead.campaign_name}>
                  {lead.campaign_name || '-'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Ad Name</span>
                <span className="font-medium text-slate-200 truncate block" title={lead.ad_name}>
                  {lead.ad_name || '-'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Platform</span>
                <span className="font-semibold text-brand-400 uppercase">
                  {lead.platform || 'Facebook'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Form Name</span>
                <span className="font-medium text-slate-200 truncate block" title={lead.form_name}>
                  {lead.form_name || '-'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Adset Name</span>
                <span className="font-medium text-slate-200 truncate block" title={lead.adset_name}>
                  {lead.adset_name || '-'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Created Timestamp</span>
                <span className="font-medium text-slate-300 text-[11px] block">
                  {lead.created_time ? new Date(lead.created_time).toLocaleString() : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Activity Log & History */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Activity & Interaction History</span>
              <span className="text-[10px] font-normal text-slate-400">{leadActivities.length} logged</span>
            </h3>

            {/* Quick Log Form */}
            <form onSubmit={handleCreateActivity} className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={noteType}
                  onChange={(e: any) => setNoteType(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="Call">📞 Call</option>
                  <option value="WhatsApp">💬 WhatsApp</option>
                  <option value="Meeting">🤝 Meeting</option>
                  <option value="Note">📝 Note</option>
                </select>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Log quick call note or interaction..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  disabled={isAddingNote || !newNote.trim()}
                  className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
                >
                  Log
                </button>
              </div>
            </form>

            {/* Timeline */}
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {leadActivities.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No activities logged yet for this lead</p>
              ) : (
                leadActivities.map((act) => (
                  <div key={act.id} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-semibold text-brand-400 uppercase">{act.type}</span>
                      <span>{new Date(act.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-200">{act.summary}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">Logged by: {act.logged_by}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
