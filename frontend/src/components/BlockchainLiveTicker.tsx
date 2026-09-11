import React, { useState, useEffect } from 'react';

interface Props {
  blockNumber: number;
}

const HASHES = [
  '0x7f2b..9ac1',
  '0x3d91..4fe8',
  '0xb842..10cd',
  '0x19ae..774f',
  '0xfa50..92b3'
];

interface ChainRate {
  symbol: string;
  name: string;
  price: number;
  color: string;
  bg: string;
  border: string;
  decimals: number;
}

export const BlockchainLiveTicker: React.FC<Props> = ({ blockNumber }) => {
  const [currentHashIndex, setCurrentHashIndex] = useState(0);
  const [gasGwei, setGasGwei] = useState(3.0);
  const [activeChainIndex, setActiveChainIndex] = useState(0);

  // Live prices for BNB, BTC, TRX, ETH
  const [prices, setPrices] = useState<{ [key: string]: number }>(() => {
    try {
      const cached = localStorage.getItem('neon_crypto_live_prices');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return {
      BNB: 638.40,
      BTC: 64250.00,
      TRX: 0.1625,
      ETH: 2640.80
    };
  });

  const [isPriceLive, setIsPriceLive] = useState(true);

  // Fetch real-time live prices from Binance API
  useEffect(() => {
    let isMounted = true;

    const fetchPrices = async () => {
      try {
        const symbolsParam = encodeURIComponent(JSON.stringify(['BNBUSDT', 'BTCUSDT', 'TRXUSDT', 'ETHUSDT']));
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbols=${symbolsParam}`, {
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && isMounted) {
            const nextPrices: { [key: string]: number } = { ...prices };
            data.forEach((item: { symbol: string; price: string }) => {
              const p = parseFloat(item.price);
              if (!isNaN(p) && p > 0) {
                if (item.symbol === 'BNBUSDT') nextPrices.BNB = p;
                if (item.symbol === 'BTCUSDT') nextPrices.BTC = p;
                if (item.symbol === 'TRXUSDT') nextPrices.TRX = p;
                if (item.symbol === 'ETHUSDT') nextPrices.ETH = p;
              }
            });
            setPrices(nextPrices);
            setIsPriceLive(true);
            try {
              localStorage.setItem('neon_crypto_live_prices', JSON.stringify(nextPrices));
            } catch (e) {}
            return;
          }
        }
      } catch (err) {
        // Fallback: CoinGecko multi-token query
        try {
          const cgRes = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin,bitcoin,tron,ethereum&vs_currencies=usd',
            { cache: 'no-store' }
          );
          if (cgRes.ok && isMounted) {
            const cg = await cgRes.json();
            const nextPrices: { [key: string]: number } = { ...prices };
            if (cg.binancecoin?.usd) nextPrices.BNB = cg.binancecoin.usd;
            if (cg.bitcoin?.usd) nextPrices.BTC = cg.bitcoin.usd;
            if (cg.tron?.usd) nextPrices.TRX = cg.tron.usd;
            if (cg.ethereum?.usd) nextPrices.ETH = cg.ethereum.usd;
            setPrices(nextPrices);
            setIsPriceLive(true);
          }
        } catch (e) {}
      }
    };

    fetchPrices();
    const priceInterval = setInterval(fetchPrices, 15000);

    return () => {
      isMounted = false;
      clearInterval(priceInterval);
    };
  }, []);

  // 5-Second Chain Rotation (BNB -> BTC -> TRX -> ETH)
  useEffect(() => {
    const rotateInterval = setInterval(() => {
      setActiveChainIndex((prev) => (prev + 1) % 4);
    }, 5000);

    return () => clearInterval(rotateInterval);
  }, []);

  // Hash & Gas Gwei visual cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHashIndex((prev) => (prev + 1) % HASHES.length);
      setGasGwei((prev) => +(3.0 + (Math.random() * 0.2 - 0.1)).toFixed(1));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const chains: ChainRate[] = [
    {
      symbol: 'BNB',
      name: 'BNB Chain',
      price: prices.BNB || 638.40,
      color: 'text-[#FBBF24]',
      bg: 'bg-[#FBBF24]/10',
      border: 'border-[#FBBF24]/30',
      decimals: 2
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: prices.BTC || 64250.00,
      color: 'text-[#F7931A]',
      bg: 'bg-[#F7931A]/10',
      border: 'border-[#F7931A]/30',
      decimals: 2
    },
    {
      symbol: 'TRX',
      name: 'TRON',
      price: prices.TRX || 0.1625,
      color: 'text-[#FF4B4B]',
      bg: 'bg-[#FF4B4B]/10',
      border: 'border-[#FF4B4B]/30',
      decimals: 4
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: prices.ETH || 2640.80,
      color: 'text-[#627EEA]',
      bg: 'bg-[#627EEA]/10',
      border: 'border-[#627EEA]/30',
      decimals: 2
    }
  ];

  const currentChain = chains[activeChainIndex] || chains[0];

  const formatPrice = (p: number, dec: number) => {
    if (dec === 4) return `$${p.toFixed(4)}`;
    return `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div translate="no" className="notranslate w-full bg-[#050C18]/90 border-b border-[#00F0FF]/15 px-3.5 py-1.5 flex items-center justify-between text-[10px] font-mono select-none">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
        <span className="text-[#94A3B8]">BLOCK #{blockNumber.toLocaleString()}</span>
      </div>

      <div className="text-[#00F0FF] truncate max-w-[110px] xs:max-w-none transition-all">
        HASH {HASHES[currentHashIndex]}
      </div>

      <div className="flex items-center gap-2">
        {/* 5-Second Rotating Live Price Badge (BNB -> BTC -> TRX -> ETH) - Consistent BNB Gold Color */}
        <div
          className="flex items-center gap-1.5 text-[#FBBF24] font-bold bg-[#FBBF24]/10 px-2 py-0.5 rounded border border-[#FBBF24]/20 transition-colors"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isPriceLive ? 'bg-[#10B981] animate-ping' : 'bg-[#FBBF24]'}`} />
          <span className="font-extrabold">{currentChain.symbol}</span>
          <span className="font-mono">{formatPrice(currentChain.price, currentChain.decimals)}</span>
        </div>
        <span className="text-[#64748B] hidden xs:inline">
          · {gasGwei} Gwei
        </span>
      </div>
    </div>
  );
};
