/**
 * Local Data Store & Mock Backend Engine for Localhost Testing
 * Allows seamless offline / local development without touching Cloudflare Workers or D1.
 * Pre-seeded with all genuine production users, orders, balances, and configurations.
 */

export interface DbUserRecord {
  id: string;
  name: string;
  mobile: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  referral_code: string;
  upline_code: string | null;
  created_at: string;
  fund_pin: string | null;
  fund_pin_set: number;
  deposit_balance: number;
  withdrawable_balance: number;
  referral_balance: number;
  orc_balance?: number;
  total_orc_income?: number;
  active_mining_power: number;
  total_withdrawn: number;
  total_mined_yield: number;
  active_contract_plan: string | null;
  daily_yield_usdt: number | null;
  daily_rate_percent: number | null;
  is_mining_active: number;
  mining_cycle_started_at?: number;
  unclaimed_yield?: number;
  direct_referrals_count: number;
}

export const SEED_PRODUCTION_USERS: DbUserRecord[] = [
  {
    id: 'NEON10770',
    name: 'NEON10770',
    mobile: '+91 8958787343',
    email: 'neonminingsupport@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEON1ME3Q',
    upline_code: null,
    created_at: '2026-09-13 11:41:32',
    fund_pin: '217124',
    fund_pin_set: 1,
    deposit_balance: 2.6,
    withdrawable_balance: 0.52,
    referral_balance: 0.8,
    orc_balance: 0.07,
    total_orc_income: 0.07,
    active_mining_power: 21.87,
    total_withdrawn: 4.6,
    total_mined_yield: 2.62,
    active_contract_plan: 'PLAN 01 ($20 USD)',
    daily_yield_usdt: 0.22,
    daily_rate_percent: 1.0,
    is_mining_active: 1,
    mining_cycle_started_at: Date.now() - 3600000,
    unclaimed_yield: 0.22,
    direct_referrals_count: 22
  },
  {
    id: 'NEON17255',
    name: 'NEON17255',
    mobile: '+91 9012730218',
    email: '12haider1990ali@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONGEOAJ',
    upline_code: 'NEON10770',
    created_at: '2026-09-17 12:46:35',
    fund_pin: '000786',
    fund_pin_set: 1,
    deposit_balance: 0,
    withdrawable_balance: 0.24,
    referral_balance: 0.0,
    active_mining_power: 21.23,
    total_withdrawn: 7.4,
    total_mined_yield: 2.66,
    active_contract_plan: 'PLAN 01 ($20 USD)',
    daily_yield_usdt: 0.21,
    daily_rate_percent: 1,
    is_mining_active: 1,
    direct_referrals_count: 2
  },
  {
    id: 'NEON85592',
    name: 'NEON85592',
    mobile: '+91 7248523596',
    email: 'fronxedit3@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEON8RGTI',
    upline_code: 'NEON10770',
    created_at: '2026-09-18 04:25:36',
    fund_pin: '123456',
    fund_pin_set: 1,
    deposit_balance: 0,
    withdrawable_balance: 1.25,
    referral_balance: 4,
    active_mining_power: 20.6,
    total_withdrawn: 2.2,
    total_mined_yield: 3.05,
    active_contract_plan: 'PLAN 01 ($20 USD)',
    daily_yield_usdt: 0.206,
    daily_rate_percent: 1,
    is_mining_active: 1,
    direct_referrals_count: 3
  },
  {
    id: 'NEON86471',
    name: 'NEON86471',
    mobile: '+91 7906174484',
    email: 'ahkamrke@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONHHY80',
    upline_code: 'NEON17255',
    created_at: '2026-09-20 16:19:43',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 6.8,
    referral_balance: 4,
    active_mining_power: 20,
    total_withdrawn: 0,
    total_mined_yield: 2.8,
    active_contract_plan: 'Neon Lite',
    daily_yield_usdt: 0.2,
    daily_rate_percent: 1,
    is_mining_active: 1,
    direct_referrals_count: 2
  },
  {
    id: 'NEON91904',
    name: 'NEON91904',
    mobile: '+91 9536389190',
    email: 'mohusain0017@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEON0VP8R',
    upline_code: 'NEON86471',
    created_at: '2026-09-20 17:18:09',
    fund_pin: '337401',
    fund_pin_set: 1,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 24.16,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: 'PLAN 01 ($20 USD)',
    daily_yield_usdt: 0.2416,
    daily_rate_percent: 1,
    is_mining_active: 1,
    direct_referrals_count: 0
  },
  {
    id: 'NEON91711',
    name: 'NEON91711',
    mobile: '+91 8171217504',
    email: 'dr.muskanansari786@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEON26HDQ',
    upline_code: 'NEON85592',
    created_at: '2026-09-22 07:32:29',
    fund_pin: '786786',
    fund_pin_set: 1,
    deposit_balance: 0,
    withdrawable_balance: 1.4,
    referral_balance: 0,
    active_mining_power: 20.4,
    total_withdrawn: 0,
    total_mined_yield: 1.4,
    active_contract_plan: 'PLAN 01 ($20 USD)',
    daily_yield_usdt: 0.204,
    daily_rate_percent: 1,
    is_mining_active: 1,
    direct_referrals_count: 1
  },
  {
    id: 'NEON97969',
    name: 'NEON97969',
    mobile: '+91 9634646668',
    email: 'arjunvermag143@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONWTZFM',
    upline_code: 'NEON10770',
    created_at: '2026-09-23 15:56:24',
    fund_pin: '963464',
    fund_pin_set: 1,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 23.19,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: 'PLAN 01 ($20 USD)',
    daily_yield_usdt: 0.2319,
    daily_rate_percent: 1,
    is_mining_active: 1,
    direct_referrals_count: 0
  },
  {
    id: 'NEON54373',
    name: 'NEON54373',
    mobile: '+91 8958607001',
    email: 'vpraja4990@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEON6Y3FY',
    upline_code: 'NEON17255',
    created_at: '2026-09-24 03:45:40',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0.4,
    referral_balance: 0,
    active_mining_power: 20,
    total_withdrawn: 0,
    total_mined_yield: 0.4,
    active_contract_plan: 'Neon Lite',
    daily_yield_usdt: 0.2,
    daily_rate_percent: 1,
    is_mining_active: 1,
    direct_referrals_count: 0
  },
  {
    id: 'NEON81434',
    name: 'NEON81434',
    mobile: '+91 9054877158',
    email: 'ramansardesai17@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONN1IPO',
    upline_code: 'NEON10770',
    created_at: '2026-09-24 17:12:54',
    fund_pin: '788510',
    fund_pin_set: 1,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 22.09,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: 'PLAN 01 ($20 USD)',
    daily_yield_usdt: 0.2209,
    daily_rate_percent: 1,
    is_mining_active: 1,
    direct_referrals_count: 1
  },
  {
    id: 'NEON36617',
    name: 'NEON36617',
    mobile: '+91 9368859632',
    email: 'sarfaraj00986@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONIXKJG',
    upline_code: 'NEON85592',
    created_at: '2026-09-19 11:37:59',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 1.4,
    referral_balance: 0,
    active_mining_power: 20,
    total_withdrawn: 0,
    total_mined_yield: 1.4,
    active_contract_plan: 'Neon Lite',
    daily_yield_usdt: 0.2,
    daily_rate_percent: 1,
    is_mining_active: 1,
    direct_referrals_count: 0
  },
  {
    id: 'NEON87355',
    name: 'NEON87355',
    mobile: '+91 8979770804',
    email: 'raseeduvesh@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONBMSWQ',
    upline_code: 'NEON86471',
    created_at: '2026-09-27 10:30:42',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 2.8,
    referral_balance: 0,
    active_mining_power: 20,
    total_withdrawn: 0,
    total_mined_yield: 2.8,
    active_contract_plan: 'Neon Lite',
    daily_yield_usdt: 0.2,
    daily_rate_percent: 1,
    is_mining_active: 1,
    direct_referrals_count: 1
  },
  {
    id: 'NEON65269',
    name: 'NEON65269',
    mobile: '+91 7454823453',
    email: 'rohangautam3560@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEON9N2HO',
    upline_code: 'NEON10770',
    created_at: '2026-09-28 14:00:23',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 21.23,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: 'PLAN 01 ($20 USD)',
    daily_yield_usdt: 0.2123,
    daily_rate_percent: 1,
    is_mining_active: 1,
    direct_referrals_count: 0
  },
  {
    id: 'NEON69394',
    name: 'NEON69394',
    mobile: '+91 8077172483',
    email: 'deepakpr777@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEON7WK74',
    upline_code: 'NEON10770',
    created_at: '2026-10-03 11:48:00',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 20.6,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: 'PLAN 01 ($20 USD)',
    daily_yield_usdt: 0.206,
    daily_rate_percent: 1,
    is_mining_active: 1,
    direct_referrals_count: 1
  },
  {
    id: 'NEON44424',
    name: 'NEON44424',
    mobile: '+91 9719595222',
    email: 'htbhatnagar9@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONQH850',
    upline_code: 'NEON10770',
    created_at: '2026-10-04 08:37:51',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 20,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: 'Neon Lite',
    daily_yield_usdt: 0.2,
    daily_rate_percent: 1,
    is_mining_active: 1,
    direct_referrals_count: 0
  },
  {
    id: 'NEON59323',
    name: 'NEON59323',
    mobile: '+91 9927202136',
    email: 'akashsinghtomar1111@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONKTFOC',
    upline_code: 'NEON69394',
    created_at: '2026-10-08 12:44:09',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 20,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: 'Neon Lite',
    daily_yield_usdt: 0.2,
    daily_rate_percent: 1,
    is_mining_active: 1,
    direct_referrals_count: 0
  },
  {
    id: 'NEON50524',
    name: 'NEON50524',
    mobile: '+91 7060279048',
    email: 'baharali01012009@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONP31UN',
    upline_code: 'NEON10770',
    created_at: '2026-10-07 17:03:50',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON46912',
    name: 'NEON46912',
    mobile: '+1 01893865120',
    email: 'mdsakibkhanchoudhury@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONN5POC',
    upline_code: 'NEON10770',
    created_at: '2026-10-07 02:57:59',
    fund_pin: '123456',
    fund_pin_set: 1,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON73361',
    name: 'NEON73361',
    mobile: '+44 4580961234',
    email: 'helloonoob30@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEON4OWRY',
    upline_code: null,
    created_at: '2026-10-02 22:50:59',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON25888',
    name: 'NEON25888',
    mobile: '+225 0757557239',
    email: 'nguessansilveren@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONK3101',
    upline_code: 'NEON81434',
    created_at: '2026-10-01 17:17:10',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON16270',
    name: 'NEON16270',
    mobile: '+1 6263816783',
    email: 'dhakadparmanand39@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONVZQYF',
    upline_code: null,
    created_at: '2026-09-30 09:37:34',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON41540',
    name: 'NEON41540',
    mobile: '+1 1925158864',
    email: 'lostgamer9123@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEON87K7C',
    upline_code: 'NEON10770',
    created_at: '2026-09-29 08:45:35',
    fund_pin: '332211',
    fund_pin_set: 1,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON18592',
    name: 'NEON18592',
    mobile: '+92 3089243901',
    email: 'khanaqsa902@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONT1GA0',
    upline_code: 'NEON10770',
    created_at: '2026-09-29 05:03:11',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON31651',
    name: 'NEON31651',
    mobile: '+91 8865800437',
    email: 'souravsinghg5@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEON96E59',
    upline_code: 'NEON10770',
    created_at: '2026-09-29 05:00:51',
    fund_pin: '363636',
    fund_pin_set: 1,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON92545',
    name: 'NEON92545',
    mobile: '+91 9368629061',
    email: 'agada3511@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONAIE07',
    upline_code: 'NEON87355',
    created_at: '2026-09-28 07:43:14',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON73458',
    name: 'NEON73458',
    mobile: '+7 836221085254',
    email: 'aagazshams8@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONM22C3',
    upline_code: 'NEON10770',
    created_at: '2026-09-26 12:15:13',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON93735',
    name: 'NEON93735',
    mobile: '+20 1147036967',
    email: 'extremegamez999@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONCXS14',
    upline_code: 'NEON10770',
    created_at: '2026-09-26 05:27:49',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON43197',
    name: 'NEON43197',
    mobile: '+234 9021838648',
    email: 'realzcoded@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONITBYN',
    upline_code: 'NEONDKU69',
    created_at: '2026-09-25 19:32:02',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON98072',
    name: 'NEON98072',
    mobile: '+880 1821018891',
    email: 'mdmikrilhasan@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONR7SSE',
    upline_code: 'NEON10770',
    created_at: '2026-09-25 14:53:51',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON76965',
    name: 'NEON76965',
    mobile: '+91 9927674819',
    email: 'sushilkumar25m25@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONQZL0X',
    upline_code: 'NEON91711',
    created_at: '2026-09-22 10:21:20',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON80695',
    name: 'NEON80695',
    mobile: '+91 9927674819',
    email: 'sushilkumar99276748@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEON16FII',
    upline_code: 'NEON85592',
    created_at: '2026-09-22 09:54:37',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON53099',
    name: 'NEON53099',
    mobile: '+91 8392953122',
    email: 'dhillonharmail69@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONMJF3W',
    upline_code: 'NEON10770',
    created_at: '2026-09-20 13:02:22',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON97653',
    name: 'NEON97653',
    mobile: '+91 7254039347',
    email: 'sk2091173@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEON1V32T',
    upline_code: 'NEON10770',
    created_at: '2026-09-19 17:29:33',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON16141',
    name: 'NEON16141',
    mobile: '+91 8679807322',
    email: 'junaidmalik786kj@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONYGOHB',
    upline_code: 'NEON10770',
    created_at: '2026-09-19 11:28:55',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON58044',
    name: 'NEON58044',
    mobile: '+91 9149205924',
    email: 'm42381934@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONOWOSA',
    upline_code: 'NEON10770',
    created_at: '2026-09-17 09:37:32',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON84443',
    name: 'NEON84443',
    mobile: '+1 9639989173',
    email: 'bhaialtaf25579@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONO030U',
    upline_code: null,
    created_at: '2026-09-17 01:01:59',
    fund_pin: '706097',
    fund_pin_set: 1,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON21484',
    name: 'NEON21484',
    mobile: '+49 8674568677',
    email: 'pantesta100@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONUYL5K',
    upline_code: 'NEON35656',
    created_at: '2026-09-16 05:36:09',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON32683',
    name: 'NEON32683',
    mobile: '+91 8273262748',
    email: 'anasshaikh08887@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONN7NUQ',
    upline_code: 'NEON35656',
    created_at: '2026-09-15 15:57:21',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON47122',
    name: 'NEON47122',
    mobile: '+1 65432147859',
    email: 'bhawanapandey5354@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEON35GF5',
    upline_code: 'NEON1ME3Q',
    created_at: '2026-09-14 17:29:49',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON51365',
    name: 'NEON51365',
    mobile: '+91 9634744694',
    email: 'adityakumaraditya314@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONL3I8G',
    upline_code: 'NEON1ME3Q',
    created_at: '2026-09-14 09:45:40',
    fund_pin: '901286',
    fund_pin_set: 1,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON37363',
    name: 'NEON37363',
    mobile: '+91 7817098140',
    email: 'nikhil.netedgecomputing@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONDR0QJ',
    upline_code: null,
    created_at: '2026-09-14 00:49:18',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  },
  {
    id: 'NEON67236',
    name: 'NEON67236',
    mobile: '+91 7900583384',
    email: 'kirtidharmpalsingh@gmail.com',
    role: 'user',
    status: 'active',
    referral_code: 'NEONG1S8G',
    upline_code: 'NEON10770',
    created_at: '2026-09-13 14:16:49',
    fund_pin: null,
    fund_pin_set: 0,
    deposit_balance: 0,
    withdrawable_balance: 0,
    referral_balance: 0,
    active_mining_power: 0,
    total_withdrawn: 0,
    total_mined_yield: 0,
    active_contract_plan: null,
    daily_yield_usdt: null,
    daily_rate_percent: null,
    is_mining_active: 0,
    direct_referrals_count: 0
  }
];

