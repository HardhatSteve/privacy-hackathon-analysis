import { Command } from "commander";
import * as QRCode from "qrcode";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";

export const generateQR = new Command()
  .name("generate-qr")
  .description("Generate a QR code for a token address")
  .argument("<address>", "The token address to generate QR code for")
  .option(
    "-o, --output <path>",
    "Output path for the QR code image",
    "qr-code.png",
  )
  .action(async (address: string, options: { output: string }) => {
    try {
      // Validate address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        console.error(chalk.red("Error: Invalid Ethereum address format"));
        process.exit(1);
      }

      // Generate QR code
      const qrData = await QRCode.toDataURL(address, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 400,
      });

      // Convert base64 to buffer and save to file
      const base64Data = qrData.replace(/^data:image\/png;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Ensure the output directory exists
      const outputDir = path.dirname(options.output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(options.output, buffer);

      console.log(chalk.green(`✓ QR code generated successfully!`));
      console.log(chalk.blue(`  Saved to: ${options.output}`));
      console.log(chalk.yellow(`  Address: ${address}`));
    } catch (error) {
      console.error(chalk.red("Error generating QR code:"), error);
      process.exit(1);
    }
  });
