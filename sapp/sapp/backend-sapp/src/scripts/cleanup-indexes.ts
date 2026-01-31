/**
 * Migration script to clean up orphaned MongoDB indexes
 * 
 * Run this script to drop the orphaned `username_1` index that was
 * left behind from a previous schema version.
 * 
 * Usage: npx ts-node src/scripts/cleanup-indexes.ts
 */

import mongoose from 'mongoose';
import { env } from '../config/env.js';

async function cleanupIndexes(): Promise<void> {
  try {
    console.log('[cleanup] Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('[cleanup] Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const collection = db.collection('sapp_users');

    // List all current indexes
    console.log('[cleanup] Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach((index: { name?: string; key?: unknown }) => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Check if orphaned username_1 index exists
    const hasUsernameIndex = indexes.some((index: { name?: string }) => index.name === 'username_1');

    if (hasUsernameIndex) {
      console.log('[cleanup] Found orphaned username_1 index. Dropping...');
      await collection.dropIndex('username_1');
      console.log('[cleanup] Successfully dropped username_1 index');
    } else {
      console.log('[cleanup] No orphaned username_1 index found');
    }

    // List indexes after cleanup
    console.log('[cleanup] Indexes after cleanup:');
    const updatedIndexes = await collection.indexes();
    updatedIndexes.forEach((index: { name?: string; key?: unknown }) => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('[cleanup] Done!');
  } catch (error) {
    console.error('[cleanup] Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupIndexes();
