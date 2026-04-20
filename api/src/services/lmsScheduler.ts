import cron from 'node-cron';
import { ClassContentAssignment } from '../models/ClassContentAssignment';

/**
 * LMS Scheduler — runs background jobs for:
 * 1. Activating scheduled assignments when availableFrom arrives
 * 2. Completing assignments past availableUntil
 * 3. Creating recurring assignment instances
 */

// Activate scheduled assignments whose availableFrom has passed
async function activateScheduledAssignments() {
  try {
    const now = new Date();
    const result = await ClassContentAssignment.updateMany(
      {
        status: 'scheduled',
        availableFrom: { $lte: now }
      },
      {
        $set: { status: 'active', isPublished: true }
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`[LMS Scheduler] Activated ${result.modifiedCount} scheduled assignment(s)`);
    }
  } catch (error) {
    console.error('[LMS Scheduler] Error activating assignments:', error);
  }
}

// Mark expired assignments as completed
async function completeExpiredAssignments() {
  try {
    const now = new Date();
    const result = await ClassContentAssignment.updateMany(
      {
        status: 'active',
        availableUntil: { $exists: true, $ne: null, $lte: now }
      },
      {
        $set: { status: 'completed' }
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`[LMS Scheduler] Completed ${result.modifiedCount} expired assignment(s)`);
    }
  } catch (error) {
    console.error('[LMS Scheduler] Error completing expired assignments:', error);
  }
}

// Handle recurring assignments — creates new active instances
async function processRecurringAssignments() {
  try {
    const now = new Date();

    // Find recurring assignments that are active and haven't ended
    const recurring = await ClassContentAssignment.find({
      scheduleType: 'recurring',
      status: 'active',
      'recurringConfig.endDate': { $gte: now }
    }).lean();

    for (const assignment of recurring) {
      if (!assignment.recurringConfig?.frequency) continue;

      const lastCreated = assignment.updatedAt || assignment.createdAt;
      const lastDate = new Date(lastCreated);
      let shouldCreate = false;

      switch (assignment.recurringConfig.frequency) {
        case 'daily':
          shouldCreate = now.getTime() - lastDate.getTime() >= 24 * 60 * 60 * 1000;
          break;
        case 'weekly':
          shouldCreate = now.getTime() - lastDate.getTime() >= 7 * 24 * 60 * 60 * 1000
            && now.getDay() === (assignment.recurringConfig.dayOfWeek ?? 1);
          break;
        case 'bi_weekly':
          shouldCreate = now.getTime() - lastDate.getTime() >= 14 * 24 * 60 * 60 * 1000
            && now.getDay() === (assignment.recurringConfig.dayOfWeek ?? 1);
          break;
        case 'monthly':
          shouldCreate = now.getDate() === (assignment.recurringConfig.dayOfMonth ?? 1)
            && (now.getMonth() !== lastDate.getMonth() || now.getFullYear() !== lastDate.getFullYear());
          break;
      }

      if (shouldCreate) {
        // Create a new instance based on the recurring template
        await ClassContentAssignment.create({
          contentType: assignment.contentType,
          contentId: assignment.contentId,
          classId: assignment.classId,
          divisionIds: assignment.divisionIds,
          availableFrom: now,
          availableUntil: assignment.availableUntil,
          dueDate: assignment.dueDate ? calculateNextDue(assignment.dueDate, assignment.recurringConfig.frequency) : undefined,
          status: 'active',
          isPublished: true,
          assignedBy: assignment.assignedBy,
          scheduleType: 'immediate', // Child instances are immediate
          title: `${assignment.title} (${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})`,
          description: assignment.description,
          organizationId: assignment.organizationId,
          branchId: assignment.branchId,
          createdBy: assignment.createdBy
        });

        // Touch the recurring parent to update its timestamp
        await ClassContentAssignment.updateOne(
          { _id: assignment._id },
          { $set: { updatedAt: now } }
        );

        console.log(`[LMS Scheduler] Created recurring instance for "${assignment.title}"`);
      }
    }
  } catch (error) {
    console.error('[LMS Scheduler] Error processing recurring assignments:', error);
  }
}

function calculateNextDue(originalDue: Date, frequency: string): Date {
  const due = new Date(originalDue);
  switch (frequency) {
    case 'daily': due.setDate(due.getDate() + 1); break;
    case 'weekly': due.setDate(due.getDate() + 7); break;
    case 'bi_weekly': due.setDate(due.getDate() + 14); break;
    case 'monthly': due.setMonth(due.getMonth() + 1); break;
  }
  return due;
}

export function startLmsScheduler() {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await activateScheduledAssignments();
    await completeExpiredAssignments();
  });

  // Check recurring every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    await processRecurringAssignments();
  });

  console.log('[LMS Scheduler] Started — checking every 5 min (activation/expiry) and hourly (recurring)');

  // Run once on startup
  activateScheduledAssignments();
  completeExpiredAssignments();
}
