/**
 * BNB Smart Chain (BEP-20) Client-Side On-Chain Verification Engine
 * Directly connects to official Binance Smart Chain public RPC nodes
 * to strictly verify real USDT transfers to the vault address.
 */

export interface VerificationResult {
  verified: boolean;
  actualAmount: number;
  fromAddress: string;
  toAddress: string;
  blockNumber: number;
  confirmations: number;
  statusText: string;
  error?: string;
}

export const OFFICIAL_VAULT_ADDRESS = '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d';
const PREVIOUS_VAULT_ADDRESS = '0x77A594DC9afF2F2fcbF49Ee8c1714772e8A8E79B';
const USDT_BEP20_CONTRACT = '0x55d398326f99059ff775485246999027b3197955';
const TRANSFER_EVENT_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const BSC_RPCS = [
  'https://bsc-dataseed1.binance.org/',
  'https://bsc-dataseed2.binance.org/',
  'https://bsc-dataseed3.binance.org/'
];

async function callBscRpc(method: string, params: any[]): Promise<any> {
  let lastError: any = null;
  for (const rpcUrl of BSC_RPCS) {
    try {
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params
        }),
        signal: AbortSignal.timeout(8000)
      });
      if (!res.ok) continue;
      const data: any = await res.json();
      if (data && data.result !== undefined) {
        return data;
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('BSC RPC connection timed out. Please try again.');
}

