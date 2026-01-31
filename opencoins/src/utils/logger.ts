export type LogLevel = "debug" | "info" | "warn" | "error";

export class Logger {
  private client: any; // Using any for now to avoid type issues
  private service: string;

  constructor(client: any, service: string = "opencoins-launchpad") {
    this.client = client;
    this.service = service;
  }

  async log(level: LogLevel, message: string, extra?: Record<string, any>) {
    await this.client.app.log({
      service: this.service,
      level,
      message,
      extra: extra || {},
    });
  }

  async debug(message: string, extra?: Record<string, any>) {
    await this.log("debug", message, extra);
  }

  async info(message: string, extra?: Record<string, any>) {
    await this.log("info", message, extra);
  }

  async warn(message: string, extra?: Record<string, any>) {
    await this.log("warn", message, extra);
  }

  async error(message: string, extra?: Record<string, any>) {
    await this.log("error", message, extra);
  }

  async logTransaction(
    chain: "evm" | "solana",
    network: string,
    txHash: string,
    type: string,
    extra?: Record<string, any>,
  ) {
    await this.info(`Transaction logged: ${type}`, {
      chain,
      network,
      txHash,
      type,
      ...extra,
    });
  }

  async logDeployment(
    chain: "evm" | "solana",
    network: string,
    address: string,
    tokenName: string,
    tokenSymbol: string,
    txHash: string,
  ) {
    await this.info(`Token deployed: ${tokenName} (${tokenSymbol})`, {
      chain,
      network,
      tokenAddress: address,
      tokenName,
      tokenSymbol,
      txHash,
      timestamp: new Date().toISOString(),
    });
  }
}
