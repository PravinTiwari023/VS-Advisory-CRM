import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Calendar, 
  AlertCircle, 
  Clock, 
  UserCircle,
  Sparkles
} from 'lucide-react';
import { Task, Lead } from '../types';

interface TasksViewProps {
  tasks: Task[];
  leads: Lead[];
  onToggleTask: (taskId: string, currentStatus: 'Pending' | 'Completed') => Promise<void>;
  onAddTask: (task: Partial<Task>) => Promise<void>;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  leads,
  onToggleTask,
  onAddTask
}) => {
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Completed'>('Pending');
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [leadId, setLeadId] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      const matchedLead = leads.find((l) => l.id === leadId);
      await onAddTask({
        title: title.trim(),
        lead_id: leadId || undefined,
        lead_name: matchedLead ? matchedLead.full_name : undefined,
        due_date: dueDate,
        priority: priority,
        status: 'Pending',
        assigned_to: 'Advisor'
      });
      setTitle('');
      setLeadId('');
      setIsAdding(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'All') return true;
    return t.status === filterStatus;
  });

  const isOverdue = (dateStr: string, status: string) => {
    if (status === 'Completed' || !dateStr) return false;
    const due = new Date(dateStr).getTime();
    const today = new Date().setHours(0, 0, 0, 0);
    return due < today;
  };

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-brand-400" />
            <span>Follow-up Tasks & Action Items</span>
          </h2>
          <p className="text-xs text-slate-400">
            Keep track of client callbacks, site visits, and proposal deadlines
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdding ? 'Close Form' : 'New Task'}</span>
        </button>
      </div>

      {/* Add Task Form (Expandable) */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 animate-in fade-in-50">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Create New Action Item</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1">Task Title / Action Description</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Schedule discovery call for 3BHK advisory inquiry"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Link to Lead (Optional)</label>
              <select
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 truncate"
              >
                <option value="">No linked lead</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.full_name} ({l.phone_number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="High">🔴 High Priority</option>
                <option value="Medium">🟡 Medium Priority</option>
                <option value="Low">🟢 Low Priority</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="w-full py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Add Task to Sheet'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2">
        {(['Pending', 'Completed', 'All'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              filterStatus === tab
                ? 'bg-brand-600/20 text-brand-400 border-brand-500/30'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab} Tasks
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400">
            <p className="text-sm font-semibold text-slate-300">No tasks in this category</p>
            <p className="text-xs text-slate-400 mt-1">All action items are up to date</p>
          </div>
        ) : (
          filteredTasks.map((t) => {
            const overdue = isOverdue(t.due_date, t.status);

            return (
              <div
                key={t.id}
                onClick={() => onToggleTask(t.id, t.status)}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                  t.status === 'Completed'
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                    : overdue
                    ? 'bg-rose-950/20 border-rose-500/30 hover:bg-rose-950/30'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <button
                    type="button"
                    className="mt-0.5 text-slate-400 hover:text-brand-400 transition-colors shrink-0"
                  >
                    {t.status === 'Completed' ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0 space-y-1">
                    <p
                      className={`text-sm font-semibold text-slate-100 ${
                        t.status === 'Completed' ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {t.title}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {t.lead_name && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-brand-300 border border-slate-700 font-medium text-[11px]">
                          👤 {t.lead_name}
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          t.priority === 'High'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : t.priority === 'Medium'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {t.priority} Priority
                      </span>

                      {t.due_date && (
                        <span
                          className={`flex items-center gap-1 text-[11px] font-medium ${
                            overdue ? 'text-rose-400 font-bold' : 'text-slate-400'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{t.due_date} {overdue ? '(Overdue!)' : ''}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
