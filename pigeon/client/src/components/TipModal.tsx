import { useState, useCallback } from "react";
import { usePrivatePayments } from "../hooks/usePrivatePayments";
import { TIP_PRESETS, lamportsToSol, solToLamports } from "../utils/magicblock";

interface TipModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientAddress: string;
    recipientLabel?: string;
}

type TipStep = "amount" | "confirm" | "success" | "error";

export function TipModal({ isOpen, onClose, recipientAddress, recipientLabel }: TipModalProps) {
    const { sendTip, isLoading, error, clearError } = usePrivatePayments();

    const [step, setStep] = useState<TipStep>("amount");
    const [selectedAmount, setSelectedAmount] = useState<number>(TIP_PRESETS[0].lamports);
    const [customAmount, setCustomAmount] = useState<string>("");
    const [txSignature, setTxSignature] = useState<string>("");

    const displayRecipient = recipientLabel || `${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`;

    const handleClose = useCallback(() => {
        setStep("amount");
        setSelectedAmount(TIP_PRESETS[0].lamports);
        setCustomAmount("");
        setTxSignature("");
        clearError();
        onClose();
    }, [onClose, clearError]);

    const handlePresetClick = (lamports: number) => {
        setSelectedAmount(lamports);
        setCustomAmount("");
    };

    const handleCustomAmountChange = (value: string) => {
        setCustomAmount(value);
        const parsed = parseFloat(value);
        if (!isNaN(parsed) && parsed > 0) {
            setSelectedAmount(solToLamports(parsed));
        }
    };

    const handleConfirm = () => {
        setStep("confirm");
    };

    const handleSendTip = async () => {
        try {
            const result = await sendTip(recipientAddress, selectedAmount);
            setTxSignature(result.signature);
            setStep("success");
        } catch {
            setStep("error");
        }
    };

    const handleBack = () => {
        setStep("amount");
        clearError();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md mx-4 bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-lg font-semibold text-white">
                        {step === "success" ? "✅ Tip Sent!" : step === "error" ? "❌ Failed" : "💰 Send Tip"}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === "amount" && (
                        <div className="space-y-6">
                            <p className="text-gray-300 text-center">
                                Send a tip to <span className="text-purple-400 font-medium">{displayRecipient}</span>
                            </p>

                            {/* Preset amounts */}
                            <div className="grid grid-cols-3 gap-3">
                                {TIP_PRESETS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => handlePresetClick(preset.lamports)}
                                        className={`py-3 px-4 rounded-xl font-medium transition-all ${selectedAmount === preset.lamports && !customAmount
                                                ? "bg-purple-600 text-white"
                                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                            }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            {/* Custom amount */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Or enter custom amount:</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        placeholder="0.00"
                                        value={customAmount}
                                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">SOL</span>
                                </div>
                            </div>

                            <button
                                onClick={handleConfirm}
                                disabled={selectedAmount <= 0}
                                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {step === "confirm" && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white mb-2">
                                    {lamportsToSol(selectedAmount)} SOL
                                </p>
                                <p className="text-gray-400">
                                    to {displayRecipient}
                                </p>
                            </div>

                            <div className="bg-gray-800 rounded-xl p-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">Amount</span>
                                    <span className="text-white">{lamportsToSol(selectedAmount)} SOL</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Network fee</span>
                                    <span className="text-white">~0.000005 SOL</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleBack}
                                    disabled={isLoading}
                                    className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSendTip}
                                    disabled={isLoading}
                                    className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Sending...
                                        </>
                                    ) : (
                                        "Confirm & Send"
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === "success" && (
                        <div className="space-y-6 text-center">
                            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            <div>
                                <p className="text-xl font-semibold text-white mb-1">Tip sent successfully!</p>
                                <p className="text-gray-400">
                                    {lamportsToSol(selectedAmount)} SOL to {displayRecipient}
                                </p>
                            </div>

                            <a
                                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-purple-400 hover:text-purple-300 text-sm underline"
                            >
                                View on Explorer ↗
                            </a>

                            <button
                                onClick={handleClose}
                                className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    )}

                    {step === "error" && (
                        <div className="space-y-6 text-center">
                            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>

                            <div>
                                <p className="text-xl font-semibold text-white mb-2">Transaction Failed</p>
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleBack}
                                    className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
