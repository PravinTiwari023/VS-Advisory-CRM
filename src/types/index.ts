export interface Lead {
  id: string;
  created_time?: string;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
  form_name?: string;
  is_organic?: string | boolean;
  platform?: string;
  // Kanakia Column
  'which_configuration_are_you_interested_in?'?: string;
  // H.Rishabraj Column
  'what_are_you_looking_for?'?: string;
  'what_are_you_looking_for'?: string;
  // Fallbacks
  configuration?: string;
  // Kanakia Column
  'what_is_your_budget?'?: string;
  // H.Rishabraj Column
  'what_is_your_budget'?: string;
  budget?: string;
  full_name: string;
  phone_number: string;
  email?: string;
  lead_status?: string;

  // Multi-sheet attribution
  sheet_source?: string;
  sheet_color?: string;
  spreadsheet_id?: string;
  sheet_name?: string;
  row_index?: number;

  // CRM Enhanced Fields
  crm_assigned_to?: string;
  crm_notes?: string;
  crm_deal_value?: string;
  crm_next_follow_up?: string;
  crm_last_contacted?: string;
}

export function getLeadConfiguration(lead: Lead | null | undefined): string {
  if (!lead) return '';
  const val = (
    lead['which_configuration_are_you_interested_in?'] ||
    lead['what_are_you_looking_for?'] ||
    lead['what_are_you_looking_for'] ||
    lead.configuration ||
    (lead as any)['which_configuration_are_you_interested_in'] ||
    (lead as any)['interested_in'] ||
    (lead as any)['looking_for'] ||
    (lead as any)['requirement'] ||
    ''
  );
  return String(val || '').trim();
}

export function getLeadBudget(lead: Lead | null | undefined): string {
  if (!lead) return '';
  const val = (
    lead['what_is_your_budget?'] ||
    lead['what_is_your_budget'] ||
    lead.budget ||
    (lead as any)['price_range'] ||
    (lead as any)['budget_range'] ||
    ''
  );
  return String(val || '').trim();
}

export interface PipelineStage {
  id: string;
  label: string;
  color: string;
  order: number;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}

export const DEFAULT_STAGES: PipelineStage[] = [
  { 
    id: 'New Lead', 
    label: 'New Lead', 
    color: 'emerald', 
    order: 1,
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400',
    borderColor: 'border-emerald-500/30'
  },
  { 
    id: 'Contacted', 
    label: 'Contacted', 
    color: 'sky', 
    order: 2,
    badgeBg: 'bg-sky-500/10',
    badgeText: 'text-sky-400',
    borderColor: 'border-sky-500/30'
  },
  { 
    id: 'Interested', 
    label: 'Interested', 
    color: 'blue', 
    order: 3,
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-400',
    borderColor: 'border-blue-500/30'
  },
  { 
    id: 'Site Visit / Consultation', 
    label: 'Site Visit', 
    color: 'purple', 
    order: 4,
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-400',
    borderColor: 'border-purple-500/30'
  },
  { 
    id: 'Negotiation', 
    label: 'Negotiation', 
    color: 'amber', 
    order: 5,
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    borderColor: 'border-amber-500/30'
  },
  { 
    id: 'Closed Won', 
    label: 'Closed Won', 
    color: 'teal', 
    order: 6,
    badgeBg: 'bg-teal-500/10',
    badgeText: 'text-teal-400',
    borderColor: 'border-teal-500/30'
  },
  { 
    id: 'Not Interested / Lost', 
    label: 'Lost / Dropped', 
    color: 'rose', 
    order: 7,
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-400',
    borderColor: 'border-rose-500/30'
  },
];

export function normalizeStage(rawStatus?: string): string {
  if (!rawStatus) return 'New Lead';
  const s = String(rawStatus).trim().toLowerCase().replace(/[-_]+/g, ' ');
  
  if (s.includes('new') || s === '' || s.includes('lead')) return 'New Lead';
  if (s.includes('contact') || s.includes('call') || s.includes('reach')) return 'Contacted';
  if (s.includes('interest') || s.includes('warm') || s.includes('hot')) return 'Interested';
  if (s.includes('site') || s.includes('visit') || s.includes('consult') || s.includes('meet')) return 'Site Visit / Consultation';
  if (s.includes('nego') || s.includes('offer') || s.includes('deal') || s.includes('discuss')) return 'Negotiation';
  if (s.includes('won') || s.includes('close') || s.includes('book') || s.includes('sold')) return 'Closed Won';
  if (s.includes('lost') || s.includes('drop') || s.includes('not') || s.includes('junk') || s.includes('fake')) return 'Not Interested / Lost';

  // Direct match fallback
  const found = DEFAULT_STAGES.find(st => st.id.toLowerCase() === s || st.label.toLowerCase() === s);
  if (found) return found.id;

  return 'New Lead';
}

export interface ConnectedSheet {
  id: string;
  name: string;
  spreadsheetId: string;
  tabName?: string;
  enabled?: boolean;
  color?: string;
}

export const SHEET_COLORS = [
  { id: 'emerald', label: 'Emerald Green', bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  { id: 'sky', label: 'Sky Blue', bg: 'bg-sky-500/15', text: 'text-sky-300', border: 'border-sky-500/30' },
  { id: 'purple', label: 'Purple Violet', bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
  { id: 'amber', label: 'Warm Amber', bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30' },
  { id: 'rose', label: 'Coral Rose', bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500/15', text: 'text-indigo-300', border: 'border-indigo-500/30' },
];

export interface SheetConfig {
  scriptUrl: string;
  sheets: ConnectedSheet[];
  lastSynced?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  pin: string;
  role: 'Admin' | 'Advisor' | 'Viewer';
  avatar?: string;
}

export interface Activity {
  id: string;
  lead_id: string;
  type: 'Call' | 'WhatsApp' | 'Email' | 'Meeting' | 'Note' | 'Status Change';
  summary: string;
  details?: string;
  date: string;
  logged_by: string;
}

export interface Task {
  id: string;
  lead_id: string;
  lead_name?: string;
  title: string;
  description?: string;
  due_date: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed';
  assigned_to?: string;
}

export interface SpreadsheetInfo {
  title: string;
  id: string;
  tabs: {
    name: string;
    rowCount: number;
    headers: string[];
  }[];
  error?: string;
}
