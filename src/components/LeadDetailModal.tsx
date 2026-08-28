import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  MessageSquare, 
  Mail, 
  Calendar, 
  Clock, 
  Tag, 
  Layers, 
  Send,
  Sparkles,
  UserCheck,
  Building2,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { Lead, User, Activity, Task, DEFAULT_STAGES, getLeadConfiguration, getLeadBudget } from '../types';

interface LeadDetailModalProps {
  lead: Lead;
  users: User[];
  activities: Activity[];
  tasks: Task[];
  onClose: () => void;
  onUpdateLead: (updatedLead: Lead) => void;
  onOpenWhatsApp: (lead: Lead) => void;
  onLogActivity: (activity: Partial<Activity>) => void;
  onAddTask: (task: Partial<Task>) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  users,
  activities,
  onClose,
  onUpdateLead,
  onOpenWhatsApp,
  onLogActivity,
  onAddTask
}) => {
  const [currentStage, setCurrentStage] = useState(lead.lead_status || 'New Lead');
  const [assignedTo, setAssignedTo] = useState(lead.crm_assigned_to || '');
  const [notes, setNotes] = useState(lead.crm_notes || '');
  const [dealValue, setDealValue] = useState(lead.crm_deal_value || '');
  const [nextFollowUp, setNextFollowUp] = useState(lead.crm_next_follow_up || '');
  
  const [activeTab, setActiveTab] = useState<'details' | 'activities' | 'tasks'>('details');
  const [newNote, setNewNote] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  const leadActivities = activities.filter((a) => a.lead_id === lead.id);

  const handleSave = () => {
    onUpdateLead({
      ...lead,
      lead_status: currentStage,
      crm_assigned_to: assignedTo,
      crm_notes: notes,
      crm_deal_value: dealValue,
      crm_next_follow_up: nextFollowUp,
      crm_last_contacted: new Date().toISOString()
    });
    onClose();
  };

  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    onLogActivity({
      lead_id: lead.id,
      type: 'Note',
      summary: newNote.trim(),
      date: new Date().toISOString(),
      logged_by: assignedTo || 'Advisor'
    });

    const updatedNotes = notes ? `${notes}\n• ${newNote.trim()}` : `• ${newNote.trim()}`;
    setNotes(updatedNotes);
    onUpdateLead({ ...lead, crm_notes: updatedNotes });
    setNewNote('');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onAddTask({
      lead_id: lead.id,
      lead_name: lead.full_name,
      title: newTaskTitle.trim(),
      due_date: newTaskDate || new Date().toISOString().slice(0, 10),
      priority: 'High',
      status: 'Pending',
      assigned_to: assignedTo || 'Advisor'
    });

    setNewTaskTitle('');
    setNewTaskDate('');
  };

  const configInterests = getLeadConfiguration(lead);
  const budget = getLeadBudget(lead);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in-50">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden z-10 animate-in slide-in-from-bottom-10 sm:zoom-in-95">
        
        {/* Mobile Grab Bar */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-slate-700" />
        </div>

        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90 backdrop-blur">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white font-bold text-base shadow-md shrink-0">
              {(lead.full_name || 'L').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-white truncate">{lead.full_name || 'Unnamed Lead'}</h3>
                {lead.sheet_source && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-brand-300 border border-slate-700 shrink-0">
                    {lead.sheet_source}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">ID: {lead.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 shrink-0 text-xs font-semibold">
          {[
            { id: 'details', label: 'Lead 360°' },
            { id: 'activities', label: `Activity (${leadActivities.length})` },
            { id: 'tasks', label: 'Follow-ups' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar text-xs">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Quick Contact Actions */}
              <div className="grid grid-cols-3 gap-2">
                {lead.phone_number ? (
                  <button
                    onClick={() => onOpenWhatsApp(lead)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-semibold gap-1 transition-all active:scale-95"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>WhatsApp</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 text-slate-500 text-center">
                    No Phone
                  </div>
                )}

                {lead.phone_number ? (
                  <a
                    href={`tel:${lead.phone_number}`}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 font-semibold gap-1 transition-all active:scale-95 text-center"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Call</span>
                  </a>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 text-slate-500 text-center">
                    No Phone
                  </div>
                )}

                {lead.email ? (
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 font-semibold gap-1 transition-all active:scale-95 text-center"
                  >
                    <Mail className="w-5 h-5" />
                    <span>Email</span>
                  </a>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 text-slate-500 text-center">
                    No Email
                  </div>
                )}
              </div>

              {/* Status & Advisor Control Section */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                  <span>Pipeline & Advisory Management</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Pipeline Stage</label>
                    <select
                      value={currentStage}
                      onChange={(e) => setCurrentStage(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      {DEFAULT_STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Assigned Advisor</label>
                    <input
                      type="text"
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      placeholder="e.g. Senior Advisor"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Deal Value (₹ / $)</label>
                    <input
                      type="text"
                      value={dealValue}
                      onChange={(e) => setDealValue(e.target.value)}
                      placeholder="e.g. ₹1.5 Cr"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Next Follow-Up Date</label>
                    <input
                      type="date"
                      value={nextFollowUp}
                      onChange={(e) => setNextFollowUp(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Consultation & Client Notes</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add consultation notes, client preferences, budget notes..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Meta Ads Campaign Attribution Box */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span>Meta Ads Lead Attribution</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-300">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Interested In</p>
                    <p className="font-bold text-brand-300 truncate mt-0.5">
                      {configInterests || '-'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Budget</p>
                    <p className="font-bold text-emerald-400 truncate mt-0.5">
                      {budget || '-'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Platform</p>
                    <p className="font-bold text-slate-100 truncate mt-0.5">{lead.platform || 'Direct'}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 sm:col-span-2">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Campaign Name</p>
                    <p className="font-medium text-slate-200 truncate mt-0.5">{lead.campaign_name || '-'}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Created Date</p>
                    <p className="font-medium text-slate-200 truncate mt-0.5">
                      {lead.created_time ? new Date(lead.created_time).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-4">
              <form onSubmit={handleAddQuickNote} className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Log quick consultation update..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  disabled={!newNote.trim()}
                  className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Log</span>
                </button>
              </form>

              <div className="space-y-2 pt-2">
                {leadActivities.length === 0 ? (
                  <p className="text-center py-8 text-slate-400">No activities logged yet.</p>
                ) : (
                  leadActivities.map((a) => (
                    <div key={a.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-brand-300">{a.type}</span>
                        <span className="text-slate-400">{new Date(a.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-200">{a.summary}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateTask} className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title (e.g. Send 3BHK floor plan on WhatsApp)..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-400 focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 text-xs focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newTaskTitle.trim()}
                    className="flex-1 py-1.5 rounded-xl bg-brand-600 text-white font-bold text-xs disabled:opacity-50"
                  >
                    Add Follow-up
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 backdrop-blur flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all active:scale-95 flex items-center justify-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save & Sync to Sheet</span>
          </button>
        </div>
      </div>
    </div>
  );
};
