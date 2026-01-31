/**
 * Debug script to show current MongoDB collection indexes
 * 
 * Usage: npx tsx src/scripts/debug-indexes.ts
 */

import mongoose from 'mongoose';
import { env } from '../config/env.js';

async function debugIndexes(): Promise<void> {
    try {
        console.log('[debug] Connecting to MongoDB...');
        console.log('[debug] URI:', env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

        await mongoose.connect(env.MONGODB_URI);
        console.log('[debug] Connected to MongoDB');

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection not established');
        }

        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('\n[debug] Collections in database:');
        collections.forEach((col) => {
            console.log(`  - ${col.name}`);
        });

        // Check sapp_users collection
        const collectionNames = collections.map(c => c.name);
        if (!collectionNames.includes('sapp_users')) {
            console.log('\n[debug] sapp_users collection does not exist yet');
        } else {
            console.log('\n[debug] Indexes on sapp_users collection:');
            const collection = db.collection('sapp_users');
            const indexes = await collection.indexes();
            indexes.forEach((index) => {
                console.log(`  - ${index.name}:`);
                console.log(`      key: ${JSON.stringify(index.key)}`);
                console.log(`      unique: ${index.unique || false}`);
                console.log(`      sparse: ${index.sparse || false}`);
            });

            // Check for orphaned username index
            const hasUsernameIndex = indexes.some((index) => index.name === 'username_1');
            if (hasUsernameIndex) {
                console.log('\n[debug] ⚠️  ORPHANED username_1 INDEX FOUND!');
                console.log('[debug] Dropping orphaned index...');
                await collection.dropIndex('username_1');
                console.log('[debug] ✓ Successfully dropped username_1 index');
            }

            // Show documents count and sample
            const count = await collection.countDocuments();
            console.log(`\n[debug] Documents in sapp_users: ${count}`);

            if (count > 0) {
                const sample = await collection.findOne();
                console.log('[debug] Sample document fields:');
                if (sample) {
                    Object.keys(sample).forEach(key => {
                        const value = sample[key];
                        const display = typeof value === 'string' && value.length > 50
                            ? value.substring(0, 50) + '...'
                            : value;
                        console.log(`  - ${key}: ${display}`);
                    });
                }
            }
        }

        console.log('\n[debug] Done!');
    } catch (error) {
        console.error('[debug] Error:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

debugIndexes();
