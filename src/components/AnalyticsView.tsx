import React, { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  PieChart as PieIcon, 
  DollarSign, 
  Layers,
  Sparkles,
  ArrowUpRight,
  Building2
} from 'lucide-react';
import { Lead, DEFAULT_STAGES, getLeadConfiguration, getLeadBudget } from '../types';

interface AnalyticsViewProps {
  leads: Lead[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ leads }) => {
  const totalLeads = leads.length;

  // Platform Distribution
  const platformStats = useMemo(() => {
    let fb = 0;
    let ig = 0;
    let other = 0;

    leads.forEach((l) => {
      const p = (l.platform || '').toLowerCase();
      if (p.includes('ig') || p.includes('instagram')) ig++;
      else if (p.includes('fb') || p.includes('facebook')) fb++;
      else other++;
    });

    return { fb, ig, other };
  }, [leads]);

  // Campaign Distribution
  const campaignStats = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const c = l.campaign_name || 'Direct / Unknown';
      counts[c] = (counts[c] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [leads]);

  // Configuration Requirements Distribution
  const configStats = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const c = getLeadConfiguration(l) || 'Unspecified';
      counts[c] = (counts[c] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [leads]);

  // Stage Pipeline Distribution
  const stageStats = useMemo(() => {
    return DEFAULT_STAGES.map((s) => {
      const count = leads.filter(
        (l) => (l.lead_status || 'New Lead').toLowerCase() === s.id.toLowerCase()
      ).length;
      const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
      return { ...s, count, percentage };
    });
  }, [leads, totalLeads]);

  // Conversion Metrics
  const closedWonCount = stageStats.find((s) => s.id === 'Closed Won')?.count || 0;
  const siteVisitCount = stageStats.find((s) => s.id === 'Site Visit / Consultation')?.count || 0;
  const winRate = totalLeads > 0 ? ((closedWonCount / totalLeads) * 100).toFixed(1) : '0.0';

  return (
    <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto custom-scrollbar space-y-4 sm:space-y-6 pb-24 lg:pb-8">
      {/* Top Header */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-400" />
          <span>Meta Ads & Advisory Analytics</span>
        </h2>
        <p className="text-xs text-slate-400">
          Real-time performance metrics across all connected sheets and campaigns.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Leads</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl sm:text-2xl font-black text-slate-100">{totalLeads}</h3>
            <span className="text-[10px] font-bold text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> Live
            </span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Instagram (IG)</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl sm:text-2xl font-black text-fuchsia-300">{platformStats.ig}</h3>
            <span className="text-[10px] font-bold text-slate-400">
              {totalLeads > 0 ? Math.round((platformStats.ig / totalLeads) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Facebook (FB)</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl sm:text-2xl font-black text-blue-300">{platformStats.fb}</h3>
            <span className="text-[10px] font-bold text-slate-400">
              {totalLeads > 0 ? Math.round((platformStats.fb / totalLeads) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Site Visits</p>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl sm:text-2xl font-black text-brand-400">{siteVisitCount}</h3>
            <span className="text-[10px] font-bold text-brand-300">
              {winRate}% Closed
            </span>
          </div>
        </div>
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline Stage Breakdown */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-sm">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            <span>Pipeline Conversion Funnel</span>
          </h3>

          <div className="space-y-2.5">
            {stageStats.map((s) => (
              <div key={s.id} className="space-y-1 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-semibold">{s.label}</span>
                  <span className="text-slate-400 font-mono">
                    {s.count} ({s.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Interested Breakdown */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-sm">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-400" />
            <span>Property & Configuration Demand</span>
          </h3>

          <div className="space-y-2.5">
            {configStats.map((c) => {
              const percentage = totalLeads > 0 ? Math.round((c.count / totalLeads) * 100) : 0;
              return (
                <div key={c.name} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-semibold truncate max-w-[200px]">{c.name}</span>
                    <span className="text-slate-400 font-mono">
                      {c.count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
