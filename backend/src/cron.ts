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

  try {
    // 1. Fetch all active mining contracts that have not expired
    const activeContractsQuery = await env.DB.prepare(
      `SELECT * FROM mining_contracts 
       WHERE status = 'active' 
       AND (expires_at IS NULL OR datetime(expires_at) > datetime('now'))`
    ).all();

    const contracts = activeContractsQuery.results as any[];

    if (!contracts || contracts.length === 0) {
      return result;
    }

    // 2. Process each contract in batches
    for (const contract of contracts) {
      try {
        const yieldAmount = Number((contract.amount * (contract.daily_rate_percent / 100)).toFixed(4));
        const txId = `YIELD-${contract.id.slice(-6)}-${Date.now().toString().slice(-6)}`;

        if (contract.compounding_enabled === 1) {
          // AUTO-REINVEST: Compound yield directly back into contract principal & staked node power
          const newPrincipal = Number((contract.amount + yieldAmount).toFixed(4));

          // Check if newPrincipal qualifies for higher tier (Automatic Upgrade)
          let qualifiedTier = MINING_TIERS[0];
          for (const tier of MINING_TIERS) {
            if (newPrincipal >= tier.minAmount) {
              qualifiedTier = tier;
            }
          }

          const hasTierUpgraded = qualifiedTier.rate > contract.daily_rate_percent;
          const effectiveRate = hasTierUpgraded ? qualifiedTier.rate : contract.daily_rate_percent;
          const effectivePlanId = hasTierUpgraded ? qualifiedTier.planId : contract.plan_id;
          const effectivePlanName = hasTierUpgraded ? qualifiedTier.planName : contract.plan_name;
          const newDailyYield = Number((newPrincipal * (effectiveRate / 100)).toFixed(4));

          const batchQueries: any[] = [
            // Update contract principal, plan tier (if auto-upgraded), and daily yield
            env.DB.prepare(
              `UPDATE mining_contracts 
               SET amount = ?, plan_id = ?, plan_name = ?, daily_rate_percent = ?, daily_yield_usdt = ?, last_yield_accrual = CURRENT_TIMESTAMP 
               WHERE id = ?`
            ).bind(newPrincipal, effectivePlanId, effectivePlanName, effectiveRate, newDailyYield, contract.id),

            // Update user wallet active mining power & total mined rewards
            env.DB.prepare(
              `UPDATE wallets 
               SET active_mining_power = active_mining_power + ?, 
                   total_mined_yield = total_mined_yield + ?, 
                   updated_at = CURRENT_TIMESTAMP 
               WHERE user_id = ?`
            ).bind(yieldAmount, yieldAmount, contract.user_id),

            // Record transaction ledger entry
            env.DB.prepare(
              `INSERT INTO transactions (id, user_id, type, amount, status) 
               VALUES (?, ?, 'Daily Yield (Auto-Reinvest)', ?, 'Compounded')`
            ).bind(txId, contract.user_id, yieldAmount)
          ];

          // If tier auto-upgraded, record milestone entry
          if (hasTierUpgraded) {
            batchQueries.push(
              env.DB.prepare(
                `INSERT INTO transactions (id, user_id, type, amount, status) 
                 VALUES (?, ?, ?, 0.0, 'Settled')`
              ).bind(
                `UPG-${contract.id.slice(-6)}-${Date.now().toString().slice(-4)}`,
                contract.user_id,
                `Auto-Upgrade Milestone: Compounding reached $${newPrincipal.toFixed(2)}! Upgraded to ${effectivePlanName} (${effectiveRate}%/day)`
              )
            );
          }

          await env.DB.batch(batchQueries);
          result.compoundedYield += yieldAmount;
        } else {
          // SIMPLE YIELD: Credit payout directly into withdrawable balance
          await env.DB.batch([
            // Update contract timestamp
            env.DB.prepare(
              `UPDATE mining_contracts 
               SET last_yield_accrual = CURRENT_TIMESTAMP 
               WHERE id = ?`
            ).bind(contract.id),

            // Add directly to user withdrawable balance & total mined rewards
            env.DB.prepare(
              `UPDATE wallets 
               SET withdrawable_balance = withdrawable_balance + ?, 
                   total_mined_yield = total_mined_yield + ?, 
                   updated_at = CURRENT_TIMESTAMP 
               WHERE user_id = ?`
            ).bind(yieldAmount, yieldAmount, contract.user_id),

            // Record transaction ledger entry
            env.DB.prepare(
              `INSERT INTO transactions (id, user_id, type, amount, status) 
               VALUES (?, ?, 'Daily Yield Accrual', ?, 'Settled')`
            ).bind(txId, contract.user_id, yieldAmount)
          ]);

          result.liquidYield += yieldAmount;
        }

        result.contractsProcessed++;
        result.totalYieldDistributed += yieldAmount;
      } catch (err: any) {
        result.errors.push(`Error processing contract ${contract.id}: ${err.message}`);
      }
    }

    // 3. Mark expired contracts as completed
    await env.DB.prepare(
      `UPDATE mining_contracts 
       SET status = 'completed' 
       WHERE status = 'active' 
       AND expires_at IS NOT NULL 
       AND datetime(expires_at) <= datetime('now')`
    ).run();

    return result;
  } catch (globalErr: any) {
    result.success = false;
    result.errors.push(`Fatal cron execution failure: ${globalErr.message}`);
    return result;
  }
}