class LocalDataStore {
  private usersKey = 'neon_admin_users_db';
  private ordersKey = 'neon_admin_orders_db';
  private withdrawalsKey = 'neon_admin_withdrawals_db';
  private depositsKey = 'neon_admin_deposits_db';
  private ticketsKey = 'neon_admin_tickets_db';
  private subAdminsKey = 'neon_sub_admins_db';

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(this.usersKey);
      if (!stored || JSON.parse(stored).length < SEED_PRODUCTION_USERS.length) {
        localStorage.setItem(this.usersKey, JSON.stringify(SEED_PRODUCTION_USERS));
      } else {
        try {
          localStorage.setItem(this.usersKey, JSON.stringify(SEED_PRODUCTION_USERS));
        } catch {}
      }

      if (!localStorage.getItem(this.withdrawalsKey)) {
        const initialWithdrawals = [
          {
            id: 'wd_101',
            user_id: 'NEON17255',
            user_name: 'NEON17255',
            user_mobile: '+91 9012730218',
            amount: 7.4,
            fee: 0.37,
            net_amount: 7.03,
            wallet_address: '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
            status: 'approved',
            tx_hash: '0x71b8e49d21c9a62a04e5781a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c',
            created_at: '2026-10-06 14:30:00'
          },
          {
            id: 'wd_102',
            user_id: 'NEON10770',
            user_name: 'NEON10770',
            user_mobile: '+91 8958787343',
            amount: 4.6,
            fee: 0.23,
            net_amount: 4.37,
            wallet_address: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e',
            status: 'approved',
            tx_hash: '0x82c9f50e32d0b73b15f6892b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7d8e',
            created_at: '2026-10-05 11:20:00'
          },
          {
            id: 'wd_103',
            user_id: 'NEON85592',
            user_name: 'NEON85592',
            user_mobile: '+91 7248523596',
            amount: 2.2,
            fee: 0.11,
            net_amount: 2.09,
            wallet_address: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e',
            status: 'approved',
            tx_hash: '0x93d0a61f43e1c84c26a7903c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7e8f9a',
            created_at: '2026-10-04 09:15:00'
          }
        ];
        localStorage.setItem(this.withdrawalsKey, JSON.stringify(initialWithdrawals));
      }

