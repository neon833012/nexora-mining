import React, { useState, useEffect } from 'react';
import { Server, Activity, Thermometer, Globe, Cpu, Gauge } from 'lucide-react';

export const HomeMiningFarmStats: React.FC = () => {
  // Distinct realistic loads between 82% and 94% for the 4 physical data centers
  const [centerLoads, setCenterLoads] = useState<number[]>([88.4, 93.1, 84.6, 90.7]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCenterLoads(([iceland, norway, texas, canada]) => {
        const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
        const shift = () => (Math.random() * 0.8 - 0.4);
        return [
          +(clamp(iceland + shift(), 85.0, 91.0)).toFixed(1),
          +(clamp(norway + shift(), 90.0, 94.0)).toFixed(1),
          +(clamp(texas + shift(), 82.0, 87.0)).toFixed(1),
          +(clamp(canada + shift(), 87.0, 93.0)).toFixed(1),
        ];
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const dataCenters = [
    {
      country: 'Reykjavik, Iceland',
      flag: '🇮🇸',
      powerSource: '100% Geothermal',
      rigCount: '3,840 Units',
      hashPower: '24.2 EH/s',
      cooling: 'Sub-Zero Liquid Immersion',
      temp: '18.4°C',
      status: 'Optimal',
    },
    {
      country: 'Stavanger, Norway',
      flag: '🇳🇴',
      powerSource: 'Hydro-Electric Alpine',
      rigCount: '4,120 Units',
      hashPower: '28.6 EH/s',
      cooling: 'Hydro-Loop Radiator',
      temp: '19.1°C',
      status: 'Optimal',
    },
    {
      country: 'Austin, Texas, USA',
      flag: '🇺🇸',
      powerSource: 'Direct Solar Microgrid',
      rigCount: '4,650 Units',
      hashPower: '31.4 EH/s',
      cooling: 'Two-Phase Immersion Tank',
      temp: '21.5°C',
      status: 'Optimal',
    },
    {
      country: 'Quebec Hydro Hub, Canada',
      flag: '🇨🇦',
      powerSource: 'James Bay Hydroelectric',
      rigCount: '2,940 Units',
      hashPower: '19.4 EH/s',
      cooling: 'Sub-Zero Ambient Air Exchanger',
      temp: '14.2°C',
      status: 'Optimal',
      latency: '18ms',
      hardware: 'Antminer S21 Pro Hydro',
    },
  ];

  const asicHardware = [
    {
      name: 'Bitmain Antminer S21 Pro',
      type: 'ASIC Miner Cluster',
      hashrate: '335 TH/s',
      efficiency: '15.0 J/TH',
      process: '3nm FinFET ASIC Chips',
      cooling: 'Dielectric Liquid Immersion',
      badge: 'TOP EFFICIENCY',
      badgeColor: 'border-[#10B981]/40 bg-[#10B981]/15 text-[#10B981]',
    },
    {
      name: 'MicroBT Whatsminer M60S+',
      type: 'Hydro-Cooled Computing',
      hashrate: '186 TH/s',
      efficiency: '18.5 J/TH',
      process: '4nm Custom Architecture',
      cooling: 'Integrated Water Loop Block',
      badge: 'HIGH STABILITY',
      badgeColor: 'border-[#00F0FF]/40 bg-[#00F0FF]/15 text-[#00F0FF]',
    },
    {
      name: 'Canaan Avalon A1466I',
      type: 'Industrial Submersion Rig',
      hashrate: '170 TH/s',
      efficiency: '21.5 J/TH',
      process: 'AI-Optimized Dynamic Hash',
      cooling: 'Synthetic Oil Dual-Phase',
      badge: 'IMMERSION SPEC',
      badgeColor: 'border-[#A855F7]/40 bg-[#A855F7]/15 text-[#A855F7]',
    },
    {
      name: 'Neon Modular Container v4.2',
      type: '40ft Microgrid Data Pod',
      hashrate: '2.4 EH/s / Pod',
      efficiency: 'PUE 1.04 Target',
      process: 'Smart SCADA Telemetry Unit',
      cooling: 'High-Flow Closed Radiators',
      badge: 'MODULAR DESIGN',
      badgeColor: 'border-[#FBBF24]/40 bg-[#FBBF24]/15 text-[#FBBF24]',
    },
  ];

  const infrastructurePillars = [
    {
      icon: '⚡',
      title: 'Zero-Carbon Microgrid Power',
      desc: 'Our physical facilities tap into stranded renewable power sources — Icelandic geothermal vents, Norwegian alpine hydroelectric dams, and Texas solar fields — locking in sub-$0.024/kWh operating costs.',
    },
    {
      icon: '❄️',
      title: 'Dielectric Submersion Cooling',
      desc: 'ASIC boards operate submerged in non-conductive synthetic dielectric fluids. This eliminates heat-throttling, dust, and fan degradation, extending ASIC silicon lifespan by over 240% compared to traditional air rigs.',
    },
    {
      icon: '🛡️',
      title: 'Tier-3 SCADA & Armed Perimeter',
      desc: 'Each facility is protected by 24/7 armed physical security, biometric mantraps, redundant multi-carrier fiber trunks, and automated fire-suppression systems with 99.98% contractual uptime guarantees.',
    },
    {
      icon: '🤖',
      title: 'Autonomous Hash Routing Engine',
      desc: 'Proprietary AI telemetry constantly monitors network block difficulties and thermodynamic efficiency, micro-rebalancing computing pools every 180 seconds to guarantee maximum 24H payout generation.',
    },
  ];

  return (
    <section className="w-full px-3.5 lg:px-0 space-y-6">
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Server className="w-4 h-4 text-[#00F0FF]" />
          <span className="text-[11px] font-bold tracking-[1.5px] text-[#00F0FF] uppercase">
            PHYSICAL COMPUTING INFRASTRUCTURE
          </span>
        </div>
        <h2 className="text-[20px] lg:text-[26px] font-extrabold text-white">
          Real-World Hyper-Scale Mining Farms & Hardware
        </h2>
        <p className="text-[12px] lg:text-[13px] text-[#94A3B8] mt-1 max-w-3xl">
          Neon Mining bridges institutional-grade physical hardware with accessible cloud contracts. Instead of purchasing, shipping, wiring, and maintaining noisy ASIC rigs yourself, you lease verified computing power from our green-powered physical data centers.
        </p>
      </div>

      {/* Industrial Telemetry Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-4">
        <div className="p-3.5 rounded-xl bg-[#091424] border border-[#162942] flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF] shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#94A3B8] block uppercase font-medium">Total ASIC Fleet</span>
            <span className="text-[16px] lg:text-[18px] font-extrabold text-white font-mono">15,550 Rigs</span>
            <span className="text-[9.5px] text-[#00F0FF] block">Active across 4 hubs</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#091424] border border-[#162942] flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8] shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#94A3B8] block uppercase font-medium">Total Hash Capacity</span>
            <span className="text-[16px] lg:text-[18px] font-extrabold text-[#38BDF8] font-mono">103.6 EH/s</span>
            <span className="text-[9.5px] text-[#10B981] block">● Real-time synced</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#091424] border border-[#162942] flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#94A3B8] block uppercase font-medium">Power Usage Eff. (PUE)</span>
            <span className="text-[16px] lg:text-[18px] font-extrabold text-[#10B981] font-mono">1.06 Ultra-Low</span>
            <span className="text-[9.5px] text-[#94A3B8] block">Industry benchmark</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#091424] border border-[#162942] flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 rounded-lg bg-[#FBBF24]/10 border border-[#FBBF24]/30 flex items-center justify-center text-[#FBBF24] shrink-0">
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#94A3B8] block uppercase font-medium">Clean Energy Ratio</span>
            <span className="text-[16px] lg:text-[18px] font-extrabold text-[#FBBF24] font-mono">96.8% Green</span>
            <span className="text-[9.5px] text-[#10B981] block">Zero carbon footprint</span>
          </div>
        </div>
      </div>

      {/* 4 Global Physical Facilities Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#00F0FF]" />
            <h3 className="text-[15px] font-bold text-white">
              Active Global Data Center Campuses
            </h3>
          </div>
          <span className="text-[10.5px] text-[#10B981] font-mono font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
            4/4 Facilities Online
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {dataCenters.map((center, idx) => (
            <div
              key={center.country}
              className="p-3.5 rounded-xl bg-[#081220] border border-[#172840] hover:border-[#00F0FF]/50 transition-all flex flex-col justify-between shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[20px]">{center.flag}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-[9.5px] font-bold uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    {center.status}
                  </span>
                </div>

                <h4 className="text-[13.5px] font-bold text-white mb-0.5 truncate">
                  {center.country}
                </h4>
                <span className="text-[10.5px] font-semibold text-[#00F0FF] block mb-2.5">
                  {center.powerSource}
                </span>

                <div className="space-y-1 text-[11px] border-t border-[#132338] pt-2">
                  <div className="flex justify-between text-[#94A3B8]">
                    <span>Hardware:</span>
                    <strong className="text-[#CBD5E1] text-[10px] truncate max-w-[110px]">{center.hardware || 'Antminer S21'}</strong>
                  </div>
                  <div className="flex justify-between text-[#94A3B8]">
                    <span>Fleet Size:</span>
                    <strong className="text-white font-mono">{center.rigCount}</strong>
                  </div>
                  <div className="flex justify-between text-[#94A3B8]">
                    <span>Computing Hash:</span>
                    <strong className="text-[#38BDF8] font-mono">{center.hashPower}</strong>
                  </div>
                  <div className="flex justify-between text-[#94A3B8]">
                    <span>Chamber Temp:</span>
                    <strong className="text-[#10B981] font-mono">{center.temp}</strong>
                  </div>
                  <div className="flex justify-between text-[#94A3B8]">
                    <span>Network Ping:</span>
                    <strong className="text-[#FBBF24] font-mono">{center.latency || '16ms'}</strong>
                  </div>
                </div>
              </div>

              {/* Capacity Bar (Between 82% and 94%, separate per data center) */}
              <div className="mt-3 pt-2 border-t border-[#132338]">
                <div className="flex justify-between text-[9.5px] text-[#94A3B8] mb-1">
                  <span>Capacity:</span>
                  <span className="text-[#00F0FF] font-mono font-bold">{centerLoads[idx] || 88.4}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#122033] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0284C7] to-[#00F0FF] rounded-full transition-all duration-700"
                    style={{ width: `${centerLoads[idx] || 88.4}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Physical Hardware Rigs & ASIC Specifications */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-[#38BDF8]" />
          <h3 className="text-[15px] font-bold text-white">
            Deployed ASIC Silicon & Computational Racks
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {asicHardware.map((asic) => (
            <div
              key={asic.name}
              className="p-3.5 rounded-xl bg-gradient-to-b from-[#0B1728] to-[#060D18] border border-[#192C47] hover:border-[#38BDF8]/50 transition-all flex flex-col justify-between shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${asic.badgeColor}`}>
                    {asic.badge}
                  </span>
                  <span className="text-[10px] text-[#64748B] font-mono">{asic.type}</span>
                </div>

                <h4 className="text-[14px] font-extrabold text-white leading-snug">
                  {asic.name}
                </h4>

                <div className="mt-3 p-2.5 rounded-lg bg-[#040810] border border-[#122238] space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Raw Hashrate:</span>
                    <strong className="text-[#00F0FF] font-mono">{asic.hashrate}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Power Ratio:</span>
                    <strong className="text-[#10B981] font-mono">{asic.efficiency}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Architecture:</span>
                    <span className="text-[#CBD5E1] text-[10px] truncate max-w-[130px]">{asic.process}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Cooling Method:</span>
                    <span className="text-[#FBBF24] text-[10px] truncate max-w-[130px]">{asic.cooling}</span>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#122033] flex items-center justify-between text-[10px] text-[#64748B]">
                <span>24/7 Hash Synced</span>
                <span className="text-[#10B981] font-bold">● Active in Cluster</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deep-Dive Narrative Paragraphs: Physical Computing Reality */}
      <div className="rounded-2xl bg-[#081220] border border-[#162740] p-5 lg:p-8 shadow-xl space-y-6">
        <div>
          <span className="text-[11px] font-bold tracking-[1.5px] text-[#00F0FF] uppercase block mb-1">
            BEHIND THE SCREEN · INDUSTRIAL HARDWARE ARCHITECTURE
          </span>
          <h3 className="text-[18px] lg:text-[22px] font-black text-white">
            The Engineering Reality: Why Physical Computing Infrastructure Matters
          </h3>
          <p className="text-[12px] lg:text-[13px] text-[#94A3B8] mt-1">
            Understanding the physics, thermodynamic cooling, and power economics that power your daily cloud mining yields.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-[12.5px] leading-relaxed text-[#CBD5E1]">
          {/* Paragraph Column 1 */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#050C16] border border-[#132338] space-y-2">
              <h4 className="text-[14px] font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00F0FF]" />
                The Capital & Acoustic Barrier of Solo Mining
              </h4>
              <p className="text-[#94A3B8]">
                Setting up an industrial Bitcoin or crypto mining rig is no longer a hobbyist undertaking. Modern Proof-of-Work protocols require specialized Application-Specific Integrated Circuits (ASICs) that draw between 3,500W to 5,400W of continuous 3-phase electrical power per unit. For an individual, acquiring a single Antminer S21 Pro or Whatsminer M60S involves thousands of dollars in upfront capital, complex cross-border customs clearance, and the constant threat of hardware obsolescence. Moreover, standard residential electrical infrastructure simply cannot support the massive amperage and deafening 85-decibel acoustic output of industrial cooling fans without major residential renovations.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#050C16] border border-[#132338] space-y-2">
              <h4 className="text-[14px] font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                Direct Power Purchase Agreements (PPAs) at Microgrid Scale
              </h4>
              <p className="text-[#94A3B8]">
                Neon Mining completely eliminates this barrier by establishing physical data pod footprints directly adjacent to sovereign hydroelectric dams and geothermal power stations across Iceland, Norway, Quebec, and Texas. By negotiating institutional Power Purchase Agreements (PPAs) below $0.024 per kilowatt-hour, our facilities utilize stranded, surplus renewable energy that would otherwise be curtailed or wasted by regional electrical grids. This green energy architecture ensures our hash power generation remains carbon-neutral while locking in an ultra-low operational cost structure that is impossible to replicate at a domestic or small-scale level.
              </p>
            </div>
          </div>

          {/* Paragraph Column 2 */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#050C16] border border-[#132338] space-y-2">
              <h4 className="text-[14px] font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                Sub-Zero Dielectric Immersion vs. Traditional Air Cooling
              </h4>
              <p className="text-[#94A3B8]">
                Traditional air-cooled mining warehouses suffer from high failure rates of 4% to 7% annually due to airborne dust, thermal expansion stress, and fan motor friction. In contrast, Neon Mining deploys single-phase and dual-phase synthetic dielectric fluid immersion tanks. By completely submerging ASIC motherboards in thermally conductive, non-electrically conductive fluid, heat is dissipated 1,200 times more efficiently than air. This keeps delicate 3nm and 4nm FinFET processor nodes stabilized at a uniform 18°C junction temperature, completely eliminating thermal throttling and enabling sustainable 15% compute gains with near-zero component degradation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#050C16] border border-[#132338] space-y-2">
              <h4 className="text-[14px] font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FBBF24]" />
                Real-Time SCADA Automation & Guaranteed 24H Yields
              </h4>
              <p className="text-[#94A3B8]">
                Our certified on-premise engineers work alongside supervisory control and data acquisition (SCADA) telemetry engines that measure micro-voltage fluctuations, pool reject rates, and ambient barometric pressure in real time. If any single ASIC hashboard exhibits micro-voltage drift, automated failover protocols immediately re-route the compute workload to redundant reserve clusters within 80 milliseconds. When you purchase a node contract on Neon Mining, your leased hashrate is backed by real, physical silicon operating 24 hours a day, 365 days a year—delivering direct, verified cryptographic yields into your account balance with zero technical headaches.
              </p>
            </div>
          </div>
        </div>

        {/* Comparison Table / Breakdown */}
        <div className="pt-4 border-t border-[#132338]">
          <h4 className="text-[14px] font-bold text-white mb-3">
            Direct Comparison: Solo Physical Mining vs. Neon Mining Cloud Nodes
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11.5px] border border-[#142338] rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-[#050C16] border-b border-[#142338] text-[#64748B] uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Evaluation Parameter</th>
                  <th className="py-2.5 px-3 text-[#EF4444]">Solo Physical Rig (Home / Warehouse)</th>
                  <th className="py-2.5 px-3 text-[#10B981]">Neon Cloud Node Contract</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#101C2E] bg-[#040A14]">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Upfront Capital</td>
                  <td className="py-2.5 px-3 text-[#94A3B8]">$4,500 – $12,000 per machine + customs</td>
                  <td className="py-2.5 px-3 text-[#10B981] font-bold">Starts at just $20 USD</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Electricity Rate</td>
                  <td className="py-2.5 px-3 text-[#94A3B8]">$0.14 – $0.24 / kWh (Unprofitable)</td>
                  <td className="py-2.5 px-3 text-[#10B981] font-bold">Sub-$0.024 / kWh (PPA Institutional)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Noise & Thermal Impact</td>
                  <td className="py-2.5 px-3 text-[#94A3B8]">85 dB jet-engine sound, unbearable heat</td>
                  <td className="py-2.5 px-3 text-[#10B981] font-bold">100% Silent (Housed in Immersion Pods)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Maintenance & Repairs</td>
                  <td className="py-2.5 px-3 text-[#94A3B8]">User bears 100% cost of burnt chipboards</td>
                  <td className="py-2.5 px-3 text-[#10B981] font-bold">Fully Managed 24/7 by On-Site Engineers</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-white">Payout Predictability</td>
                  <td className="py-2.5 px-3 text-[#94A3B8]">High pool variance, weeks without blocks</td>
                  <td className="py-2.5 px-3 text-[#10B981] font-bold">Automated daily yield credited every 24H</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

