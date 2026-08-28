import React, { useState } from 'react';
import { X, MessageSquare, Send, Sparkles, Copy, Check } from 'lucide-react';
import { Lead } from '../types';

interface WhatsAppTemplateModalProps {
  lead: Lead | null;
  onClose: () => void;
  onLogged?: () => void;
}

export const WhatsAppTemplateModal: React.FC<WhatsAppTemplateModalProps> = ({
  lead,
  onClose
}) => {
  if (!lead) return null;

  const leadName = lead.full_name || 'Client';
  const config = lead['which_configuration_are_you_interested_in?'] || 'our advisory services';
  const budget = lead['what_is_your_budget?'] || 'your stated budget';
  const campaign = lead.campaign_name || 'VS Advisory';

  const templates = [
    {
      id: 'template_1',
      title: '💼 Advisory Consultation Intro',
      text: `Hello ${leadName},\n\nThank you for reaching out to *VS Advisory* regarding *${config}*.\n\nWe would love to understand your requirements and schedule a brief 10-minute consultation. When would be a good time to connect today?`
    },
    {
      id: 'template_2',
      title: '🎯 Requirement & Budget Follow-up',
      text: `Hi ${leadName},\n\nThis is regarding your recent inquiry on *${campaign}* for *${config}* (Budget: ${budget}).\n\nI have prepared the initial advisory overview. Would you like me to share the details here on WhatsApp?`
    },
    {
      id: 'template_3',
      title: '📅 Meeting / Strategy Call Schedule',
      text: `Hi ${leadName},\n\nFollowing up from *VS Advisory*. We have open slots for an advisory strategy session tomorrow at 11:00 AM or 4:00 PM. Which slot works better for you?`
    }
  ];

  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [customMessage, setCustomMessage] = useState(templates[0].text);
  const [copied, setCopied] = useState(false);

  const handleSelectTemplate = (idx: number) => {
    setSelectedTemplateIndex(idx);
    setCustomMessage(templates[idx].text);
  };

  const handleSendWhatsApp = () => {
    let phone = lead.phone_number.replace(/[^0-9]/g, '');
    
    // Auto prefix 91 if 10 digits (India)
    if (phone.length === 10) {
      phone = '91' + phone;
    }

    const encodedText = encodeURIComponent(customMessage);
    const waUrl = `https://wa.me/${phone}?text=${encodedText}`;
    window.open(waUrl, '_blank');
    onClose();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Send WhatsApp Message</h3>
              <p className="text-xs text-slate-400">
                To <span className="font-semibold text-slate-200">{lead.full_name}</span> ({lead.phone_number})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Template Selection Tabs */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2">
              Select Message Template
            </label>
            <div className="grid grid-cols-1 gap-2">
              {templates.map((tpl, idx) => (
                <button
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(idx)}
                  className={`text-left p-2.5 rounded-xl text-xs transition-all border ${
                    selectedTemplateIndex === idx
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold'
                      : 'bg-slate-800/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {tpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Editable Message Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                Message Preview
              </label>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={6}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-3.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 leading-relaxed custom-scrollbar"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Open WhatsApp Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