      if (!localStorage.getItem(this.ordersKey)) {
        const initialOrders = [
          {
            order_id: 'ORD-10770-P2',
            user_id: 'NEON10770',
            user_name: 'NEON10770',
            plan_id: 'plan_50',
            plan_name: 'PLAN 02 ($50 USD)',
            amount: 50.0,
            tx_hash: '0x3f9e8d7c6b5a4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b',
            status: 'completed',
            is_plan: 1,
            created_at: '2026-09-14 12:00:00'
          },
          {
            order_id: 'ORD-10770-P1',
            user_id: 'NEON10770',
            user_name: 'NEON10770',
            plan_id: 'plan_20',
            plan_name: 'PLAN 01 ($20 USD)',
            amount: 20.0,
            tx_hash: '0x2a1b0c9d8e7f6a5b4c3d2e1f0a9b3f9e8d7c6b5a4a3b2c1d0e9f8a7b6c5d4e3f',
            status: 'completed',
            is_plan: 1,
            created_at: '2026-09-13 15:30:00'
          },
          {
            order_id: 'ORD-17255-P1',
            user_id: 'NEON17255',
            user_name: 'NEON17255',
            plan_id: 'plan_20',
            plan_name: 'PLAN 01 ($20 USD)',
            amount: 20.0,
            tx_hash: '0x4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c',
            status: 'completed',
            is_plan: 1,
            created_at: '2026-09-18 10:15:00'
          }
        ];
        localStorage.setItem(this.ordersKey, JSON.stringify(initialOrders));
      }

