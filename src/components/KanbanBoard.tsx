import React, { useState } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Tag, 
  Wallet, 
  Layers, 
  Clock, 
  Plus,
  Inbox,
  Sparkles
} from 'lucide-react';
import { Lead, DEFAULT_STAGES, PipelineStage } from '../types';

interface KanbanBoardProps {
  leads: Lead[];
  onUpdateLeadStage: (leadId: string, newStage: string) => void;
  onSelectLead: (lead: Lead) => void;
  onOpenWhatsApp: (lead: Lead) => void;
  onOpenNewLead: (stage?: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  onUpdateLeadStage,
  onSelectLead,
  onOpenWhatsApp,
  onOpenNewLead
}) => {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);

  // Helper to map ANY lead status string to one of our 7 pipeline stages safely
  const resolveStageForLead = (lead: Lead): PipelineStage => {
    const rawStatus = (lead.lead_status || '').trim().toLowerCase();
    
    if (!rawStatus || rawStatus === 'new lead' || rawStatus === 'new' || rawStatus === 'unassigned' || rawStatus === 'open' || rawStatus === 'active' || rawStatus === 'fresh') {
      return 'New Lead';
    }
    if (rawStatus.includes('contact') || rawStatus.includes('progress') || rawStatus.includes('call') || rawStatus.includes('reach') || rawStatus.includes('ringing')) {
      return 'Contacted / In Progress';
    }
    if (rawStatus.includes('interest') || rawStatus.includes('warm') || rawStatus.includes('qualif') || rawStatus.includes('hot')) {
      return 'Interested';
    }
    if (rawStatus.includes('visit') || rawStatus.includes('meet') || rawStatus.includes('schedul') || rawStatus.includes('demo') || rawStatus.includes('appointment')) {
      return 'Site Visit / Meeting Scheduled';
    }
    if (rawStatus.includes('propos') || rawStatus.includes('negotiat') || rawStatus.includes('pitch') || rawStatus.includes('quote') || rawStatus.includes('review')) {
      return 'Proposal / Negotiation';
    }
    if (rawStatus.includes('won') || rawStatus.includes('convert') || rawStatus.includes('close') || rawStatus.includes('success') || rawStatus.includes('deal done')) {
      return 'Won / Converted';
    }
    if (rawStatus.includes('lost') || rawStatus.includes('disqualif') || rawStatus.includes('junk') || rawStatus.includes('invalid') || rawStatus.includes('reject') || rawStatus.includes('fake') || rawStatus.includes('not interested')) {
      return 'Lost / Disqualified';
    }

    // Default fallback so NO lead is EVER hidden!
    return 'New Lead';
  };

  const getLeadsForStage = (stageId: PipelineStage) => {
    return leads.filter((lead) => resolveStageForLead(lead) === stageId);
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setActiveDropZone(stageId);
  };

  const handleDragLeave = () => {
    setActiveDropZone(null);
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (leadId) {
      onUpdateLeadStage(leadId, stageId);
    }
    setDraggedLeadId(null);
    setActiveDropZone(null);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex-1 overflow-x-auto p-4 md:p-6 flex flex-col">
      {/* Top Pipeline Summary Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>Pipeline Kanban</span>
          </h2>
          <span className="px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30 text-xs font-bold">
            {leads.length} Total Leads
          </span>
        </div>

        <button
          onClick={() => onOpenNewLead('New Lead')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-600/30 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Lead</span>
        </button>
      </div>

      {leads.length === 0 && (
        <div className="mb-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs text-slate-300">
            <Inbox className="w-5 h-5 text-brand-400 shrink-0" />
            <div>
              <p className="font-semibold text-slate-100">No leads loaded in the pipeline yet.</p>
              <p className="text-slate-400">
                Go to the <strong>Google Sheet Setup</strong> tab to link your sheet, or add a lead with <strong>+ Add Lead</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Stages Columns */}
      <div className="flex gap-4 min-w-[1400px] pb-6 items-start flex-1">
        {DEFAULT_STAGES.map((stage) => {
          const stageLeads = getLeadsForStage(stage.id);
          const isDropTarget = activeDropZone === stage.id;

          return (
            <div
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`w-80 flex-shrink-0 bg-slate-900/70 rounded-2xl border transition-all flex flex-col max-h-[calc(100vh-180px)] ${
                isDropTarget
                  ? 'border-brand-400 ring-2 ring-brand-500/20 bg-slate-800/90'
                  : 'border-slate-800 shadow-sm'
              }`}
            >
              {/* Stage Header */}
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur rounded-t-2xl z-10">
                <div className="flex items-center space-x-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.bg} border ${stage.border} shrink-0`} />
                  <h3 className="font-semibold text-xs tracking-wide text-slate-200 uppercase truncate">
                    {stage.label}
                  </h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stage.bg} ${stage.color} border ${stage.border} shrink-0`}>
                    {stageLeads.length}
                  </span>
                </div>
                <button
                  onClick={() => onOpenNewLead(stage.id)}
                  title="Add lead to this stage"
                  className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded-lg shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Cards Container */}
              <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1 custom-scrollbar">
                {stageLeads.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-800/80 rounded-xl flex items-center justify-center text-xs text-slate-400 font-medium">
                    Drop leads here
                  </div>
                ) : (
                  stageLeads.map((lead) => {
                    const isDragging = draggedLeadId === lead.id;
                    const configInterests = lead['which_configuration_are_you_interested_in?'] || lead.configuration || lead.service;
                    const budget = lead['what_is_your_budget?'] || lead.budget;
                    const platform = (lead.platform || '').toLowerCase();

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onClick={() => onSelectLead(lead)}
                        className={`group bg-slate-800/90 hover:bg-slate-800 border border-slate-700/70 hover:border-brand-500/50 rounded-xl p-3.5 transition-all cursor-pointer shadow-sm hover:shadow-md hover:shadow-brand-500/5 ${
                          isDragging ? 'opacity-40 scale-95' : 'opacity-100'
                        }`}
                      >
                        {/* Top: Name & Platform */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-slate-100 group-hover:text-brand-300 transition-colors truncate">
                              {lead.full_name || 'Unnamed Lead'}
                            </h4>
                            <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{lead.phone_number || 'No Phone'}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {platform && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                                  platform.includes('ig') || platform.includes('instagram')
                                    ? 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30'
                                    : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                }`}
                              >
                                {platform.includes('ig') || platform.includes('instagram') ? 'IG' : 'FB'}
                              </span>
                            )}
                            {lead.sheet_source && (
                              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300 border border-slate-600/40">
                                {lead.sheet_source === 'Meta Sheet 1' ? 'S1' : 'S2'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Meta Questions / Advisory Details */}
                        <div className="space-y-1.5 my-2.5 pt-2 border-t border-slate-700/50 text-xs">
                          {configInterests && (
                            <div className="flex items-center gap-1.5 text-slate-300 truncate">
                              <Tag className="w-3 h-3 text-brand-400 shrink-0" />
                              <span className="truncate font-medium">{configInterests}</span>
                            </div>
                          )}

                          {budget && (
                            <div className="flex items-center gap-1.5 text-slate-300 truncate">
                              <Wallet className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="truncate font-medium">{budget}</span>
                            </div>
                          )}

                          {lead.campaign_name && (
                            <div className="flex items-center gap-1.5 text-slate-400 truncate text-[11px]">
                              <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{lead.campaign_name}</span>
                            </div>
                          )}
                        </div>

                        {/* Follow-up / Notes Indicator */}
                        {lead.crm_notes && (
                          <div className="mb-2 p-1.5 rounded bg-slate-900/60 border border-slate-700/40 text-[11px] text-slate-300 line-clamp-1 italic">
                            "{lead.crm_notes}"
                          </div>
                        )}

                        {/* Bottom Actions & Date */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(lead.created_time)}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* WhatsApp Button */}
                            {lead.phone_number && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenWhatsApp(lead);
                                }}
                                className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-colors"
                                title="Open WhatsApp Chat"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Direct Call Button */}
                            {lead.phone_number && (
                              <a
                                href={`tel:${lead.phone_number}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 transition-colors"
                                title="Call Lead"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
