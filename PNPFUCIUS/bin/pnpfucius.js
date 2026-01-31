#!/usr/bin/env node
// PNPFUCIUS - The PNP Exchange CLI
// "The wise trader predicts with patience"

import { PnpfuciusAgent } from '../src/predict/agent.js';

const agent = new PnpfuciusAgent();
await agent.run();
