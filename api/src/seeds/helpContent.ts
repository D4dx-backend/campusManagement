import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { HelpCategory } from '../models/HelpCategory';
import { HelpArticle } from '../models/HelpArticle';

// Import all content
import { gettingStartedCategory, gettingStartedArticles } from './help/gettingStarted';
import { studentsCategory, studentsArticles } from './help/students';
import { staffCategory, staffArticles } from './help/staff';
import { academicsCategory, academicsArticles } from './help/academics';
import { examsCategory, examsArticles } from './help/exams';
import { attendanceCategory, attendanceArticles } from './help/attendance';
import { lmsCategory, lmsArticles } from './help/lms';
import { financeCategory, financeArticles, payrollCategory, payrollArticles, expensesCategory, expensesArticles } from './help/finance';
import { accountingCategory, accountingArticles } from './help/accounting';
import { transportCategory, transportArticles } from './help/transport';
import { reportsCategory, reportsArticles } from './help/reports';
import { administrationCategory, administrationArticles } from './help/administration';
import { timetableCategory, timetableArticles } from './help/timetable';
import { announcementsCategory, announcementsArticles } from './help/announcements';
import { homeworkCategory, homeworkArticles } from './help/homework';
import { teacherAllocationsCategory, teacherAllocationsArticles } from './help/teacherAllocations';
import { staffLeaveArticles } from './help/staffLeave';
import { studentPortalCategory, studentPortalArticles } from './help/studentPortal';

const allCategories = [
  gettingStartedCategory,
  studentsCategory,
  staffCategory,
  academicsCategory,
  examsCategory,
  attendanceCategory,
  lmsCategory,
  financeCategory,
  payrollCategory,
  expensesCategory,
  accountingCategory,
  transportCategory,
  reportsCategory,
  administrationCategory,
  timetableCategory,
  announcementsCategory,
  homeworkCategory,
  teacherAllocationsCategory,
  studentPortalCategory,
];

const allArticleSets: { categorySlug: string; articles: any[] }[] = [
  { categorySlug: 'getting-started', articles: gettingStartedArticles },
  { categorySlug: 'student-management', articles: studentsArticles },
  { categorySlug: 'staff-management', articles: staffArticles },
  { categorySlug: 'academic-setup', articles: academicsArticles },
  { categorySlug: 'exam-assessment', articles: examsArticles },
  { categorySlug: 'attendance-leave', articles: attendanceArticles },
  { categorySlug: 'lms', articles: lmsArticles },
  { categorySlug: 'fee-management', articles: financeArticles },
  { categorySlug: 'payroll', articles: payrollArticles },
  { categorySlug: 'expenses-income', articles: expensesArticles },
  { categorySlug: 'accounting', articles: accountingArticles },
  { categorySlug: 'transport', articles: transportArticles },
  { categorySlug: 'reports-analytics', articles: reportsArticles },
  { categorySlug: 'administration', articles: administrationArticles },
  { categorySlug: 'timetable', articles: timetableArticles },
  { categorySlug: 'announcements', articles: announcementsArticles },
  { categorySlug: 'homework', articles: homeworkArticles },
  { categorySlug: 'teacher-allocations', articles: teacherAllocationsArticles },
  { categorySlug: 'attendance-leave', articles: staffLeaveArticles },
  { categorySlug: 'student-portal', articles: studentPortalArticles },
];

async function seedHelpContent() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/d4mediacampus';

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoURI);
  console.log('Connected.');

  // Seed categories (upsert by slug)
  console.log('\n--- Seeding Help Categories ---');
  const categoryMap = new Map<string, string>(); // slug → _id

  for (const cat of allCategories) {
    const existing = await HelpCategory.findOneAndUpdate(
      { slug: cat.slug },
      { $set: cat },
      { upsert: true, new: true }
    );
    categoryMap.set(cat.slug, existing._id.toString());
    console.log(`  ✓ Category: ${cat.name} (${cat.slug})`);
  }

  // Seed articles (upsert by slug)
  console.log('\n--- Seeding Help Articles ---');
  let totalArticles = 0;

  for (const { categorySlug, articles } of allArticleSets) {
    const categoryId = categoryMap.get(categorySlug);
    if (!categoryId) {
      console.error(`  ✗ Category not found: ${categorySlug}`);
      continue;
    }

    for (const article of articles) {
      await HelpArticle.findOneAndUpdate(
        { slug: article.slug },
        {
          $set: {
            ...article,
            categoryId,
            status: 'published',
            screenshots: article.screenshots || []
          }
        },
        { upsert: true, new: true }
      );
      totalArticles++;
      console.log(`  ✓ [${categorySlug}] ${article.title}`);
    }
  }

  console.log(`\n=== Seed Complete ===`);
  console.log(`Categories: ${allCategories.length}`);
  console.log(`Articles: ${totalArticles}`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

seedHelpContent().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
