/**
 * Nexora Mining - 24-Hour Automated Daily Yield Engine
 * Cloudflare Worker Scheduled Cron Handler (Runs at 00:00 UTC daily)
 */

export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  VAULT_ADDRESS: string;
  USDT_CONTRACT: string;
  BSC_RPC_URL: string;
  CHAIN_ID: string;
  RESEND_API_KEY?: string;
}

export interface CronYieldResult {
  success: boolean;
  contractsProcessed: number;
  totalYieldDistributed: number;
  compoundedYield: number;
  liquidYield: number;
  timestamp: string;
  errors: string[];
}

export const MINING_TIERS = [
  { planId: 'plan_20', planName: 'Neon Lite', minAmount: 20.0, rate: 1.0 },
  { planId: 'plan_50', planName: 'Cryptera', minAmount: 50.0, rate: 1.1 },
  { planId: 'plan_150', planName: 'Novacore', minAmount: 150.0, rate: 1.2 },
  { planId: 'plan_350', planName: 'Hypervex', minAmount: 350.0, rate: 1.35 },
  { planId: 'plan_700', planName: 'Vantamine', minAmount: 700.0, rate: 1.5 },
  { planId: 'plan_1500', planName: 'Nexhash', minAmount: 1500.0, rate: 1.7 },
  { planId: 'plan_3000', planName: 'OmegaVIP', minAmount: 3000.0, rate: 2.0 },
];

export async function handleDailyYieldCron(env: Env): Promise<CronYieldResult> {
  const result: CronYieldResult = {
    success: true,
    contractsProcessed: 0,
    totalYieldDistributed: 0,
    compoundedYield: 0,
    liquidYield: 0,
    timestamp: new Date().toISOString(),
    errors: []
  };

  // The platform operates on manual 24-Hour Proof-of-Activity Cycles.
  // 1% daily yield unlocks strictly when user completes their 24H cycle.
  // The yield remains in 'unclaimed' state until the user explicitly clicks
  // either "Re-invest into Plan" or "Send to Wallet" on their dashboard.
  // Automatic background compounding is disabled.
  return result;
}

