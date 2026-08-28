import React, { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Tag, 
  Wallet, 
  Smartphone,
  Sparkles
} from 'lucide-react';
import { Lead } from '../types';

interface AnalyticsViewProps {
  leads: Lead[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ leads }) => {
  const stats = useMemo(() => {
    const total = leads.length;
    let won = 0;
    let inProgress = 0;
    let lost = 0;
    let newLeads = 0;

    const campaignCounts: Record<string, number> = {};
    const platformCounts: Record<string, number> = { facebook: 0, instagram: 0, direct: 0 };
    const configCounts: Record<string, number> = {};
    const budgetCounts: Record<string, number> = {};

    leads.forEach((lead) => {
      const status = (lead.lead_status || 'New Lead').toLowerCase();
      if (status.includes('won') || status.includes('converted') || status.includes('closed')) {
        won++;
      } else if (status.includes('lost') || status.includes('disqualified') || status.includes('junk')) {
        lost++;
      } else if (status === 'new lead' || status === 'new') {
        newLeads++;
      } else {
        inProgress++;
      }

      // Campaign
      const camp = lead.campaign_name?.trim() || 'Unspecified Campaign';
      campaignCounts[camp] = (campaignCounts[camp] || 0) + 1;

      // Platform
      const plat = (lead.platform || '').toLowerCase();
      if (plat.includes('ig') || plat.includes('instagram')) {
        platformCounts.instagram++;
      } else if (plat.includes('fb') || plat.includes('facebook')) {
        platformCounts.facebook++;
      } else {
        platformCounts.direct++;
      }

      // Configuration
      const cfg = lead['which_configuration_are_you_interested_in?']?.trim() || 'Unspecified';
      configCounts[cfg] = (configCounts[cfg] || 0) + 1;

      // Budget
      const bdg = lead['what_is_your_budget?']?.trim() || 'Unspecified';
      budgetCounts[bdg] = (budgetCounts[bdg] || 0) + 1;
    });

    const conversionRate = total > 0 ? ((won / total) * 100).toFixed(1) : '0';

    return {
      total,
      won,
      inProgress,
      lost,
      newLeads,
      conversionRate,
      campaignCounts,
      platformCounts,
      configCounts,
      budgetCounts,
    };
  }, [leads]);

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-400" />
          <span>Meta Ads Campaign Intelligence</span>
        </h2>
        <p className="text-xs text-slate-400">
          Real-time performance analytics calculated directly from your live Google Sheets
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
            <span>Total Leads</span>
            <Users className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-black text-slate-100">{stats.total}</p>
          <p className="text-[11px] text-slate-400 mt-1">Live from Meta sheets</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
            <span>Active in Pipeline</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{stats.inProgress + stats.newLeads}</p>
          <p className="text-[11px] text-slate-400 mt-1">{stats.newLeads} new inquiries</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
            <span>Won / Converted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{stats.won}</p>
          <p className="text-[11px] text-emerald-400 font-semibold mt-1">
            {stats.conversionRate}% Conversion rate
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
            <span>Lost / Junk</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400">{stats.lost}</p>
          <p className="text-[11px] text-slate-400 mt-1">Disqualified leads</p>
        </div>
      </div>

      {/* Breakdown Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campaign Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            <span>Leads by Meta Campaign</span>
          </h3>
          <div className="space-y-2.5">
            {Object.entries(stats.campaignCounts).length === 0 ? (
              <p className="text-xs text-slate-400">No campaigns recorded</p>
            ) : (
              Object.entries(stats.campaignCounts).map(([camp, count]) => {
                const pct = stats.total > 0 ? ((count / stats.total) * 100).toFixed(0) : '0';
                return (
                  <div key={camp} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300 truncate max-w-[240px]">{camp}</span>
                      <span className="text-slate-400 font-semibold">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-fuchsia-400" />
            <span>Platform Distribution</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Instagram */}
            <div className="p-4 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-center">
              <span className="text-xs font-bold text-fuchsia-300 uppercase tracking-wider block">Instagram</span>
              <span className="text-2xl font-extrabold text-fuchsia-200 mt-1 block">
                {stats.platformCounts.instagram}
              </span>
              <span className="text-[11px] text-fuchsia-400/80">
                {stats.total > 0 ? ((stats.platformCounts.instagram / stats.total) * 100).toFixed(0) : 0}% of leads
              </span>
            </div>

            {/* Facebook */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
              <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block">Facebook</span>
              <span className="text-2xl font-extrabold text-blue-200 mt-1 block">
                {stats.platformCounts.facebook}
              </span>
              <span className="text-[11px] text-blue-400/80">
                {stats.total > 0 ? ((stats.platformCounts.facebook / stats.total) * 100).toFixed(0) : 0}% of leads
              </span>
            </div>
          </div>

          {/* Configuration Breakdown */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand-400" />
              <span>Configurations in Demand</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(stats.configCounts).map(([cfg, cnt]) => (
                <span
                  key={cfg}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-200 border border-slate-700"
                >
                  <span className="font-semibold text-brand-300">{cfg}:</span> {cnt}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
