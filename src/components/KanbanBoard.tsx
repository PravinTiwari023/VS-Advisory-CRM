import React, { useState } from 'react';
import { 
  Plus, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Sparkles, 
  Layers,
  ChevronRight
} from 'lucide-react';
import { Lead, DEFAULT_STAGES, getLeadConfiguration, getLeadBudget } from '../types';

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
  const [activeMobileStage, setActiveMobileStage] = useState<string>(DEFAULT_STAGES[0].id);

  // Group leads by stage
  const leadsByStage = DEFAULT_STAGES.reduce<Record<string, Lead[]>>((acc, stage) => {
    acc[stage.id] = leads.filter(
      (lead) => (lead.lead_status || 'New Lead').toLowerCase() === stage.id.toLowerCase()
    );
    return acc;
  }, {});

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      onUpdateLeadStage(leadId, stageId);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 md:p-6 overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>Pipeline Board</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-semibold">
              {leads.length} Total Leads
            </span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400">
            Drag cards between stages or click to view 360° lead details.
          </p>
        </div>

        <button
          onClick={() => onOpenNewLead(activeMobileStage)}
          className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Add Lead</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE STAGE TABS CAROUSEL (Visible on < lg screens) */}
      {/* ========================================================================= */}
      <div className="lg:hidden flex flex-col flex-1 overflow-hidden">
        {/* Horizontal Swipeable Stage Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none shrink-0 pr-2">
          {DEFAULT_STAGES.map((stage) => {
            const count = (leadsByStage[stage.id] || []).length;
            const isActive = activeMobileStage === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveMobileStage(stage.id)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-all shrink-0 ${
                  isActive
                    ? 'bg-brand-600 text-white border-brand-500 shadow-md scale-100'
                    : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{stage.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Stage Leads Card Feed on Mobile */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pt-2 pb-20 custom-scrollbar pr-0.5">
          {(leadsByStage[activeMobileStage] || []).length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-sm font-semibold text-slate-300">No leads in {activeMobileStage}</p>
              <p className="text-xs text-slate-400">
                Tap '+ Add Lead' to insert a lead into this stage.
              </p>
            </div>
          ) : (
            (leadsByStage[activeMobileStage] || []).map((lead) => {
              const platform = (lead.platform || '').toLowerCase();
              const configInterests = getLeadConfiguration(lead);
              const budget = getLeadBudget(lead);

              return (
                <div
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="bg-slate-900/90 active:bg-slate-800 border border-slate-800 rounded-2xl p-3.5 space-y-3 cursor-pointer shadow-sm"
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-100 truncate">
                        {lead.full_name || 'Unnamed Lead'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{lead.phone_number || '-'}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {platform && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                            platform.includes('ig') || platform.includes('instagram')
                              ? 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30'
                              : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          }`}
                        >
                          {platform.includes('ig') || platform.includes('instagram') ? 'IG' : 'FB'}
                        </span>
                      )}
                      {lead.sheet_source && (
                        <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-800 text-brand-300 border border-slate-700">
                          {lead.sheet_source}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Requirements & Budget */}
                  {(configInterests || budget) && (
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-slate-300">
                      {configInterests && (
                        <span className="font-medium text-brand-300 truncate">{configInterests}</span>
                      )}
                      {budget && (
                        <span className="font-medium text-emerald-400 shrink-0">{budget}</span>
                      )}
                    </div>
                  )}

                  {/* 1-Tap Quick Action Row & Stage Switcher */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-800 gap-2">
                    <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.lead_status || 'New Lead'}
                        onChange={(e) => onUpdateLeadStage(lead.id, e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none"
                      >
                        {DEFAULT_STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {lead.phone_number && (
                        <button
                          onClick={() => onOpenWhatsApp(lead)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat</span>
                        </button>
                      )}
                      {lead.phone_number && (
                        <a
                          href={`tel:${lead.phone_number}`}
                          className="p-1.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30"
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

      {/* ========================================================================= */}
      {/* DESKTOP 7-COLUMN KANBAN BOARD (Visible on >= lg screens) */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-1 space-x-3.5 overflow-x-auto pb-4 custom-scrollbar">
        {DEFAULT_STAGES.map((stage) => {
          const stageLeads = leadsByStage[stage.id] || [];

          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              className="w-80 shrink-0 bg-slate-900/70 border border-slate-800/80 rounded-2xl flex flex-col max-h-full shadow-lg backdrop-blur"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.badgeBg} ring-2 ring-slate-800`} />
                  <h3 className="font-bold text-xs text-slate-200 truncate">{stage.label}</h3>
                  <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-[10px] font-bold text-slate-400">
                    {stageLeads.length}
                  </span>
                </div>

                <button
                  onClick={() => onOpenNewLead(stage.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title={`Add lead to ${stage.label}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar">
                {stageLeads.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-800/80 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs p-3 text-center">
                    <p className="font-medium">Drop leads here</p>
                  </div>
                ) : (
                  stageLeads.map((lead) => {
                    const platform = (lead.platform || '').toLowerCase();
                    const configInterests = getLeadConfiguration(lead);
                    const budget = getLeadBudget(lead);

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onClick={() => onSelectLead(lead)}
                        className="bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-3 space-y-2.5 cursor-grab active:cursor-grabbing transition-all shadow-sm group"
                      >
                        {/* Name & Source */}
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-bold text-xs text-slate-100 group-hover:text-brand-300 transition-colors truncate">
                            {lead.full_name || 'Unnamed Lead'}
                          </h4>
                          <div className="flex items-center gap-1 shrink-0">
                            {platform && (
                              <span
                                className={`text-[8px] font-bold px-1 rounded uppercase ${
                                  platform.includes('ig') || platform.includes('instagram')
                                    ? 'bg-fuchsia-500/15 text-fuchsia-300'
                                    : 'bg-blue-500/15 text-blue-300'
                                }`}
                              >
                                {platform.includes('ig') || platform.includes('instagram') ? 'IG' : 'FB'}
                              </span>
                            )}
                            {lead.sheet_source && (
                              <span className="text-[8px] font-medium px-1 rounded bg-slate-800 text-brand-300 border border-slate-700">
                                {lead.sheet_source}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Phone */}
                        <div className="text-[11px] text-slate-400 truncate">
                          {lead.phone_number || '-'}
                        </div>

                        {/* Configuration & Budget */}
                        {(configInterests || budget) && (
                          <div className="space-y-0.5 text-[11px] pt-1.5 border-t border-slate-800/60">
                            {configInterests && (
                              <p className="font-medium text-brand-300 truncate">
                                {configInterests}
                              </p>
                            )}
                            {budget && (
                              <p className="text-emerald-400 font-medium truncate">
                                {budget}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Quick Contact Icons */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-slate-400 text-[10px]">
                          <span className="text-slate-400 truncate max-w-[120px]">
                            {lead.campaign_name || '-'}
                          </span>

                          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            {lead.phone_number && (
                              <button
                                onClick={() => onOpenWhatsApp(lead)}
                                className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                                title="WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </button>
                            )}
                            {lead.phone_number && (
                              <a
                                href={`tel:${lead.phone_number}`}
                                className="p-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 transition-colors"
                                title="Call"
                              >
                                <Phone className="w-3 h-3" />
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
