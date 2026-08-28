import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  Building2 
} from 'lucide-react';
import { Lead } from '../types';

interface WhatsAppTemplateModalProps {
  lead: Lead;
  onClose: () => void;
}

interface Template {
  id: string;
  title: string;
  category: 'Greeting' | 'Follow-up' | 'Site Visit' | 'Brochure';
  text: (lead: Lead) => string;
}

export const WhatsAppTemplateModal: React.FC<WhatsAppTemplateModalProps> = ({
  lead,
  onClose
}) => {
  const templates: Template[] = [
    {
      id: 'greeting',
      title: 'First Intro & Brochure Offer',
      category: 'Greeting',
      text: (l) =>
        `Hi ${l.full_name || 'there'}! 👋\nThank you for your interest in our advisory regarding ${
          l['which_configuration_are_you_interested_in?'] || 'our premium property portfolio'
        }.\n\nWould you like me to share the verified brochure and pricing breakdown with you right here on WhatsApp?`
    },
    {
      id: 'site_visit',
      title: 'Site Visit / Consultation Invitation',
      category: 'Site Visit',
      text: (l) =>
        `Hello ${l.full_name || 'Sir/Ma\'am'},\nRegarding your enquiry for ${
          l.campaign_name || 'our exclusive project'
        }, we are hosting private site visits and consultations this week.\n\nWhich day and time slot works best for you?`
    },
    {
      id: 'budget_match',
      title: 'Tailored Budget Options',
      category: 'Follow-up',
      text: (l) =>
        `Hello ${l.full_name || ''},\nBased on your requested budget (${
          l['what_is_your_budget?'] || 'your preference'
        }), I have curated 2 verified high-ROI opportunities that match your criteria.\n\nLet me know if you would like me to send the comparative analysis!`
    },
    {
      id: 'follow_up',
      title: 'Gentle Check-in',
      category: 'Follow-up',
      text: (l) =>
        `Hi ${l.full_name || ''},\nJust checking in to see if you had a chance to review our initial consultation notes. Please let me know if you have any questions!`
    }
  ];

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('greeting');
  const [customMessage, setCustomMessage] = useState<string>(templates[0].text(lead));
  const [copied, setCopied] = useState(false);

  const handleSelectTemplate = (t: Template) => {
    setSelectedTemplateId(t.id);
    setCustomMessage(t.text(lead));
  };

  const handleSendWhatsApp = () => {
    let phone = (lead.phone_number || '').replace(/[^0-9]/g, '');
    if (phone.length === 10) {
      phone = '91' + phone; // Default to India country code if 10 digits
    }
    const encoded = encodeURIComponent(customMessage);
    const url = `https://wa.me/${phone}?text=${encoded}`;
    window.open(url, '_blank');
    onClose();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in-50">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden z-10 animate-in slide-in-from-bottom-10 sm:zoom-in-95">
        
        {/* Mobile Grab Handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-slate-700" />
        </div>

        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90 backdrop-blur">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100">1-Click WhatsApp Messenger</h3>
              <p className="text-[11px] text-slate-400">
                To: <span className="font-semibold text-slate-200">{lead.full_name}</span> ({lead.phone_number || 'No number'})
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs custom-scrollbar">
          {/* Templates Selector Pills */}
          <div>
            <label className="block text-slate-400 font-semibold mb-2">Select Advisory Template</label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedTemplateId === t.id
                      ? 'bg-brand-600/20 border-brand-500 text-brand-300 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="font-bold text-xs truncate">{t.title}</p>
                  <p className="text-[10px] text-slate-500 uppercase mt-0.5">{t.category}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Editable Message Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-semibold">Message Preview</label>
              <button
                onClick={handleCopyText}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <textarea
              rows={5}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-3.5 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Sticky Bottom Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 backdrop-blur flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSendWhatsApp}
            disabled={!lead.phone_number}
            className="flex-1 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Open in WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
