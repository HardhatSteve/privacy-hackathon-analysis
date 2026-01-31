"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Copy, Check, Share2, QrCode, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/useToast";
import { useBalance } from "@/hooks/useBalance";
import { formatAddress, formatAmount } from "@/lib/utils";
import type { Currency } from "@/types";

export default function ReceivePage() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const { balance } = useBalance();

  const [copied, setCopied] = useState(false);
  const [requestAmount, setRequestAmount] = useState<string>("");
  const [requestCurrency, setRequestCurrency] = useState<Currency>("USDC");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    if (!connected) {
      router.push("/");
    }
  }, [connected, router]);

  const walletAddress = publicKey?.toString() || "";

  const generateSolanaPayUrl = () => {
    let url = `solana:${walletAddress}`;
    const params: string[] = [];

    if (requestAmount) {
      params.push(`amount=${requestAmount}`);
    }
    if (memo) {
      params.push(`memo=${encodeURIComponent(memo)}`);
    }
    if (requestCurrency !== "SOL") {
      // Add SPL token reference
      params.push(`spl-token=${requestCurrency}`);
    }

    if (params.length > 0) {
      url += "?" + params.join("&");
    }

    return url;
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the address manually",
        variant: "destructive",
      });
    }
  };

  const shareAddress = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ShieldedRemit Payment Request",
          text: `Send payment to: ${walletAddress}`,
          url: generateSolanaPayUrl(),
        });
      } catch {
        // User cancelled share
      }
    } else {
      copyAddress();
    }
  };

  const downloadQR = () => {
    const svg = document.querySelector("#qr-code svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = "shieldedremit-qr.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (!connected) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Receive Payment</h1>
          <p className="text-muted-foreground">
            Share your address or create a payment request
          </p>
        </div>

        <Tabs defaultValue="address" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="address">Wallet Address</TabsTrigger>
            <TabsTrigger value="request">Payment Request</TabsTrigger>
          </TabsList>

          {/* Wallet Address Tab */}
          <TabsContent value="address">
            <Card>
              <CardHeader>
                <CardTitle>Your Wallet Address</CardTitle>
                <CardDescription>
                  Share this address to receive payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* QR Code */}
                <div
                  id="qr-code"
                  className="flex justify-center p-6 bg-white rounded-xl"
                >
                  <QRCodeSVG
                    value={walletAddress}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>

                {/* Address Display */}
                <div className="space-y-2">
                  <Label>Solana Address</Label>
                  <div className="flex gap-2">
                    <Input
                      value={walletAddress}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyAddress}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Balance Display */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">SOL</p>
                    <p className="font-semibold">{formatAmount(balance.sol, 4)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">USDC</p>
                    <p className="font-semibold">{formatAmount(balance.usdc, 2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">USDT</p>
                    <p className="font-semibold">{formatAmount(balance.usdt, 2)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={shareAddress}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={downloadQR}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download QR
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Request Tab */}
          <TabsContent value="request">
            <Card>
              <CardHeader>
                <CardTitle>Create Payment Request</CardTitle>
                <CardDescription>
                  Generate a QR code with a specific amount
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Currency Selection */}
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={requestCurrency}
                    onValueChange={(v) => setRequestCurrency(v as Currency)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SOL">SOL</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="USDT">USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <Label>Amount (Optional)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                  />
                </div>

                {/* Memo Input */}
                <div className="space-y-2">
                  <Label>Memo (Optional)</Label>
                  <Input
                    placeholder="Payment for..."
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                  />
                </div>

                {/* Generated QR Code */}
                <div
                  id="qr-code-request"
                  className="flex justify-center p-6 bg-white rounded-xl"
                >
                  <QRCodeSVG
                    value={generateSolanaPayUrl()}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>

                {/* Request Summary */}
                {requestAmount && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      Payment Request
                    </p>
                    <p className="text-xl font-semibold">
                      {requestAmount} {requestCurrency}
                    </p>
                    {memo && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {memo}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={shareAddress}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Request
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const url = generateSolanaPayUrl();
                      navigator.clipboard.writeText(url);
                      toast({
                        title: "Copied!",
                        description: "Payment URL copied to clipboard",
                      });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
