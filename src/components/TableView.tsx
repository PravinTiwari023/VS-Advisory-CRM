import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Search, 
  MessageSquare, 
  Phone, 
  Mail, 
} from 'lucide-react';
import { Lead, DEFAULT_STAGES, SheetConfig } from '../types';

interface TableViewProps {
  leads: Lead[];
  config: SheetConfig;
  onSelectLead: (lead: Lead) => void;
  onOpenWhatsApp: (lead: Lead) => void;
  onUpdateLeadStage: (leadId: string, newStage: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  leads,
  config,
  onSelectLead,
  onOpenWhatsApp,
  onUpdateLeadStage
}) => {
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('ALL');
  const [filterPlatform, setFilterPlatform] = useState('ALL');
  const [filterCampaign, setFilterCampaign] = useState('ALL');
  const [filterStage, setFilterStage] = useState('ALL');

  // Dynamic unique list of source sheets from leads or config
  const sourceSheets = useMemo(() => {
    const set = new Set<string>();
    if (config.sheets) {
      config.sheets.forEach((s) => {
        if (s.name && s.name.trim()) set.add(s.name.trim());
      });
    }
    leads.forEach((l) => {
      if (l.sheet_source && l.sheet_source.trim()) set.add(l.sheet_source.trim());
    });
    return Array.from(set);
  }, [config.sheets, leads]);

  // Unique campaigns
  const campaigns = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.campaign_name && l.campaign_name.trim()) set.add(l.campaign_name.trim());
    });
    return Array.from(set);
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = lead.full_name?.toLowerCase().includes(q);
        const matchesPhone = lead.phone_number?.toLowerCase().includes(q);
        const matchesEmail = lead.email?.toLowerCase().includes(q);
        const matchesCampaign = lead.campaign_name?.toLowerCase().includes(q);
        const matchesAd = lead.ad_name?.toLowerCase().includes(q);
        const matchesConfig = lead['which_configuration_are_you_interested_in?']?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesCampaign && !matchesAd && !matchesConfig) {
          return false;
        }
      }

      // Source Sheet Filter
      if (filterSource !== 'ALL' && lead.sheet_source !== filterSource) {
        return false;
      }

      // Platform Filter
      if (filterPlatform !== 'ALL') {
        const plat = (lead.platform || '').toLowerCase();
        if (filterPlatform === 'fb' && !plat.includes('fb') && !plat.includes('facebook')) return false;
        if (filterPlatform === 'ig' && !plat.includes('ig') && !plat.includes('instagram')) return false;
      }

      // Campaign Filter
      if (filterCampaign !== 'ALL' && lead.campaign_name !== filterCampaign) {
        return false;
      }

      // Stage Filter
      if (filterStage !== 'ALL') {
        const status = (lead.lead_status || 'New Lead').toLowerCase();
        if (!status.includes(filterStage.toLowerCase())) return false;
      }

      return true;
    });
  }, [leads, search, filterSource, filterPlatform, filterCampaign, filterStage]);

  // CSV Exporter
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;

    const headers = [
      'ID',
      'Created Time',
      'Full Name',
      'Phone Number',
      'Email',
      'Status / Stage',
      'Configuration Interested In',
      'Budget',
      'Campaign Name',
      'Ad Name',
      'Platform',
      'Source Sheet',
      'CRM Notes',
      'Assigned To'
    ];

    const rows = filteredLeads.map((l) => [
      `"${l.id || ''}"`,
      `"${l.created_time || ''}"`,
      `"${l.full_name || ''}"`,
      `"${l.phone_number || ''}"`,
      `"${l.email || ''}"`,
      `"${l.lead_status || ''}"`,
      `"${l['which_configuration_are_you_interested_in?'] || ''}"`,
      `"${l['what_is_your_budget?'] || ''}"`,
      `"${l.campaign_name || ''}"`,
      `"${l.ad_name || ''}"`,
      `"${l.platform || ''}"`,
      `"${l.sheet_source || ''}"`,
      `"${(l.crm_notes || '').replace(/"/g, '""')}"`,
      `"${l.crm_assigned_to || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VS_Advisory_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Meta Ads Leads Directory</h2>
          <p className="text-xs text-slate-400">
            Displaying <span className="font-semibold text-brand-400">{filteredLeads.length}</span> of{' '}
            <span className="font-semibold text-slate-300">{leads.length}</span> total leads across your connected sheets
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            disabled={filteredLeads.length === 0}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-brand-400" />
            <span>Export to CSV</span>
          </button>
        </div>
      </div>

      {/* Multi-Filters Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* Search */}
        <div className="relative lg:col-span-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Dynamic Source Sheet Filter */}
        <div>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 truncate"
          >
            <option value="ALL">All Connected Sheets ({sourceSheets.length})</option>
            {sourceSheets.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Platform Filter */}
        <div>
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="ALL">All Platforms</option>
            <option value="fb">Facebook (FB)</option>
            <option value="ig">Instagram (IG)</option>
          </select>
        </div>

        {/* Stage Filter */}
        <div>
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="ALL">All Stages</option>
            {DEFAULT_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Campaign Filter */}
        <div>
          <select
            value={filterCampaign}
            onChange={(e) => setFilterCampaign(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 truncate"
          >
            <option value="ALL">All Campaigns ({campaigns.length})</option>
            {campaigns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 font-semibold sticky top-0 z-10 backdrop-blur">
                <th className="py-3 px-4">Lead Info</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Requirements & Budget</th>
                <th className="py-3 px-4">Campaign & Ad</th>
                <th className="py-3 px-4">Stage / Status</th>
                <th className="py-3 px-4">Created Time</th>
                <th className="py-3 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-300">No leads found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or connect additional sheets</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const platform = lead.platform?.toLowerCase() || '';
                  const configInterests = lead['which_configuration_are_you_interested_in?'] || lead.configuration;
                  const budget = lead['what_is_your_budget?'] || lead.budget;

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    >
                      {/* Lead Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100 group-hover:text-brand-300 transition-colors">
                          {lead.full_name || 'Unnamed Lead'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {platform && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                                platform.includes('ig') || platform.includes('instagram')
                                  ? 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30'
                                  : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                              }`}
                            >
                              {platform.includes('ig') || platform.includes('instagram') ? 'Instagram' : 'Facebook'}
                            </span>
                          )}
                          {lead.sheet_source && (
                            <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-800 text-brand-300 border border-slate-700">
                              {lead.sheet_source}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="text-slate-200 font-medium">{lead.phone_number || '-'}</div>
                        <div className="text-slate-400 text-[11px] truncate max-w-[180px]">
                          {lead.email || '-'}
                        </div>
                      </td>

                      {/* Requirements & Budget */}
                      <td className="py-3.5 px-4 space-y-1">
                        {configInterests ? (
                          <div className="inline-block px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20 font-medium text-[11px]">
                            {configInterests}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                        {budget && (
                          <div className="text-slate-300 font-medium text-[11px] flex items-center gap-1">
                            <span className="text-emerald-400">Budget:</span> {budget}
                          </div>
                        )}
                      </td>

                      {/* Campaign & Ad */}
                      <td className="py-3.5 px-4 space-y-0.5 max-w-[200px]">
                        <div className="text-slate-200 font-medium truncate" title={lead.campaign_name}>
                          {lead.campaign_name || '-'}
                        </div>
                        <div className="text-slate-400 text-[11px] truncate" title={lead.ad_name}>
                          {lead.ad_name || lead.form_name || '-'}
                        </div>
                      </td>

                      {/* Stage Selector */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.lead_status || 'New Lead'}
                          onChange={(e) => onUpdateLeadStage(lead.id, e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                        >
                          {DEFAULT_STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Created Time */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {formatDate(lead.created_time)}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {lead.phone_number && (
                            <button
                              onClick={() => onOpenWhatsApp(lead)}
                              className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-colors"
                              title="Open WhatsApp Chat"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {lead.phone_number && (
                            <a
                              href={`tel:${lead.phone_number}`}
                              className="p-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 transition-colors"
                              title="Direct Phone Call"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              className="p-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 transition-colors"
                              title="Send Email"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
