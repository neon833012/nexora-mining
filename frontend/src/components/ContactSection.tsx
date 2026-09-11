import React, { useState } from 'react';
import { Send } from 'lucide-react';

export const ContactSection: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
  };

  return (
    <section className="w-full px-4">
      <div>
        <span className="text-[11px] font-bold tracking-[1.2px] text-[#00F0FF] uppercase">
          CONTACT
        </span>
        <h2 className="text-[22px] font-bold text-[#F8FAFC]">
          Get in touch
        </h2>
        <p className="mt-1 text-[12px] text-[#94A3B8]">
          Questions about mining plans, referrals, or cloud computing? Send a message below.
        </p>
      </div>

      <div className="mt-3.5 rounded-[14px] bg-[#0C1424] border border-[#1B2A42] p-4 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[12px] font-medium text-[#94A3B8] block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
              className="mt-1 w-full rounded-lg bg-[#070E1A] border border-[#1B2A40] px-3 py-2 text-[14px] text-[#F8FAFC] focus:outline-none focus:border-[#00F0FF] transition-colors"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-[#94A3B8] block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="mt-1 w-full rounded-lg bg-[#070E1A] border border-[#1B2A40] px-3 py-2 text-[14px] text-[#F8FAFC] focus:outline-none focus:border-[#00F0FF] transition-colors"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-[#94A3B8] block">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="How can we help?"
              required
              className="mt-1 w-full rounded-lg bg-[#070E1A] border border-[#1B2A40] px-3 py-2 text-[14px] text-[#F8FAFC] focus:outline-none focus:border-[#00F0FF] transition-colors"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-[#94A3B8] block">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us more..."
              required
              rows={3}
              className="mt-1 w-full rounded-lg bg-[#070E1A] border border-[#1B2A40] p-3 text-[14px] text-[#F8FAFC] focus:outline-none focus:border-[#00F0FF] transition-colors resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#64748B]">
              support@neon-mining.io
            </span>

            <button
              type="submit"
              className="px-3.5 py-2 rounded-md bg-[#0284C7] text-white font-bold text-[12px] flex items-center gap-1.5 hover:bg-[#0369A1] shadow-[0_0_10px_rgba(2,132,199,0.3)] transition-all cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send message</span>
            </button>
          </div>

          {submitted && (
            <p className="mt-2 text-[12px] font-medium text-[#10B981]">
              ✓ Message sent to Neon support desk.
            </p>
          )}
        </form>
      </div>
    </section>
  );
};
