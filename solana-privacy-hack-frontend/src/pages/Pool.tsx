import { useEffect, useState, type FC } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import AssetSelector from "../components/AssetSelector";
import QuickButtons from "../components/QuickButtons";
import InfoCard from "../components/InfoCard";
import { getBalance, requestDepositTx, requestWithdrawTx } from "../apis/pool";

const Pool: FC = () => {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("0.00");
  const [loading, setLoading] = useState(false);

  const toLamports = (sol: number) => Math.round(sol * 1e9);

  const handleDeposit = async () => {
    if (!publicKey || !signTransaction) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    setLoading(true);
    try {
      const lamports = toLamports(amountNum);
      // Request deposit transaction from backend
      const { transaction: b64Tx } = await requestDepositTx(
        publicKey.toString(),
        lamports
      );

      // Decode the base64 transaction
      const tx = Transaction.from(Buffer.from(b64Tx, "base64"));

      // Sign the transaction
      const sign = await signTransaction(tx);

      // Send the signed transaction
      const signature = await connection.sendRawTransaction(sign.serialize());

      // Confirm the transaction
      const confirmation = await connection.confirmTransaction(
        signature,
        "confirmed"
      );

      if (confirmation.value.err) {
        throw new Error("Transaction failed to confirm");
      }

      console.log("Deposit successful, signature:", signature);
      setAmount("");

      // Refresh balance
      const response = await getBalance(publicKey.toString());
      setBalance(response.balance);
    } catch (error) {
      console.log("Deposit error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!publicKey || !signTransaction) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    setLoading(true);
    try {
      const lamports = toLamports(amountNum);
      // Request withdraw transaction from backend
      const { transaction: b64Tx } = await requestWithdrawTx(
        publicKey.toString(),
        lamports
      );

      // Decode the base64 transaction
      const tx = Transaction.from(Buffer.from(b64Tx, "base64"));

      // Sign the transaction
      const signedTx = await signTransaction(tx);

      // Send the signed transaction
      const signature = await connection.sendRawTransaction(
        signedTx.serialize()
      );

      // Confirm the transaction
      const confirmation = await connection.confirmTransaction(
        signature,
        "confirmed"
      );

      if (confirmation.value.err) {
        throw new Error("Transaction failed to confirm");
      }

      console.log("Withdraw successful, signature:", signature);
      setAmount("");

      // Refresh balance
      const response = await getBalance(publicKey.toString());
      setBalance(response.balance);
    } catch (error) {
      console.error("Withdraw error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (publicKey) {
        try {
          const response = await getBalance(publicKey.toString());
          setBalance(response.balance);
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      }
    })();
  }, [publicKey]);

  return (
    <div className="px-6 py-10">
      <div className="max-w-4xl mx-auto bg-[#1F1F1F] rounded-xl p-6 space-y-6">
        {/* Tabs */}
        <div className="flex justify-center space-x-8 text-lg font-semibold">
          <button
            className={tab === "deposit" ? "text-orange-400" : "text-gray-500"}
            onClick={() => setTab("deposit")}
          >
            Deposit
          </button>
          <button
            className={tab === "withdraw" ? "text-orange-400" : "text-gray-500"}
            onClick={() => setTab("withdraw")}
          >
            Withdraw
          </button>
        </div>

        {/* Main Card */}
        <div className="flex gap-6">
          {/* Left */}
          <div className="flex-1 space-y-6">
            <AssetSelector />

            <div>
              <label className="text-sm text-gray-400">Amount</label>
              <input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-3 text-lg text-white"
              />
            </div>

            <QuickButtons setAmount={setAmount} />

            <button
              onClick={tab === "deposit" ? handleDeposit : handleWithdraw}
              disabled={loading || !publicKey || !amount}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              {loading
                ? "Processing..."
                : tab === "deposit"
                ? "Deposit SOL"
                : "Withdraw SOL"}
            </button>
          </div>

          {/* Right */}
          <div className="w-64 space-y-4">
            <div className="bg-[#222] rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400">Shielded Balance</p>
              <p className="text-3xl font-semibold">{balance} SOL</p>
              <p className="text-xs text-green-400">Protected</p>
              <p className="text-xs text-gray-500">Available: {balance}</p>
            </div>

            <InfoCard
              title="Zero-Knowledge Encryption"
              desc="Your balance is encrypted on-chain using ZK proofs."
            />

            <InfoCard title="Processing" desc="Instant confirmation" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pool;