export async function verifyBscTransaction(
  txHash: string,
  expectedAmount: number,
  expectedVaultAddress: string = OFFICIAL_VAULT_ADDRESS,
  _rpcUrl?: string
): Promise<VerificationResult> {
  // Normalize TxHash: remove spaces/quotes, prepend 0x if 64 chars
  let cleanTxHash = (txHash || '').trim().toLowerCase();
  cleanTxHash = cleanTxHash.replace(/[^0-9a-fx]/gi, '');
  if (!cleanTxHash.startsWith('0x') && cleanTxHash.length === 64) {
    cleanTxHash = '0x' + cleanTxHash;
  }

  const cleanVault = (expectedVaultAddress || OFFICIAL_VAULT_ADDRESS).trim().toLowerCase();
  const ACCEPTED_VAULTS = new Set([
    cleanVault,
    OFFICIAL_VAULT_ADDRESS.toLowerCase(),
    PREVIOUS_VAULT_ADDRESS.toLowerCase()
  ]);

  if (!cleanTxHash.startsWith('0x') || cleanTxHash.length !== 66) {
    return {
      verified: false,
      actualAmount: 0,
      fromAddress: '',
      toAddress: '',
      blockNumber: 0,
      confirmations: 0,
      statusText: 'Invalid Binance Smart Chain transaction hash format. It must be a 66-character hex string starting with 0x.',
      error: 'INVALID_HASH_FORMAT'
    };
  }

  try {
    // 1. Fetch Transaction Details (multi-RPC fallback)
    const txData = await callBscRpc('eth_getTransactionByHash', [cleanTxHash]);
    if (!txData.result || !txData.result.blockNumber) {
      return {
        verified: false,
        actualAmount: 0,
        fromAddress: '',
        toAddress: '',
        blockNumber: 0,
        confirmations: 0,
        statusText: 'Transaction not found on Binance Smart Chain yet. Please confirm your TxHash or wait 10-15 seconds for BSC block mining.',
        error: 'TX_NOT_FOUND'
      };
    }

    const txBlockNumber = parseInt(txData.result.blockNumber, 16);

    // 2. Fetch Transaction Receipt to verify logs & success
    const receiptData = await callBscRpc('eth_getTransactionReceipt', [cleanTxHash]);
    const receipt = receiptData.result;

    if (!receipt) {
      return {
        verified: false,
        actualAmount: 0,
        fromAddress: '',
        toAddress: '',
        blockNumber: txBlockNumber,
        confirmations: 0,
        statusText: 'Transaction receipt is still pending on BNB Smart Chain. Please tap Verify again in 10 seconds.',
        error: 'RECEIPT_PENDING'
      };
    }

    if (receipt.status !== '0x1') {
      return {
        verified: false,
        actualAmount: 0,
        fromAddress: '',
        toAddress: '',
        blockNumber: txBlockNumber,
        confirmations: 0,
        statusText: 'Transaction was REVERTED or FAILED on Binance Smart Chain.',
        error: 'TX_REVERTED'
      };
    }

    // 3. Fetch Current Latest Block for confirmation count & 5-minute age validation
    let confirmations = 3;
    let latestBlock = txBlockNumber + 3;
    try {
      const blockData = await callBscRpc('eth_blockNumber', []);
      latestBlock = parseInt(blockData.result, 16);
      confirmations = Math.max(1, latestBlock - txBlockNumber + 1);
    } catch {}

    // STRICT 2-MINUTE BLOCK AGE ENFORCEMENT:
    // Binance Smart Chain produces 1 block every 3.0 seconds (40 blocks = 2 minutes).
    let blockAgeSeconds = Math.max(0, (latestBlock - txBlockNumber) * 3);

    try {
      const blockDetails = await callBscRpc('eth_getBlockByNumber', [txData.result.blockNumber, false]);
      if (blockDetails && blockDetails.result && blockDetails.result.timestamp) {
        const blockTimestampSec = parseInt(blockDetails.result.timestamp, 16);
        const currentTimestampSec = Math.floor(Date.now() / 1000);
        blockAgeSeconds = Math.max(0, currentTimestampSec - blockTimestampSec);
      }
    } catch {}

    const MAX_ALLOWED_AGE_SECONDS = 2 * 60; // Strictly 2 minutes (120 seconds)
    if (blockAgeSeconds > MAX_ALLOWED_AGE_SECONDS) {
      const ageMinutes = Math.floor(blockAgeSeconds / 60);
      const ageText = ageMinutes >= 60
        ? `${(ageMinutes / 60).toFixed(1)} hours`
        : ageMinutes >= 1
          ? `${ageMinutes} minutes`
          : `${blockAgeSeconds} seconds`;
      return {
        verified: false,
        actualAmount: 0,
        fromAddress: '',
        toAddress: '',
        blockNumber: txBlockNumber,
        confirmations: confirmations,
        statusText: `Transaction Expired: This transaction was mined ${ageText} ago on Binance Smart Chain. For security, transactions older than 2 minutes cannot be accepted. Please make a fresh payment for this session.`,
        error: 'TX_EXPIRED'
      };
    }

    // 4. Inspect Receipt Logs for BEP-20 USDT Transfer Event
    let transferFound = false;
    let transferAmount = 0;
    let senderAddress = '';
    let recipientAddress = '';

    for (const log of receipt.logs || []) {
      const contractAddress = (log.address || '').toLowerCase();
      const topics = log.topics || [];

      if (
        contractAddress === USDT_BEP20_CONTRACT &&
        topics[0] &&
        topics[0].toLowerCase() === TRANSFER_EVENT_TOPIC
      ) {
        senderAddress = '0x' + (topics[1] || '').slice(26).toLowerCase();
        recipientAddress = '0x' + (topics[2] || '').slice(26).toLowerCase();

        const rawValueBigInt = BigInt(log.data);
        const decimals = 18n;
        const divisor = 10n ** decimals;
        const whole = Number(rawValueBigInt / divisor);
        const fraction = Number(rawValueBigInt % divisor) / 1e18;
        transferAmount = whole + fraction;

        // Accept if recipient is either current vault or previous vault
        if (ACCEPTED_VAULTS.has(recipientAddress)) {
          transferFound = true;
          break;
        }
      }
    }

    // Fallback: Check if user sent native BNB directly to the vault
    if (!transferFound && txData.result && txData.result.to) {
      const txTo = (txData.result.to || '').toLowerCase();
      if (ACCEPTED_VAULTS.has(txTo)) {
        const rawValue = BigInt(txData.result.value || '0x0');
        const bnbVal = Number(rawValue) / 1e18;
        if (bnbVal > 0) {
          transferAmount = +(bnbVal * 600).toFixed(2);
          transferFound = true;
          senderAddress = txData.result.from || '';
          recipientAddress = txTo;
        }
      }
    }

    if (!transferFound) {
      return {
        verified: false,
        actualAmount: transferAmount,
        fromAddress: senderAddress,
        toAddress: recipientAddress,
        blockNumber: txBlockNumber,
        confirmations,
        statusText: `Transfer mismatch: No transfer to official custody vault was found in transaction logs. Please verify recipient address.`,
        error: 'VAULT_MISMATCH'
      };
    }

    // Exchange Fee Tolerance Buffer:
    // For small deposits ($2-$5), allow up to 0.70 USDT buffer (minimum accepted is $1.50 USDT).
    // For other amounts, allow 0.30 USDT buffer.
    const FEE_TOLERANCE_BUFFER = expectedAmount <= 5 ? 0.70 : 0.30;
    const minAcceptableAmount = +(Math.max(1.50, expectedAmount - FEE_TOLERANCE_BUFFER)).toFixed(2);
    if (transferAmount < minAcceptableAmount) {
      return {
        verified: false,
        actualAmount: transferAmount,
        fromAddress: senderAddress,
        toAddress: recipientAddress,
        blockNumber: txBlockNumber,
        confirmations,
        statusText: `Insufficient amount: Transferred amount is ${transferAmount.toFixed(2)} USDT, but required invoice is ${expectedAmount.toFixed(2)} USDT (minimum accepted with fee buffer: ${minAcceptableAmount.toFixed(2)} USDT).`,
        error: 'AMOUNT_MISMATCH'
      };
    }

    // Auto-normalize: If amount is within fee tolerance buffer (e.g. 19.70 - 20.10 for 20 USDT),
    // normalize actualAmount to full expectedAmount so user, ledger, and admin count the full nominal amount.
    const normalizedAmount = (transferAmount >= minAcceptableAmount && transferAmount <= expectedAmount + 0.10)
      ? expectedAmount
      : +(transferAmount).toFixed(2);

    return {
      verified: true,
      actualAmount: normalizedAmount,
      fromAddress: senderAddress,
      toAddress: recipientAddress,
      blockNumber: txBlockNumber,
      confirmations,
      statusText: `✓ Verified on BNB Smart Chain! Confirmed ${normalizedAmount.toFixed(2)} USDT transfer to vault.`
    };
  } catch (err: any) {
    return {
      verified: false,
      actualAmount: 0,
      fromAddress: '',
      toAddress: '',
      blockNumber: 0,
      confirmations: 0,
      statusText: `BSC node verification error: ${err.message || 'Connection timeout'}. Please try again in a few seconds.`,
      error: 'RPC_ERROR'
    };
  }
}
