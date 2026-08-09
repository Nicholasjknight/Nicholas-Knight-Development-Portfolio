'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');
const billing = require('../api/_lib/pixelforge-billing');

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#') || !line.includes('=')) continue;
        const separator = line.indexOf('=');
        const key = line.slice(0, separator).trim();
        let value = line.slice(separator + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (key && !process.env[key]) process.env[key] = value;
    }
}

async function main() {
    if (process.env.PIXELFORGE_ALLOW_DB_SMOKE !== '1') {
        throw new Error('Set PIXELFORGE_ALLOW_DB_SMOKE=1 to run the isolated database smoke test.');
    }
    loadEnvFile(process.env.PIXELFORGE_ENV_FILE || path.join(__dirname, '..', '.env.production'));
    const databaseUrl = process.env.KL_DATABASE_URL || process.env.DATABASE_URL;
    assert.ok(databaseUrl, 'Database URL is required.');

    const sql = neon(databaseUrl);
    const machineId = crypto.createHash('sha256').update(`pixelforge-db-smoke:${crypto.randomUUID()}`).digest('hex');
    try {
        await billing.ensureTables(sql);
        const initial = await billing.getStatus(sql, machineId);
        assert.strictEqual(initial.credits, 8);
        assert.strictEqual(initial.free_trial_remaining, 8);

        const reserved = await billing.reserveCredits(sql, machineId, 3, { profile: 'balanced', outcome: 'db_smoke' });
        assert.strictEqual(reserved.ok, true);
        assert.strictEqual(reserved.credits, 5);

        const released = await billing.releaseReservation(sql, machineId, reserved.reservation_id);
        assert.strictEqual(released.ok, true);
        assert.strictEqual(released.credits, 8);

        const second = await billing.reserveCredits(sql, machineId, 2, { profile: 'balanced', outcome: 'db_smoke' });
        const committed = await billing.commitReservation(sql, machineId, second.reservation_id);
        assert.strictEqual(committed.ok, true);
        assert.strictEqual(committed.credits, 6);

        const idempotent = await billing.commitReservation(sql, machineId, second.reservation_id);
        assert.strictEqual(idempotent.ok, true);
        assert.strictEqual(idempotent.already_processed, true);
        assert.strictEqual(idempotent.credits, 6);

        console.log('PixelForge live database reservation smoke checks passed.');
    } finally {
        await sql`DELETE FROM pixelforge_accounts WHERE machine_id = ${machineId}`;
    }
}

main().catch((error) => {
    console.error(error && error.message ? error.message : error);
    process.exitCode = 1;
});
