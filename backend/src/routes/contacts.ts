import { Router } from 'express';
import { requireAuth, currentUserId } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.post('/preview', requireAuth, async (req, res) => {
  const userId = currentUserId(req);
  const { filename, rows } = req.body;

  if (!Array.isArray(rows)) {
    return res.status(400).json({ error: 'Invalid rows format. Expected an array.' });
  }

  const validRows: any[] = [];
  const errors: any[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  rows.forEach((row: any, index: number) => {
    const rawEmail = row.email ? String(row.email).trim() : '';
    if (!rawEmail || !emailRegex.test(rawEmail)) {
      errors.push({ row: index + 1, email: rawEmail, error: 'Invalid email syntax' });
    } else {
      validRows.push({
        email: rawEmail.toLowerCase(),
        name: row.name ? String(row.name).trim() : null
      });
    }
  });

  const candidateEmails = validRows.map((r) => r.email);
  const existingContacts = await prisma.contact.findMany({
    where: { userId, email: { in: candidateEmails } },
    select: { email: true, name: true }
  });

  const existingEmailSet = new Set(existingContacts.map((c) => c.email));
  const duplicates = validRows.filter((r) => existingEmailSet.has(r.email));
  const newAdditions = validRows.filter((r) => !existingEmailSet.has(r.email));

  res.json({
    filename: filename || 'import.csv',
    summary: {
      totalRows: rows.length,
      validCount: validRows.length,
      duplicateCount: duplicates.length,
      errorCount: errors.length,
      newCount: newAdditions.length
    },
    duplicates,
    errors,
    validRows
  });
});

router.post('/commit', requireAuth, async (req, res) => {
  const userId = currentUserId(req);
  const { filename, validRows, conflictStrategy, summary } = req.body;

  if (!validRows || !Array.isArray(validRows)) {
    return res.status(400).json({ error: 'Missing or invalid validRows payload.' });
  }

  if (conflictStrategy === 'reject' && summary?.duplicateCount > 0) {
    return res.status(400).json({ error: 'Import rejected because duplicates were detected.' });
  }

  const batch = await prisma.importBatch.create({
    data: {
      userId,
      filename: filename || 'import.csv',
      totalRows: summary?.totalRows ?? validRows.length,
      validCount: summary?.validCount ?? validRows.length,
      duplicateCount: summary?.duplicateCount ?? 0,
      errorCount: summary?.errorCount ?? 0,
      conflictStrategy: conflictStrategy || 'skip',
      status: 'COMPLETED'
    }
  });

  if (conflictStrategy === 'skip') {
    await prisma.contact.createMany({
      data: validRows.map((r: any) => ({
        userId,
        email: r.email,
        name: r.name || null
      })),
      skipDuplicates: true
    });
  } else if (conflictStrategy === 'update') {
    for (const row of validRows) {
      await prisma.contact.upsert({
        where: { userId_email: { userId, email: row.email } },
        update: { name: row.name || null },
        create: { userId, email: row.email, name: row.name || null }
      });
    }
  }

  res.json({ success: true, batchId: batch.id });
});

router.get('/history', requireAuth, async (req, res) => {
  const userId = currentUserId(req);
  const history = await prisma.importBatch.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  res.json(history);
});

export default router;