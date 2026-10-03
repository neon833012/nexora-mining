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
  TrendingUp
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
          <div className="p-3.5 rounded-xl bg-[#040812] border border-[#122033] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Reykjavik Campus</span>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">Iceland</span>
            </div>
            <span className="text-[10.5px] text-emerald-400 font-semibold block">100% Geothermal Energy</span>
            <p className="text-[11px] text-gray-400">Sub-arctic ambient air cooling. PUE 1.02. Zero carbon emission baseline.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#040812] border border-[#122033] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Luleå Hydro Farm</span>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">Sweden</span>
            </div>
            <span className="text-[10.5px] text-emerald-400 font-semibold block">Lule River Hydroelectric</span>
            <p className="text-[11px] text-gray-400">High-density liquid immersion containers with 99.99% substation uptime.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#040812] border border-[#122033] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Permian Energy Hub</span>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">Texas, USA</span>
            </div>
            <span className="text-[10.5px] text-emerald-400 font-semibold block">Solar + Wind Hybrid</span>
            <p className="text-[11px] text-gray-400">350MW direct grid substation with intelligent ERCOT curtailment automation.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#040812] border border-[#122033] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">St. Lawrence Cluster</span>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">Quebec, CA</span>
            </div>
            <span className="text-[10.5px] text-emerald-400 font-semibold block">Hydro-Québec Renewable</span>
            <p className="text-[11px] text-gray-400">Ultra-low industrial electricity tariff locking maximum long-term miner yield.</p>
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
    </section>
  );
};
