export interface Lead {
  id: string;
  created_time: string;
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
  'which_configuration_are_you_interested_in?'?: string;
  'what_is_your_budget?'?: string;
  full_name: string;
  phone_number: string;
  email: string;
  lead_status: string;

  // CRM Extended properties
  crm_notes?: string;
  crm_assigned_to?: string;
  crm_deal_value?: number | string;
  crm_next_follow_up?: string;
  crm_last_contacted?: string;
  sheet_source?: string;
  sheet_color?: string;
  spreadsheet_id?: string;
  sheet_name?: string;
  row_index?: number;
  [key: string]: any;
}

export interface User {
  id: string;
  name: string;
  email: string;
  pin: string;
  role: 'Admin' | 'Advisor' | 'Manager';
  avatar?: string;
}

export interface Activity {
  id: string;
  lead_id: string;
  type: 'Call' | 'WhatsApp' | 'Meeting' | 'Email' | 'Note' | 'Stage_Change';
  summary: string;
  details?: string;
  date: string;
  logged_by: string;
}

export interface Task {
  id: string;
  lead_id?: string;
  lead_name?: string;
  title: string;
  description?: string;
  due_date: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed';
  assigned_to: string;
}

export interface SheetTabInfo {
  name: string;
  rowCount: number;
  headers: string[];
}

export interface SpreadsheetInfo {
  title: string;
  id: string;
  tabs: SheetTabInfo[];
}

export interface ConnectedSheet {
  id: string;
  name: string;
  spreadsheetId: string;
  tabName?: string;
  enabled: boolean;
  color: string;
  leadCount?: number;
}

export interface SheetConfig {
  scriptUrl: string;
  sheets: ConnectedSheet[];
  lastSynced?: string;
}

export type PipelineStage = 
  | 'New Lead'
  | 'Contacted / In Progress'
  | 'Interested'
  | 'Site Visit / Meeting Scheduled'
  | 'Proposal / Negotiation'
  | 'Won / Converted'
  | 'Lost / Disqualified';

export const DEFAULT_STAGES: { id: PipelineStage; label: string; color: string; bg: string; border: string }[] = [
  { id: 'New Lead', label: 'New Lead', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  { id: 'Contacted / In Progress', label: 'Contacted', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { id: 'Interested', label: 'Interested', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { id: 'Site Visit / Meeting Scheduled', label: 'Meeting / Visit', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  { id: 'Proposal / Negotiation', label: 'Proposal / Neg.', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  { id: 'Won / Converted', label: 'Won / Converted', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { id: 'Lost / Disqualified', label: 'Lost / Junk', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' }
];

export const SHEET_COLORS = [
  { id: 'emerald', label: 'Emerald Green', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  { id: 'sky', label: 'Sky Blue', bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  { id: 'amber', label: 'Amber Orange', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  { id: 'fuchsia', label: 'Fuchsia Pink', bg: 'bg-fuchsia-500/15', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30' },
  { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
];
