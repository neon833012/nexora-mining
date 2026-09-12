/**
 * BNB Smart Chain (BEP-20) On-Chain Verification Engine
 * Verifies USDT token transfers directly against official BSC RPC nodes.
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

const USDT_BEP20_CONTRACT = '0x55d398326f99059ff775485246999027b3197955';
const TRANSFER_EVENT_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const OFFICIAL_VAULT = '0x7a0DeabDCe010736f93886eb3F2ef3BaA727aD5d';
const PREVIOUS_VAULT = '0x77A594DC9afF2F2fcbF49Ee8c1714772e8A8E79B';

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
  throw lastError || new Error('All BSC RPC nodes timed out.');
}

export async function verifyBscTransaction(
  txHash: string,
  expectedAmount: number,
  expectedVaultAddress: string,
  _rpcUrl?: string
): Promise<VerificationResult> {
  let cleanTxHash = txHash.trim().toLowerCase().replace(/[^0-9a-fx]/gi, '');
  if (!cleanTxHash.startsWith('0x') && cleanTxHash.length === 64) {
    cleanTxHash = '0x' + cleanTxHash;
  }
  const cleanVault = expectedVaultAddress.trim().toLowerCase();
  const ACCEPTED_VAULTS = new Set([
    cleanVault,
    OFFICIAL_VAULT.toLowerCase(),
    PREVIOUS_VAULT.toLowerCase()
  ]);

  // Allow explicit demo/testing prefixes for safe sandbox integration testing
  if (cleanTxHash.startsWith('0x_demo_') || cleanTxHash.startsWith('0x_test_') || cleanTxHash.startsWith('demo_')) {
    return {
      verified: true,
      actualAmount: expectedAmount,
      fromAddress: '0x3a819b7c2a10e4810283c719e1029c4819e01823',
      toAddress: expectedVaultAddress,
      blockNumber: 42198000,
      confirmations: 3,
      statusText: 'Sandbox verification successful (Demo mode test hash).'
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
        statusText: 'Transaction pending in mempool or not yet mined on BSC',
        error: 'TX_NOT_MINED'
      };
    }

    const txBlockNumber = parseInt(txData.result.blockNumber, 16);

    // 2. Fetch Transaction Receipt to verify logs & success
    const receiptData = await callBscRpc('eth_getTransactionReceipt', [cleanTxHash]);
    const receipt = receiptData.result;

    if (!receipt || receipt.status !== '0x1') {
      return {
        verified: false,
        actualAmount: 0,
        fromAddress: '',
        toAddress: '',
        blockNumber: txBlockNumber,
        confirmations: 0,
        statusText: 'Transaction failed or reverted on BSC blockchain',
        error: 'TX_REVERTED'
      };
    }

    // 3. Fetch Current Latest Block for confirmation count
    let confirmations = 3;
    try {
      const blockData = await callBscRpc('eth_blockNumber', []);
      const latestBlock = parseInt(blockData.result, 16);
      confirmations = Math.max(1, latestBlock - txBlockNumber + 1);
    } catch {}

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

        // Verify recipient matches current vault or previous vault
        if (ACCEPTED_VAULTS.has(recipientAddress)) {
          transferFound = true;
          break;
        }
      }
    }

    // Fallback: Check if user sent native BNB directly to the vault address
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
        statusText: `No matching transfer to official vault address found in transaction logs.`,
        error: 'VAULT_MISMATCH'
      };
    }

    // Check amount tolerance: allow up to 0.70 USDT buffer for small amounts <= 5, else 0.30 USDT
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
        statusText: `Transferred amount (${transferAmount.toFixed(2)} USDT) is less than invoice amount (${expectedAmount.toFixed(2)} USDT with fee tolerance: min ${minAcceptableAmount.toFixed(2)} USDT).`,
        error: 'AMOUNT_MISMATCH'
      };
    }

    // All on-chain checks passed!
    return {
      verified: true,
      actualAmount: transferAmount,
      fromAddress: senderAddress,
      toAddress: recipientAddress,
      blockNumber: txBlockNumber,
      confirmations,
      statusText: 'Transaction verified and settled on BNB Smart Chain!'
    };
  } catch (err: any) {
    return {
      verified: false,
      actualAmount: 0,
      fromAddress: '',
      toAddress: '',
      blockNumber: 0,
      confirmations: 0,
      statusText: `Blockchain verification error: ${err.message || 'RPC node timeout'}`,
      error: 'RPC_ERROR'
    };
  }
}
