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

export const OFFICIAL_VAULT_ADDRESS = '0x77A594DC9afF2F2fcbF49Ee8c1714772e8A8E79B';
const USDT_BEP20_CONTRACT = '0x55d398326f99059ff775485246999027b3197955';
const TRANSFER_EVENT_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export async function verifyBscTransaction(
  txHash: string,
  expectedAmount: number,
  expectedVaultAddress: string = OFFICIAL_VAULT_ADDRESS,
  rpcUrl: string = 'https://bsc-dataseed1.binance.org/'
): Promise<VerificationResult> {
  const cleanTxHash = (txHash || '').trim().toLowerCase();
  const cleanVault = (expectedVaultAddress || OFFICIAL_VAULT_ADDRESS).trim().toLowerCase();

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
    // 1. Fetch Transaction Details
    const txRes = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionByHash',
        params: [cleanTxHash]
      })
    });

    const txData: any = await txRes.json();
    if (!txData.result || !txData.result.blockNumber) {
      return {
        verified: false,
        actualAmount: 0,
        fromAddress: '',
        toAddress: '',
        blockNumber: 0,
        confirmations: 0,
        statusText: 'Transaction not found on Binance Smart Chain. Please verify your TxHash on bscscan.com or wait a few seconds for block mining.',
        error: 'TX_NOT_FOUND'
      };
    }

    const txBlockNumber = parseInt(txData.result.blockNumber, 16);

    // 2. Fetch Transaction Receipt to verify logs & success
    const receiptRes = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_getTransactionReceipt',
        params: [cleanTxHash]
      })
    });

    const receiptData: any = await receiptRes.json();
    const receipt = receiptData.result;

    if (!receipt) {
      return {
        verified: false,
        actualAmount: 0,
        fromAddress: '',
        toAddress: '',
        blockNumber: txBlockNumber,
        confirmations: 0,
        statusText: 'Transaction receipt not available yet. Transaction may still be executing on BSC.',
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

    // 3. Fetch Current Latest Block for confirmation count
    const blockRes = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'eth_blockNumber',
        params: []
      })
    });

    const blockData: any = await blockRes.json();
    const latestBlock = parseInt(blockData.result, 16);
    const confirmations = Math.max(0, latestBlock - txBlockNumber + 1);

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

        if (recipientAddress === cleanVault) {
          transferFound = true;
          break;
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
        statusText: `Transfer mismatch: No USDT transfer to custody vault (${expectedVaultAddress}) was found in transaction logs.`,
        error: 'VAULT_MISMATCH'
      };
    }

    if (transferAmount < expectedAmount - 0.05) {
      return {
        verified: false,
        actualAmount: transferAmount,
        fromAddress: senderAddress,
        toAddress: recipientAddress,
        blockNumber: txBlockNumber,
        confirmations,
        statusText: `Insufficient amount: Transferred amount is ${transferAmount.toFixed(2)} USDT, but required invoice is ${expectedAmount.toFixed(2)} USDT.`,
        error: 'AMOUNT_MISMATCH'
      };
    }

    return {
      verified: true,
      actualAmount: transferAmount,
      fromAddress: senderAddress,
      toAddress: expectedVaultAddress,
      blockNumber: txBlockNumber,
      confirmations,
      statusText: `? Verified on BNB Smart Chain! Confirmed ${transferAmount.toFixed(2)} USDT transfer to vault.`
    };
  } catch (err: any) {
    return {
      verified: false,
      actualAmount: 0,
      fromAddress: '',
      toAddress: '',
      blockNumber: 0,
      confirmations: 0,
      statusText: `BSC node verification error: ${err.message}. Please check your connection.`,
      error: 'RPC_ERROR'
    };
  }
}
