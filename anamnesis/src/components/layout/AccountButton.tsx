import { Link } from "react-router-dom"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { UserCircle, CreditCard, Settings, User } from "lucide-react"
import { useTranslation } from "@/i18n/config"
import { useWalletManager } from "@/hooks/use-wallet-manager"
import { useExternalWallets } from "@/hooks/use-external-wallets"
import { shortenedAddress } from "@/lib/utils"
import {
  ArweaveIcon,
  EthereumIcon,
  SolanaIcon,
  BitcoinIcon,
  SuiIcon,
} from "@/components/icons"

/**
 * 根据链类型获取对应的图标组件
 */
function getChainIcon(chain?: string) {
  switch (chain?.toLowerCase()) {
    case "ethereum":
      return <EthereumIcon className="h-3.5 w-3.5" />
    case "solana":
      return <SolanaIcon className="h-3.5 w-3.5" />
    case "bitcoin":
      return <BitcoinIcon className="h-3.5 w-3.5" />
    case "sui":
      return <SuiIcon className="h-3.5 w-3.5" />
    case "arweave":
      return <ArweaveIcon className="h-3.5 w-3.5" />
    default:
      return <User className="h-3.5 w-3.5" />
  }
}

export function AccountButton() {
  const walletManager = useWalletManager()
  const externalWallets = useExternalWallets()

  const activeAccount = walletManager.wallets.find(
    (w) => w.address === walletManager.activeAddress,
  )

  const hasLocalAccount =
    walletManager.isUnlocked && !!walletManager.activeAddress
  const isSolActive =
    externalWallets.isSolConnected && !!externalWallets.solAddress
  const isSuiActive =
    externalWallets.isSuiConnected && !!externalWallets.suiAddress
  const isArActive =
    externalWallets.isArConnected && !!externalWallets.arAddress

  return (
    <div className="flex items-center gap-2">
      <ConnectButton.Custom>
        {({ account, chain, mounted }) => {
          const ready = mounted
          const connected = ready && !!account && !!chain

          const anyConnected =
            hasLocalAccount ||
            connected ||
            isSolActive ||
            isSuiActive ||
            isArActive

          return (
            <Link
              to="/account"
              className={`flex h-9 items-center gap-2 rounded-full border px-3 shadow-sm transition-all active:scale-95 sm:h-8 ${
                anyConnected
                  ? "border-slate-200 bg-white hover:bg-slate-50"
                  : "border-dashed border-slate-300 bg-slate-50/50 text-slate-400 hover:border-indigo-300 hover:text-indigo-500"
              }`}
            >
              <AccountButtonContent
                walletManager={walletManager}
                activeAccount={activeAccount}
                connected={connected}
                account={account}
                chain={chain}
                isSolActive={isSolActive}
                isSuiActive={isSuiActive}
                isArActive={isArActive}
                externalWallets={externalWallets}
              />
            </Link>
          )
        }}
      </ConnectButton.Custom>
      <Link
        to="/account"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all active:scale-95 sm:hidden"
      >
        <Settings className="h-5 w-5" />
      </Link>
    </div>
  )
}

interface AccountButtonContentProps {
  walletManager: ReturnType<typeof useWalletManager>
  activeAccount?: ReturnType<typeof useWalletManager>["wallets"][number]
  connected: boolean
  account: any
  chain: any
  isSolActive: boolean
  isSuiActive: boolean
  isArActive: boolean
  externalWallets: ReturnType<typeof useExternalWallets>
}

function AccountButtonContent({
  walletManager,
  activeAccount,
  connected,
  account,
  chain,
  isSolActive,
  isSuiActive,
  isArActive,
  externalWallets,
}: AccountButtonContentProps) {
  const { t } = useTranslation()

  // 未解锁状态
  if (!walletManager.isUnlocked) {
    return (
      <>
        <UserCircle className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        <span className="hidden text-xs font-bold sm:inline">
          {t("common.account")}
        </span>
      </>
    )
  }

  // 本地账户已激活
  if (walletManager.activeAddress && activeAccount) {
    return (
      <>
        <div className="flex h-3.5 w-3.5 items-center justify-center">
          {getChainIcon(activeAccount.chain)}
        </div>
        <span className="text-xs font-bold text-slate-700">
          {shortenedAddress(walletManager.activeAddress)}
        </span>
      </>
    )
  }

  // EVM 钱包已连接
  if (connected && account) {
    return (
      <>
        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
        {chain?.hasIcon && chain.iconUrl ? (
          <img
            alt={chain.name ?? "Chain icon"}
            src={chain.iconUrl}
            style={{ width: 14, height: 14 }}
          />
        ) : (
          <EthereumIcon className="h-3.5 w-3.5" />
        )}
        <span className="text-xs font-bold text-slate-700">
          {account.displayName}
        </span>
      </>
    )
  }

  // Solana 钱包已连接
  if (isSolActive) {
    return (
      <>
        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
        <SolanaIcon className="h-3.5 w-3.5" />
        <span className="text-xs font-bold text-slate-700">
          {shortenedAddress(externalWallets.solAddress!)}
        </span>
      </>
    )
  }

  // Sui 钱包已连接
  if (isSuiActive) {
    return (
      <>
        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
        <SuiIcon className="h-3.5 w-3.5" />
        <span className="text-xs font-bold text-slate-700">
          {shortenedAddress(externalWallets.suiAddress!)}
        </span>
      </>
    )
  }

  // Arweave 钱包已连接
  if (isArActive) {
    return (
      <>
        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
        <ArweaveIcon className="h-3.5 w-3.5" />
        <span className="text-xs font-bold text-slate-700">
          {shortenedAddress(externalWallets.arAddress!)}
        </span>
      </>
    )
  }

  // 默认状态
  return (
    <>
      <CreditCard className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
      <span className="hidden text-xs font-bold sm:inline">
        {t("common.account")}
      </span>
    </>
  )
}