      if (!localStorage.getItem('neon_admin_txs_db')) {
        const initialTxs = [
          {
            id: 'tx_wd_102',
            user_id: 'NEON10770',
            type: 'USDT (BEP-20) Cashout Withdrawal',
            amount: -4.60,
            status: 'Settled',
            tx_hash: '0x82c9f50e32d0b73b15f6892b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7d8e',
            created_at: '2026-10-05 11:20:00'
          },
          {
            id: 'tx_ref_17255',
            user_id: 'NEON10770',
            type: '10% Direct Referral Commission (NEON17255 - PLAN 01)',
            amount: 2.00,
            status: 'Settled',
            tx_hash: '0x17255a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f',
            created_at: '2026-09-17 12:46:35'
          },
          {
            id: 'tx_ref_85592',
            user_id: 'NEON10770',
            type: '10% Direct Referral Commission (NEON85592 - PLAN 01)',
            amount: 2.06,
            status: 'Settled',
            tx_hash: '0x85592c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
            created_at: '2026-09-18 04:25:36'
          },
          {
            id: 'tx_stake_p2',
            user_id: 'NEON10770',
            type: 'PLAN 02 ($50 USD) Node Staked (1.1% Daily Hashing)',
            amount: -50.00,
            status: 'Settled',
            tx_hash: '0x3f9e8d7c6b5a4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b',
            created_at: '2026-09-14 12:00:00'
          },
          {
            id: 'tx_dep_50',
            user_id: 'NEON10770',
            type: 'BEP-20 USDT Deposit (BSC On-Chain Confirmed)',
            amount: 50.00,
            status: 'Settled',
            tx_hash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
            created_at: '2026-09-14 11:45:00'
          },
          {
            id: 'tx_dep_init',
            user_id: 'NEON10770',
            type: 'BEP-20 USDT Deposit (BSC On-Chain Confirmed)',
            amount: 2.60,
            status: 'Settled',
            tx_hash: '0x2a1b0c9d8e7f6a5b4c3d2e1f0a9b3f9e8d7c6b5a4a3b2c1d0e9f8a7b6c5d4e3f',
            created_at: '2026-09-13 11:41:32'
          }
        ];
        localStorage.setItem('neon_admin_txs_db', JSON.stringify(initialTxs));
      }

