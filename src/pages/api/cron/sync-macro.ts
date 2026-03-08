import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchMacroData } from '../../../src/app/services/macroDataService';
import { fetchL1Data } from '../../../src/app/services/l1DataNervousSystem';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Security: Verify CRON_SECRET header
  const cronSecret = req.headers['authorization']?.replace('Bearer ', '');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || cronSecret !== expectedSecret) {
    console.error('[Cron] Unauthorized attempt to sync macro data');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('[Cron] Starting macro data sync at', new Date().toISOString());

    // Trigger full fetch cycle
    const [macroResult, l1Snapshot] = await Promise.all([
      fetchMacroData(),
      fetchL1Data(),
    ]);

    console.log('[Cron] Sync completed:', {
      macro: {
        dgs10: macroResult.dgs10.status,
        dgs2: macroResult.dgs2.status,
        ecbRate: macroResult.ecbRate.status,
        bojRate: macroResult.bojRate.status,
        oecd: macroResult.oecd.status,
        status: macroResult.overallStatus,
      },
      l1: {
        timestamp: l1Snapshot.timestamp.toISOString(),
        feedCount: Object.keys(l1Snapshot.feedStatus).length,
      },
    });

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      macro: macroResult.overallStatus,
      l1: 'synced',
    });
  } catch (error) {
    console.error('[Cron] Sync failed:', error);
    return res.status(500).json({
      error: 'Sync failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
