#!/usr/bin/env node
import { ClaudePredictAgent } from '../src/predict/agent.js';

const agent = new ClaudePredictAgent();
await agent.run();