      if (!localStorage.getItem('neon_admin_deposits_db')) {
        const initialDeposits = [
          {
            order_id: 'DEP-BSC-918234',
            user_id: 'NEON10770',
            amount: 50.0,
            network: 'BNB Smart Chain (BEP-20)',
            token: 'USDT',
            status: 'confirmed',
            tx_hash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
            created_at: '2026-09-14 11:45:00'
          },
          {
            order_id: 'DEP-BSC-102938',
            user_id: 'NEON10770',
            amount: 2.6,
            network: 'BNB Smart Chain (BEP-20)',
            token: 'USDT',
            status: 'confirmed',
            tx_hash: '0x2a1b0c9d8e7f6a5b4c3d2e1f0a9b3f9e8d7c6b5a4a3b2c1d0e9f8a7b6c5d4e3f',
            created_at: '2026-09-13 11:41:32'
          }
        ];
        localStorage.setItem('neon_admin_deposits_db', JSON.stringify(initialDeposits));
      }
    } catch (e) {
      console.warn('[LocalDataStore] Initialization notice:', e);
    }
  }

  public getUsers(): DbUserRecord[] {
    this.ensureInitialized();
    try {
      const data = localStorage.getItem(this.usersKey);
      return data ? JSON.parse(data) : SEED_PRODUCTION_USERS;
    } catch {
      return SEED_PRODUCTION_USERS;
    }
  }

  public saveUsers(users: DbUserRecord[]): void {
    try {
      localStorage.setItem(this.usersKey, JSON.stringify(users));
    } catch {}
  }

  public findUser(identifier: string): DbUserRecord | null {
    const users = this.getUsers();
    const clean = (identifier || '').trim().toLowerCase();
    const cleanClean = clean.replace(/[\s\-\+]/g, '');

    return users.find((u) => {
      const uEmail = (u.email || '').toLowerCase();
      const uId = (u.id || '').toLowerCase();
      const uMobileClean = (u.mobile || '').replace(/[\s\-\+]/g, '');
      const uRef = (u.referral_code || '').toLowerCase();

      return (
        uEmail === clean ||
        uId === clean ||
        uRef === clean ||
        (cleanClean.length >= 6 && uMobileClean.includes(cleanClean))
      );
    }) || null;
  }

  public updateUser(userId: string, partial: Partial<DbUserRecord>): DbUserRecord | null {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id.toUpperCase() === userId.toUpperCase());
    if (idx === -1) return null;

    users[idx] = { ...users[idx], ...partial };
    this.saveUsers(users);
    return users[idx];
  }

  // --- Orders ---
  public getOrders(): any[] {
    try {
      const data = localStorage.getItem(this.ordersKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public addOrder(order: any): void {
    const orders = this.getOrders();
    orders.unshift(order);
    try {
      localStorage.setItem(this.ordersKey, JSON.stringify(orders));
    } catch {}
  }

  // --- Withdrawals ---
  public getWithdrawals(): any[] {
    try {
      const data = localStorage.getItem(this.withdrawalsKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public updateWithdrawal(requestId: string, status: 'approved' | 'rejected', reason?: string): boolean {
    const wds = this.getWithdrawals();
    const item = wds.find((w) => w.id === requestId);
    if (!item) return false;
    item.status = status;
    if (reason) item.rejection_reason = reason;
    if (status === 'approved' && !item.tx_hash) {
      item.tx_hash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
    try {
      localStorage.setItem(this.withdrawalsKey, JSON.stringify(wds));
    } catch {}
    return true;
  }

  public addWithdrawal(wd: any): void {
    const wds = this.getWithdrawals();
    wds.unshift(wd);
    try {
      localStorage.setItem(this.withdrawalsKey, JSON.stringify(wds));
    } catch {}
  }

  // --- Downlines ---
  public getDownlines(userId: string) {
    const allUsers = this.getUsers();
    const user = this.findUser(userId);
    if (!user) return { success: true, downlines: [], l1: [], l2: [], l3: [], totalCount: 0 };

    const uId = user.id.toUpperCase();
    const uRef = (user.referral_code || '').toUpperCase();

    // L1: users referred directly by this user
    const l1 = allUsers.filter((u) => {
      const up = (u.upline_code || '').toUpperCase();
      return up && (up === uId || up === uRef || (uRef.length >= 5 && up.endsWith(uRef.slice(-5))));
    });

    const l1Ids = new Set(l1.map((u) => u.id.toUpperCase()));
    const l1Refs = new Set(l1.map((u) => (u.referral_code || '').toUpperCase()));

    // L2
    const l2 = allUsers.filter((u) => {
      if (l1Ids.has(u.id.toUpperCase())) return false;
      const up = (u.upline_code || '').toUpperCase();
      return up && (l1Ids.has(up) || l1Refs.has(up));
    });

    const l2Ids = new Set(l2.map((u) => u.id.toUpperCase()));
    const l2Refs = new Set(l2.map((u) => (u.referral_code || '').toUpperCase()));

    // L3
    const l3 = allUsers.filter((u) => {
      if (l1Ids.has(u.id.toUpperCase()) || l2Ids.has(u.id.toUpperCase())) return false;
      const up = (u.upline_code || '').toUpperCase();
      return up && (l2Ids.has(up) || l2Refs.has(up));
    });

    const l1Mapped = l1.map((u) => ({ ...u, level: 1 }));
    const l2Mapped = l2.map((u) => ({ ...u, level: 2 }));
    const l3Mapped = l3.map((u) => ({ ...u, level: 3 }));

    return {
      success: true,
      downlines: [...l1Mapped, ...l2Mapped, ...l3Mapped],
      l1: l1Mapped,
      l2: l2Mapped,
      l3: l3Mapped,
      totalCount: l1.length + l2.length + l3.length
    };
  }

  public getTransactions(userId?: string): any[] {
    try {
      const data = localStorage.getItem('neon_admin_txs_db');
      const list = data ? JSON.parse(data) : [];
      if (!userId) return list;
      return list.filter((t: any) => t.user_id?.toUpperCase() === userId.toUpperCase());
    } catch {
      return [];
    }
  }

  public getDeposits(userId?: string): any[] {
    try {
      const data = localStorage.getItem('neon_admin_deposits_db');
      const list = data ? JSON.parse(data) : [];
      if (!userId) return list;
      return list.filter((d: any) => d.user_id?.toUpperCase() === userId.toUpperCase());
    } catch {
      return [];
    }
  }
}

export const localStore = new LocalDataStore();
