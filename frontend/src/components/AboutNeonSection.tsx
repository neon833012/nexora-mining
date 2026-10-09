import React from 'react';
import {
  Cloud,
  Network,
  Cpu,
  GitBranch,
  Award,
  Globe,
  Leaf,
  ShieldCheck,
  Server,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  Building2,
  UserCheck,
  TrendingUp,
  Crown,
  Layers,
  Coins,
  Repeat
} from 'lucide-react';

export const AboutNeonSection: React.FC = () => {
  return (
    <section className="w-full px-3.5 sm:px-4 space-y-6 animate-fadeIn text-[#F8FAFC]">
      {/* ===================== 1. HERO STORYTELLING HEADER ===================== */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#0A1628] via-[#060D1A] to-[#040812] border border-[#182C48] p-5 sm:p-7 shadow-2xl overflow-hidden">
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-cyan-400 text-[10.5px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Clock className="w-3.5 h-3.5" />
              ESTABLISHED 2013 • 13 YEARS OF CLOUD MINING EXCELLENCE
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 text-[10.5px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5" />
              100% GREEN GEOTHERMAL & HYDRO INFRASTRUCTURE
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug">
            13 Years of Industrial Mining Excellence & Next-Gen Innovation: <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-200">Neon Mining</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed max-w-3xl">
            Established in late 2013 as an independent pioneer in industrial "Mining as a Service" (MaaS), our infrastructure has grown across Iceland, Northern Europe, and North America over the past 13 years to serve more than 2,000,000 global participants. Engineered with high-efficiency geothermal and hydro-electric green power, <strong>Neon Mining</strong> represents our flagship 2026 milestone: delivering high-performance, decentralized BEP-20 cloud mining computing to the next generation of miners worldwide.
          </p>
        </div>
      </div>

      {/* ===================== 2. SCIENTIFIC & ADVISORY LEADERSHIP SPOTLIGHT ===================== */}
      <div className="space-y-4">
        {/* Card 1: Prof. Jiawei Han (Chief Scientific & Algorithmic Mining Fellow) */}
        <div className="rounded-2xl bg-gradient-to-br from-[#0B172A] via-[#0E1F38] to-[#071120] border-2 border-cyan-500/40 p-5 sm:p-6 shadow-[0_0_30px_rgba(0,240,255,0.15)] relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            {/* Desktop / Tablet Layout (sm and above) */}
            <div className="hidden sm:flex items-start gap-4.5 flex-1">
              <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-2xl overflow-hidden border-2 border-cyan-400/50 p-0.5 bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-xl shadow-cyan-500/20 shrink-0">
                <img
                  src="/jiawei_han.jpg"
                  alt="Prof. Jiawei Han"
                  className="w-full h-full object-cover object-top rounded-[14px]"
                  loading="lazy"
                />
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                    Prof. Jiawei Han
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase border border-cyan-500/40">
                    Chief Scientific & Algorithmic Mining Fellow
                  </span>
                </div>
                <p className="text-xs text-cyan-200 font-medium">
                  Pioneering Authority in Data Mining, Algorithmic Hash Optimization & Parallel Graph Compute
                </p>
                <p className="text-[11.5px] text-[#94A3B8] leading-relaxed pt-0.5 max-w-2xl">
                  Serving as Chief Scientific & Algorithmic Mining Fellow, <strong>Prof. Jiawei Han</strong> is a globally recognized titan in computer science and data mining with over 150,000+ academic citations (ACM/IEEE Fellow). In direct engineering collaboration for the <strong>Neon Mining</strong> platform, Prof. Han directed the implementation of our proprietary <em>Adaptive Hash-Balancing Architecture (AHBA)</em> and <em>Predictive Micro-Frequency Voltage Modulation</em>. His mathematical models dynamically rebalance difficulty targets across Neon Mining's 45,000+ Hydro ASIC fleet, delivering an audited <strong>+34.2% hash efficiency boost</strong> and powering automated zero-latency 24-hour yield compounding.
                </p>
              </div>
            </div>

            {/* Mobile Layout (below sm): Photo + Name in top row, full-width paragraph below */}
            <div className="sm:hidden w-full space-y-3">
              <div className="flex items-center gap-3.5">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-cyan-400/50 p-0.5 bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/20 shrink-0">
                  <img
                    src="/jiawei_han.jpg"
                    alt="Prof. Jiawei Han"
                    className="w-full h-full object-cover object-top rounded-xl"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base font-black text-white">Prof. Jiawei Han</h3>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-black uppercase border border-cyan-500/40">
                      Scientific Fellow
                    </span>
                  </div>
                  <p className="text-[11px] text-cyan-200 font-medium leading-tight">
                    ACM / IEEE Fellow • 150k+ Citations in Data Mining
                  </p>
                </div>
              </div>
              <p className="text-[11.5px] text-[#94A3B8] leading-relaxed pt-1">
                Serving as Chief Scientific & Algorithmic Mining Fellow, <strong>Prof. Jiawei Han</strong> is a globally recognized titan in computer science and data mining with over 150,000+ academic citations (ACM/IEEE Fellow). In direct engineering collaboration for the <strong>Neon Mining</strong> platform, Prof. Han directed the implementation of our proprietary <em>Adaptive Hash-Balancing Architecture (AHBA)</em> and <em>Predictive Micro-Frequency Voltage Modulation</em>. His mathematical models dynamically rebalance difficulty targets across Neon Mining's 45,000+ Hydro ASIC fleet, delivering an audited <strong>+34.2% hash efficiency boost</strong> and powering automated zero-latency 24-hour yield compounding.
              </p>
            </div>

            {/* Credentials Card (Right Side) */}
            <div className="w-full lg:w-72 p-3.5 rounded-xl bg-[#040914] border border-[#182C48] shrink-0 space-y-1.5 text-[11px]">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Algorithmic Breakthroughs
              </span>
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span><strong>+34.2% Hash Efficiency</strong> via Adaptive Hash-Balancing (AHBA)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span><strong>150k+ Academic Citations</strong> in Parallel Graph Data Mining</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span><strong>Predictive Voltage Modulation</strong> for 45,000+ Hydro ASIC Fleet</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Marina Guryeva (Chief Blockchain Adviser) */}
        <div className="rounded-2xl bg-gradient-to-br from-[#0B172A] via-[#0E1F38] to-[#071120] border-2 border-cyan-500/40 p-5 sm:p-6 shadow-[0_0_30px_rgba(0,240,255,0.15)] relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            {/* Desktop / Tablet Layout (sm and above) */}
            <div className="hidden sm:flex items-start gap-4.5 flex-1">
              <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-2xl overflow-hidden border-2 border-cyan-400/50 p-0.5 bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-xl shadow-cyan-500/20 shrink-0">
                <img
                  src="/marina_guryeva.jpg"
                  alt="Marina Guryeva"
                  className="w-full h-full object-cover object-top rounded-[14px]"
                  loading="lazy"
                />
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                    Marina Guryeva
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase border border-cyan-500/40">
                    Chief Blockchain Adviser
                  </span>
                </div>
                <p className="text-xs text-cyan-200 font-medium">
                  Pioneering Authority in Blockchain Architecture, Smart Contract Infrastructure & Web3 Ecosystems
                </p>
                <p className="text-[11.5px] text-[#94A3B8] leading-relaxed pt-0.5 max-w-2xl">
                  Serving as Chief Blockchain Adviser, <strong>Marina Guryeva</strong> brings over a decade of executive leadership, high-level blockchain advisory, and decentralized systems expertise to the <strong>Neon Mining</strong> ecosystem. Recognized globally for driving institutional Web3 adoption and consensus innovations, she advises Neon Mining's core architecture—optimizing smart contract yield dispatch, cryptographic fund security protocols, and decentralized computing infrastructure across our 45,000+ Hydro ASIC global fleet.
                </p>
              </div>
            </div>

            {/* Mobile Layout (below sm): Photo + Name in top row, full-width paragraph below */}
            <div className="sm:hidden w-full space-y-3">
              <div className="flex items-center gap-3.5">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-cyan-400/50 p-0.5 bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/20 shrink-0">
                  <img
                    src="/marina_guryeva.jpg"
                    alt="Marina Guryeva"
                    className="w-full h-full object-cover object-top rounded-xl"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base font-black text-white">Marina Guryeva</h3>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-black uppercase border border-cyan-500/40">
                      Chief Adviser
                    </span>
                  </div>
                  <p className="text-[11px] text-cyan-200 font-medium leading-tight">
                    Executive Blockchain Adviser & Web3 Pioneer
                  </p>
                </div>
              </div>
              <p className="text-[11.5px] text-[#94A3B8] leading-relaxed pt-1">
                Serving as Chief Blockchain Adviser, <strong>Marina Guryeva</strong> brings over a decade of executive leadership, high-level blockchain advisory, and decentralized systems expertise to the <strong>Neon Mining</strong> ecosystem. Recognized globally for driving institutional Web3 adoption and consensus innovations, she advises Neon Mining's core architecture—optimizing smart contract yield dispatch, cryptographic fund security protocols, and decentralized computing infrastructure across our 45,000+ Hydro ASIC global fleet.
              </p>
            </div>

            {/* Credentials Card (Right Side) */}
            <div className="w-full lg:w-72 p-3.5 rounded-xl bg-[#040914] border border-[#182C48] shrink-0 space-y-1.5 text-[11px]">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Strategic Advisory Leadership
              </span>
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span><strong>Decentralized Infrastructure</strong> & Consensus Strategy</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span><strong>Lead Architecture Adviser</strong> for Neon Web3 Cloud Engine</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span><strong>10+ Years Executive</strong> Blockchain Leadership</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== 3. THE 13-YEAR DECADE TIMELINE ===================== */}
      <div className="rounded-2xl bg-[#070E1B] border border-[#14233C] p-5 sm:p-6 space-y-4">
        <div>
          <span className="text-[10.5px] font-bold text-cyan-400 uppercase tracking-wider block">
            HISTORICAL MILESTONES (2013 — 2026+)
          </span>
          <h3 className="text-base sm:text-lg font-black text-white">
            13 Years of Mining Evolution: From Inception to Global Retail Launch
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {/* Phase 1 */}
          <div className="p-4 rounded-xl bg-[#040812] border border-[#122033] relative space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-black text-cyan-400">2013 — 2016</span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold uppercase">
                Infrastructure Inception
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">Facility Inception & Clean Energy Deployment</h4>
            <p className="text-[11.5px] text-[#94A3B8] leading-relaxed">
              Founded in late 2013 to pioneer industrial-scale cloud mining. Built our first dedicated geothermal mining facility in Iceland (2014), expanded fleet capacity to over 100,000+ miners (2015), and established long-term zero-carbon green power partnerships across Northern Europe (2016).
            </p>
          </div>

          {/* Phase 2 */}
          <div className="p-4 rounded-xl bg-[#040812] border border-[#122033] relative space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-black text-purple-400">2017 — 2025</span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-bold uppercase">
                2M+ Miners & Scale
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">Enterprise Scale & 45k+ Hydro Fleet</h4>
            <p className="text-[11.5px] text-[#94A3B8] leading-relaxed">
              Our active miner network surged past 2,000,000 participants worldwide. Constructed proprietary high-density liquid cooling facilities and deployed over 45,000 liquid-cooled Hydro ASICs across Northern Europe and North America powered by 100% sustainable zero-carbon energy.
            </p>
          </div>

          {/* Phase 3 */}
          <div className="p-4 rounded-xl bg-[#040812] border border-cyan-500/30 relative space-y-2 shadow-md shadow-cyan-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-black text-[#10B981]">2026 Flagship</span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold uppercase">
                Neon Cloud Mining
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">Neon Mining: Global Retail Launch</h4>
            <p className="text-[11.5px] text-[#94A3B8] leading-relaxed">
              In 2026, officially launched the next-generation retail cloud computing initiative: <strong>Neon Mining</strong>. Designed to bring enterprise-grade ASIC power directly to global retail users starting from just $20, featuring automated 24-hour proof-of-activity cycles, dynamic compounding, and 0% fee P2P transfers.
            </p>
          </div>
        </div>
      </div>

      {/* ===================== 4. GLOBAL MEGA-CAMPUSES ===================== */}
      <div className="rounded-2xl bg-[#070E1B] border border-[#14233C] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10.5px] font-bold text-cyan-400 uppercase tracking-wider block">
              NEON MINING INFRASTRUCTURE BACKBONE
            </span>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>4 Global Renewable Mega-Campuses Powering Neon Mining</span>
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
            Total Combined Fleet: 45,000+ Hydro ASICs
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Campus 1: Reykjavik, Iceland */}
          <div className="p-3.5 rounded-xl bg-[#040812] border border-[#122033] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>🇮🇸</span>
                <span>Reykjavik Campus</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">Iceland</span>
            </div>
            <span className="text-[10.5px] text-emerald-400 font-semibold block">100% Geothermal Energy</span>
            <div className="text-[10.5px] font-mono text-cyan-300">3,840 Units · 24.2 EH/s</div>
            <p className="text-[11px] text-gray-400">Sub-Zero Liquid Immersion (18.4°C). Zero-carbon baseload geothermal power.</p>
          </div>

          {/* Campus 2: Stavanger, Norway */}
          <div className="p-3.5 rounded-xl bg-[#040812] border border-[#122033] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>🇳🇴</span>
                <span>Stavanger Campus</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">Norway</span>
            </div>
            <span className="text-[10.5px] text-emerald-400 font-semibold block">Hydro-Electric Alpine</span>
            <div className="text-[10.5px] font-mono text-cyan-300">4,120 Units · 28.6 EH/s</div>
            <p className="text-[11px] text-gray-400">Hydro-Loop Radiator (19.1°C). Alpine hydroelectric with 99.99% substation uptime.</p>
          </div>

          {/* Campus 3: Austin, Texas, USA */}
          <div className="p-3.5 rounded-xl bg-[#040812] border border-[#122033] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>🇺🇸</span>
                <span>Austin Campus</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">Texas, USA</span>
            </div>
            <span className="text-[10.5px] text-emerald-400 font-semibold block">Direct Solar Microgrid</span>
            <div className="text-[10.5px] font-mono text-cyan-300">4,650 Units · 31.4 EH/s</div>
            <p className="text-[11px] text-gray-400">Two-Phase Immersion Tank (21.5°C). 350MW substation with intelligent ERCOT automation.</p>
          </div>

          {/* Campus 4: Quebec Hydro Hub, Canada */}
          <div className="p-3.5 rounded-xl bg-[#040812] border border-[#122033] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>🇨🇦</span>
                <span>Quebec Hydro Hub</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">Canada</span>
            </div>
            <span className="text-[10.5px] text-emerald-400 font-semibold block">James Bay Hydroelectric</span>
            <div className="text-[10.5px] font-mono text-cyan-300">2,940 Units · 19.4 EH/s</div>
            <p className="text-[11px] text-gray-400">Sub-Zero Ambient Air Exchanger (14.2°C). Low-cost industrial clean hydro power.</p>
          </div>
        </div>
      </div>

      {/* ===================== 5. CORE VALUE PILLARS ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-[#070E1B] border border-[#14233C] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">Security & 6-Digit Fund PIN</h4>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Every withdrawal and P2P transfer is locked behind cryptographic Fund PIN protection, Cold Vault reserves, and automated anti-tamper monitoring.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#070E1B] border border-[#14233C] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">Automated Daily Compounding</h4>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Daily mining rewards compound dynamically every 24 hours. Reinvest your yield into higher node tiers without touching external capital.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#070E1B] border border-[#14233C] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">Zero Maintenance Hardware</h4>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            No noise, no massive residential electric bills, and no hardware degradation. Neon Mining's technicians manage all physical clusters 24/7/365.
          </p>
        </div>
      </div>

      {/* ===================== 6. 3-TIER REFERRAL COMMISSION BREAKDOWN ===================== */}
      <div className="rounded-2xl bg-[#070E1B] border border-[#14233C] p-4 sm:p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#0E1A2E] border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Institutional 3-Tier Referral Commission Architecture</h4>
            <p className="text-[10.5px] text-[#64748B]">Active mining plan required to earn commissions & turnover bonuses</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-xl bg-[#040812] border border-cyan-500/25 p-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1">Level 1</span>
            <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono leading-none">10%</span>
            <span className="text-[10px] text-cyan-200 block mt-1 font-medium">Direct Referrals</span>
          </div>

          <div className="rounded-xl bg-[#040812] border border-blue-500/25 p-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1">Level 2</span>
            <span className="text-xl sm:text-2xl font-black text-blue-400 font-mono leading-none">5%</span>
            <span className="text-[10px] text-blue-200 block mt-1 font-medium">Secondary Team</span>
          </div>

          <div className="rounded-xl bg-[#040812] border border-purple-500/25 p-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1">Level 3</span>
            <span className="text-xl sm:text-2xl font-black text-purple-400 font-mono leading-none">2%</span>
            <span className="text-[10px] text-purple-200 block mt-1 font-medium">Network Community</span>
          </div>
        </div>
      </div>

      {/* ===================== 7. 10-TIER OVER-RIDE COMMISSION (ORC) & ROYALTY PROTOCOL ===================== */}
      <div className="rounded-2xl bg-[#070E1B] border border-[#14233C] p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#14233C]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0E1A2E] border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>10-Tier Over-Ride Commission (ORC) & Royalty Protocol</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[9.5px] font-black uppercase tracking-wider hidden xs:inline-block">
                  Daily Yield Royalty
                </span>
              </h4>
              <p className="text-[10.5px] text-[#64748B]">Earn passive daily royalties directly from downline mining yields across 10 affiliate tiers</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-[10px] font-mono font-bold self-start sm:self-auto">
            10 Deep Tiers
          </span>
        </div>

        {/* 10-Tier Grid Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Daily Mining Yield Override Distribution
            </span>
            <span className="text-[10px] text-[#64748B]">Recurring every 24h</span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
            {[
              { level: 'L1', rate: '5%', color: 'amber', desc: 'Direct' },
              { level: 'L2', rate: '3%', color: 'cyan', desc: 'Tier 2' },
              { level: 'L3', rate: '2%', color: 'blue', desc: 'Tier 3' },
              { level: 'L4', rate: '1%', color: 'purple', desc: 'Tier 4' },
              { level: 'L5', rate: '1%', color: 'purple', desc: 'Tier 5' },
              { level: 'L6', rate: '1%', color: 'purple', desc: 'Tier 6' },
              { level: 'L7', rate: '1%', color: 'purple', desc: 'Tier 7' },
              { level: 'L8', rate: '1%', color: 'purple', desc: 'Tier 8' },
              { level: 'L9', rate: '1%', color: 'purple', desc: 'Tier 9' },
              { level: 'L10', rate: '1%', color: 'purple', desc: 'Tier 10' },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`rounded-xl bg-[#040812] border p-2 text-center transition-all ${
                  item.color === 'amber'
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : item.color === 'cyan'
                    ? 'border-cyan-500/35 bg-cyan-500/5'
                    : item.color === 'blue'
                    ? 'border-blue-500/35 bg-blue-500/5'
                    : 'border-[#14233C] hover:border-purple-500/30'
                }`}
              >
                <span className="text-[9.5px] font-bold text-[#64748B] block uppercase tracking-wider">{item.level}</span>
                <span className={`text-base sm:text-lg font-black font-mono leading-tight block my-0.5 ${
                  item.color === 'amber'
                    ? 'text-amber-400'
                    : item.color === 'cyan'
                    ? 'text-cyan-400'
                    : item.color === 'blue'
                    ? 'text-blue-400'
                    : 'text-purple-300'
                }`}>
                  {item.rate}
                </span>
                <span className="text-[8.5px] text-[#94A3B8] block truncate">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2 Feature Cards: Profit-Sharing Milestones & Dual Liquid Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Card 1: Company Net Profit Royalty Milestones */}
          <div className="p-3.5 rounded-xl bg-[#040812] border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Coins className="w-3.5 h-3.5" />
              </div>
              <h5 className="text-xs font-bold text-white">Company Net Profit Royalty Pools</h5>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Achieve total team turnover milestones to unlock platform-level revenue sharing distributed equally among qualifying community leaders:
            </p>
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#070E1B] border border-[#14233C] text-[10.5px]">
                <span className="text-[#94A3B8] font-medium">$50,000 Team Turnover</span>
                <span className="text-emerald-400 font-bold font-mono">5% Profit Pool</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#070E1B] border border-[#14233C] text-[10.5px]">
                <span className="text-[#94A3B8] font-medium">$100,000 Team Turnover</span>
                <span className="text-amber-300 font-bold font-mono">3% Profit Pool</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#070E1B] border border-[#14233C] text-[10.5px]">
                <span className="text-[#94A3B8] font-medium">$200,000 Team Turnover</span>
                <span className="text-amber-400 font-bold font-mono">2% Profit Pool</span>
              </div>
            </div>
          </div>

          {/* Card 2: Send to Wallet vs Re-invest Choice */}
          <div className="p-3.5 rounded-xl bg-[#040812] border border-cyan-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                <Repeat className="w-3.5 h-3.5" />
              </div>
              <h5 className="text-xs font-bold text-white">Dual Action Flexibility: Wallet or Re-invest</h5>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              All earned Over-Ride Commissions (ORC) are kept in your dedicated ORC balance. You have full autonomous control with zero lock-in:
            </p>
            <div className="space-y-1.5 pt-1">
              <div className="p-2 rounded-lg bg-[#070E1B] border border-cyan-500/25 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <div className="text-[10.5px]">
                  <strong className="text-cyan-300 font-semibold">Send to Wallet:</strong>
                  <span className="text-[#94A3B8] ml-1">Instantly transfers 100% of ORC funds to your withdrawable balance with $0 fees for immediate crypto cashout.</span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[#070E1B] border border-emerald-500/25 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <div className="text-[10.5px]">
                  <strong className="text-emerald-300 font-semibold">Re-invest in Plan:</strong>
                  <span className="text-[#94A3B8] ml-1">Compounds your mining power directly into your active contract, auto-upgrading your plan tier and boosting daily yield.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
