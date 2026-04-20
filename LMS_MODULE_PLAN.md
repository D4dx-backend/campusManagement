# Learning Management System (LMS) Module — Planning Report

## 1. Executive Summary

ഇപ്പോഴത്തെ School Management Software-ൽ academics (Class, Subject, Exam, MarkSheet), attendance, fee management, HR/payroll, textbook inventory എന്നിവ ഉണ്ട്. എന്നാൽ **content delivery, online assignments, assessments, scheduling** തുടങ്ങിയ LMS features ഒന്നും ഇല്ല. ഈ module-ലൂടെ teachers-ന് content upload ചെയ്യാനും, assignments/quizzes create ചെയ്യാനും, students-ന് access ചെയ്യാനും, automated scheduling-ലൂടെ class-wise content deliver ചെയ്യാനും കഴിയും.

---

## 2. Module Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  LMS MODULE                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────┐ │
│  │  Content     │   │  Assessment  │   │ Schedule │ │
│  │  Library     │   │  Engine      │   │ Manager  │ │
│  │             │   │              │   │          │ │
│  │ • Chapters  │   │ • Quizzes    │   │ • Auto   │ │
│  │ • Lessons   │   │ • Assignments│   │   assign │ │
│  │ • Resources │   │ • Online     │   │ • Dates  │ │
│  │ • Videos    │   │   exams      │   │ • Recur  │ │
│  └──────┬──────┘   └──────┬───────┘   └────┬─────┘ │
│         │                 │                 │       │
│         └─────────┬───────┘                 │       │
│                   ▼                         │       │
│         ┌─────────────────┐                 │       │
│         │  Class           │◄────────────────┘       │
│         │  Assignment      │                         │
│         │  Engine          │                         │
│         │                  │                         │
│         │ • Assign to      │                         │
│         │   class/division │                         │
│         │ • Track progress │                         │
│         │ • Due dates      │                         │
│         │ • Submissions    │                         │
│         └─────────────────┘                         │
│                   │                                  │
│                   ▼                                  │
│         ┌─────────────────┐                         │
│         │  Student         │                         │
│         │  Portal          │                         │
│         │                  │                         │
│         │ • View content   │                         │
│         │ • Attempt quiz   │                         │
│         │ • Submit work    │                         │
│         │ • Track progress │                         │
│         └─────────────────┘                         │
└─────────────────────────────────────────────────────┘
```

---

## 3. Data Models (New)

### 3.1 `Chapter` — Subject-wise Chapter Registry
```
Chapter {
  _id: ObjectId
  subjectId: ref → Subject
  classId: ref → Class              // ഏത് class-ലെ subject-ന്റെ chapter ആണ്
  name: String                      // "Chapter 3: Photosynthesis"
  chapterNumber: Number             // Ordering
  description: String
  status: enum [active, inactive]
  
  organizationId: ref → Organization
  branchId: ref → Branch
  createdBy: ref → User
  timestamps
}
Index: { subjectId, classId, chapterNumber, branchId } unique
```

### 3.2 `LessonContent` — Content Library (Chapter-wise Lessons)
```
LessonContent {
  _id: ObjectId
  chapterId: ref → Chapter
  subjectId: ref → Subject
  classId: ref → Class
  
  title: String                     // "Photosynthesis - Introduction"
  contentType: enum [
    lesson,           // Text/HTML content (theory)
    video,            // Video URL or uploaded video
    document,         // PDF, PPT, DOC
    image,            // Diagrams, charts
    link,             // External link
    interactive       // Embedded interactive content
  ]
  
  // Content body (depends on type)
  body: String                      // Rich text / HTML for lessons
  fileUrl: String                   // S3 URL for documents/videos/images
  fileName: String
  fileSize: Number
  mimeType: String
  externalUrl: String               // YouTube, external links
  thumbnailUrl: String
  duration: Number                  // Video duration in seconds
  
  sortOrder: Number                 // Lesson ordering within chapter
  status: enum [draft, published, archived]
  tags: [String]                    // Searchable tags
  
  organizationId, branchId, createdBy, timestamps
}
Index: { chapterId, sortOrder, branchId }
```

### 3.3 `LmsAssessment` — Quiz/Assignment/Online Exam Definition
```
LmsAssessment {
  _id: ObjectId
  subjectId: ref → Subject
  classId: ref → Class
  chapterId: ref → Chapter           // Optional - chapter-specific assessment
  
  title: String                      // "Chapter 3 Quiz"
  assessmentType: enum [
    quiz,             // Auto-graded MCQ
    assignment,       // File upload / text submission
    online_exam       // Timed, with multiple question types
  ]
  
  instructions: String               // Rich text instructions
  totalMarks: Number
  passingMarks: Number
  duration: Number                   // In minutes (for online_exam/quiz)
  
  // Question config
  questions: [{
    questionNumber: Number
    questionText: String             // Rich text
    questionType: enum [mcq, true_false, short_answer, long_answer, fill_blank]
    options: [{                      // For MCQ / true_false
      optionId: String
      text: String
      isCorrect: Boolean
    }]
    correctAnswer: String            // For fill_blank, short_answer (auto-grade)
    marks: Number
    explanation: String              // Answer explanation (shown after submission)
    imageUrl: String                 // Question image
  }]
  
  settings: {
    shuffleQuestions: Boolean         // Randomize question order
    shuffleOptions: Boolean          // Randomize MCQ options
    showResults: enum [immediately, after_due_date, manual]
    allowRetake: Boolean
    maxRetakes: Number
    showCorrectAnswers: Boolean
    requireProctoring: Boolean       // Future: webcam proctoring
  }
  
  status: enum [draft, published, archived]
  
  organizationId, branchId, createdBy, timestamps
}
```

### 3.4 `ClassContentAssignment` — Content/Assessment → Class Mapping & Scheduling
```
ClassContentAssignment {
  _id: ObjectId
  
  // What is being assigned
  contentType: enum [lesson, assessment]
  contentId: ref → LessonContent OR LmsAssessment
  
  // To whom — multiple targets possible
  classId: ref → Class
  divisionIds: [ref → Division]       // Empty = all divisions
  
  // Scheduling
  availableFrom: Date                  // When content becomes visible
  availableUntil: Date                 // When content expires (optional)
  dueDate: Date                        // For assignments/quizzes
  
  // Status
  status: enum [scheduled, active, completed, cancelled]
  isPublished: Boolean
  
  // Assignment metadata
  assignedBy: ref → User
  
  // Automation fields
  scheduleType: enum [immediate, scheduled, recurring]
  recurringConfig: {                   // For recurring schedules
    frequency: enum [daily, weekly, bi_weekly, monthly]
    dayOfWeek: Number                  // 0-6 for weekly
    dayOfMonth: Number                 // 1-31 for monthly
    endDate: Date                      // When to stop recurring
  }
  
  organizationId, branchId, createdBy, timestamps
}
Index: { classId, contentType, contentId, branchId }
Index: { availableFrom, status }  // For scheduler queries
```

### 3.5 `StudentSubmission` — Student Work Submissions
```
StudentSubmission {
  _id: ObjectId
  assignmentId: ref → ClassContentAssignment
  assessmentId: ref → LmsAssessment
  studentId: ref → Student
  
  // Submission data
  submissionType: enum [mcq_answers, text, file, mixed]
  
  // MCQ answers
  answers: [{
    questionNumber: Number
    selectedOption: String            // optionId for MCQ
    textAnswer: String                // For short/long answer
    isCorrect: Boolean                // Auto-graded
    marksAwarded: Number
  }]
  
  // File submission
  files: [{
    fileUrl: String
    fileName: String
    fileSize: Number
    mimeType: String
    uploadedAt: Date
  }]
  
  textResponse: String                // Rich text response
  
  // Grading
  totalMarksAwarded: Number
  percentage: Number
  grade: String
  isPassed: Boolean
  
  // Teacher feedback
  feedback: String
  gradedBy: ref → User
  gradedAt: Date
  
  // Tracking
  startedAt: Date                     // When student opened
  submittedAt: Date                   // When student submitted
  timeSpent: Number                   // In seconds
  attemptNumber: Number               // Which attempt (if retakes allowed)
  
  status: enum [not_started, in_progress, submitted, graded, returned]
  
  organizationId, branchId, timestamps
}
Index: { assignmentId, studentId, branchId } unique per attempt
Index: { studentId, status }
```

### 3.6 `ContentProgress` — Student Content View Tracking
```
ContentProgress {
  _id: ObjectId
  studentId: ref → Student
  assignmentId: ref → ClassContentAssignment
  contentId: ref → LessonContent
  
  isCompleted: Boolean
  completedAt: Date
  timeSpent: Number                   // Seconds
  lastAccessedAt: Date
  accessCount: Number                 // How many times viewed
  
  // For video content
  videoProgress: Number               // Percentage watched (0-100)
  lastPosition: Number                // Resume position in seconds
  
  organizationId, branchId, timestamps
}
Index: { studentId, contentId, branchId } unique
```

---

## 4. API Endpoints

### 4.1 Chapter Management
```
GET    /api/lms/chapters?subjectId=...&classId=...&status=...
GET    /api/lms/chapters/:id
POST   /api/lms/chapters                    [teacher, branch_admin+]
PUT    /api/lms/chapters/:id                [teacher, branch_admin+]
DELETE /api/lms/chapters/:id                [branch_admin+]
PUT    /api/lms/chapters/reorder            [reorder chapters]
```

### 4.2 Content (Lessons) Management
```
GET    /api/lms/content?chapterId=...&subjectId=...&classId=...&contentType=...&status=...
GET    /api/lms/content/:id
POST   /api/lms/content                     [teacher+] (multipart for file upload)
PUT    /api/lms/content/:id                 [teacher+]
DELETE /api/lms/content/:id                 [teacher+]
PUT    /api/lms/content/reorder             [reorder within chapter]
POST   /api/lms/content/:id/publish         [publish draft content]
POST   /api/lms/content/bulk-upload         [upload multiple files at once]
```

### 4.3 Assessment (Quiz/Assignment/Online Exam)
```
GET    /api/lms/assessments?subjectId=...&classId=...&type=...&status=...
GET    /api/lms/assessments/:id
POST   /api/lms/assessments                 [teacher+]
PUT    /api/lms/assessments/:id             [teacher+]
DELETE /api/lms/assessments/:id             [teacher+]
POST   /api/lms/assessments/:id/publish     [publish assessment]
POST   /api/lms/assessments/:id/duplicate   [clone for another class]
```

### 4.4 Class Assignment & Scheduling
```
GET    /api/lms/assignments?classId=...&divisionId=...&contentType=...&status=...
GET    /api/lms/assignments/:id
POST   /api/lms/assignments                 [assign content to class]
POST   /api/lms/assignments/bulk            [assign to multiple classes at once]
PUT    /api/lms/assignments/:id             [update schedule/dates]
DELETE /api/lms/assignments/:id             [cancel assignment]
POST   /api/lms/assignments/:id/activate    [manually activate]
POST   /api/lms/assignments/:id/complete    [mark as completed]

GET    /api/lms/assignments/calendar?classId=...&month=...&year=...
       → Calendar view of all scheduled content for a class
```

### 4.5 Student Submissions
```
GET    /api/lms/submissions?assignmentId=...&studentId=...&status=...
GET    /api/lms/submissions/:id
POST   /api/lms/submissions                 [student submits work]
PUT    /api/lms/submissions/:id             [student updates before due date]
POST   /api/lms/submissions/:id/grade       [teacher grades]
POST   /api/lms/submissions/:id/return      [teacher returns for revision]
GET    /api/lms/submissions/my              [student's own submissions]
POST   /api/lms/submissions/:id/auto-grade  [auto-grade MCQ answers]
```

### 4.6 Progress Tracking
```
POST   /api/lms/progress/track              [log content view/completion]
GET    /api/lms/progress/student/:studentId?classId=...
GET    /api/lms/progress/class/:classId?subjectId=...&chapterId=...
GET    /api/lms/progress/dashboard          [teacher dashboard - aggregate]
```

### 4.7 Reports
```
GET    /api/lms/reports/class-performance?classId=...&subjectId=...
GET    /api/lms/reports/student-activity?studentId=...&dateRange=...
GET    /api/lms/reports/content-engagement?contentId=...
GET    /api/lms/reports/assessment-analysis?assessmentId=...
       → Per-question analysis, pass rate, average score, time analysis
```

---

## 5. Frontend Pages & Components

### 5.1 New Pages

| Page | Route | Purpose |
|------|-------|---------|
| **LmsContentLibrary** | `/lms/content` | Content library — browse/create by class → subject → chapter |
| **LmsChapterView** | `/lms/content/:classId/:subjectId` | View chapters and lessons for a subject |
| **LmsContentEditor** | `/lms/content/edit/:id` | Rich editor for creating/editing lessons |
| **LmsAssessments** | `/lms/assessments` | Create/manage quizzes, assignments, online exams |
| **LmsAssessmentBuilder** | `/lms/assessments/build/:id` | Question builder with preview |
| **LmsScheduling** | `/lms/schedule` | Assign content to classes, manage schedules |
| **LmsCalendar** | `/lms/calendar` | Calendar view of content schedule |
| **LmsStudentView** | `/lms/student` | Student portal — view assigned content & assessments |
| **LmsAttemptQuiz** | `/lms/attempt/:id` | Quiz/exam attempt interface |
| **LmsSubmissions** | `/lms/submissions` | Teacher view — grade submissions |
| **LmsProgressDashboard** | `/lms/progress` | Analytics — class/student progress tracking |
| **LmsReports** | `/lms/reports` | Detailed reports and analysis |

### 5.2 New Components

```
front/src/components/lms/
  ├── ContentCard.tsx              # Card for lesson/video/document
  ├── ChapterAccordion.tsx         # Expandable chapter with lessons
  ├── QuestionBuilder.tsx          # Add/edit questions with options
  ├── QuestionRenderer.tsx         # Render question for student
  ├── QuizTimer.tsx                # Countdown timer for exams
  ├── FileUploader.tsx             # Drag-drop file upload
  ├── RichTextEditor.tsx           # Rich text editor for content
  ├── ProgressBar.tsx              # Chapter/subject progress
  ├── ContentScheduleForm.tsx      # Schedule assignment form
  ├── CalendarView.tsx             # Monthly calendar with events
  ├── SubmissionGrader.tsx         # Grade submission interface
  ├── StudentProgressCard.tsx      # Student progress summary
  └── ContentTypeIcon.tsx          # Icons for different content types
```

### 5.3 UI Flow — Teacher Workflow

```
Step 1: Create Content
┌─────────────────────────────────────────────────┐
│  Content Library                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Class 5  │ │ Class 6  │ │ Class 7  │  ...     │
│  └────┬────┘ └─────────┘ └─────────┘           │
│       ▼                                          │
│  ┌──────────────────────────────────┐           │
│  │ Subjects: Math | Science | Hindi │           │
│  └────┬─────────────────────────────┘           │
│       ▼                                          │
│  ┌──────────────────────────────────┐           │
│  │ Chapter 1: Numbers          [+]  │           │
│  │   ├── Lesson: Introduction  📝   │           │
│  │   ├── Video: Counting      🎬   │           │
│  │   ├── PDF: Worksheet        📄   │           │
│  │   └── Quiz: Practice Test   📋   │           │
│  │ Chapter 2: Addition         [+]  │           │
│  │   └── (empty - add content)      │           │
│  └──────────────────────────────────┘           │
└─────────────────────────────────────────────────┘

Step 2: Assign to Classes
┌─────────────────────────────────────────────────┐
│  Schedule Content                                │
│                                                  │
│  Content: "Chapter 1: Numbers - All Lessons"     │
│                                                  │
│  Assign to:                                      │
│  ☑ Class 5-A    ☑ Class 5-B    ☐ Class 5-C     │
│                                                  │
│  Schedule Type:  ○ Immediate  ● Scheduled        │
│  Available From: [2026-04-21]                    │
│  Available Until:[2026-05-15]                    │
│  Due Date:       [2026-05-10]                    │
│                                                  │
│  [Assign to Selected Classes]                    │
└─────────────────────────────────────────────────┘

Step 3: Monitor Progress
┌─────────────────────────────────────────────────┐
│  Progress Dashboard                              │
│                                                  │
│  Class 5-A │ Math │ Chapter 1                    │
│  ┌──────────────────────────────────────────┐   │
│  │ Overall Completion: ████████░░ 78%        │   │
│  │                                           │   │
│  │ Student         Lessons  Quiz   Status    │   │
│  │ Ahmed Hassan    4/4      85%    ✓ Done    │   │
│  │ Sara Mohamed    3/4      -      ◐ Active  │   │
│  │ Ali Ibrahim     1/4      -      ◔ Behind  │   │
│  │ Fatima Khan     0/4      -      ○ Not     │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### 5.4 UI Flow — Student Workflow

```
┌─────────────────────────────────────────────────┐
│  My Learning                                     │
│                                                  │
│  ┌─────────── Due Soon ──────────────────┐      │
│  │ 📋 Math Quiz - Chapter 3  Due: Apr 22 │      │
│  │ 📄 Science Assignment     Due: Apr 25 │      │
│  └───────────────────────────────────────┘      │
│                                                  │
│  ┌─────────── Subjects ──────────────────┐      │
│  │                                        │      │
│  │  📐 Mathematics     Progress: 65%      │      │
│  │  🔬 Science         Progress: 45%      │      │
│  │  📚 English         Progress: 80%      │      │
│  │  📖 Hindi           Progress: 30%      │      │
│  └───────────────────────────────────────┘      │
│                                                  │
│  Click → Subject → Chapters → Lessons/Quizzes   │
└─────────────────────────────────────────────────┘
```

---

## 6. Automation Features

### 6.1 Auto-Scheduling
- **Recurring assignments**: Weekly quiz every Monday, daily lesson release
- **Bulk assignment**: One click to assign content to all Class 5 divisions
- **Template-based**: Create a "syllabus template" with week-wise content schedule, apply to any class

### 6.2 Auto-Grading
- **MCQ quizzes**: Instant grading on submission
- **Fill-in-the-blank**: Exact match or fuzzy match grading
- **True/False**: Auto-graded immediately
- **Grade calculation**: Auto percentage, grade, pass/fail

### 6.3 Auto-Notifications (Future)
- Student: "New content available", "Assignment due tomorrow"
- Teacher: "15 students submitted", "Quiz results ready"
- Parent: "Your child scored 85% in Math Quiz"

### 6.4 Content Reuse
- **Clone across classes**: Create content for Class 5 Math, clone to Class 6 Math with edits
- **Year rollover**: Copy entire content library from one academic year to next
- **Template library**: Branch-level content templates

---

## 7. Permission Model

| Role | Chapters | Content | Assessment | Assign | Grade | View Progress |
|------|----------|---------|------------|--------|-------|---------------|
| **platform_admin** | CRUD | CRUD | CRUD | CRUD | ✓ | ✓ All |
| **org_admin** | CRUD | CRUD | CRUD | CRUD | ✓ | ✓ All |
| **branch_admin** | CRUD | CRUD | CRUD | CRUD | ✓ | ✓ Branch |
| **teacher** | CRU | CRU | CRU | CRU | ✓ | ✓ Own classes |
| **staff** | R | R | — | — | — | — |
| **student** | — | R (assigned) | Attempt | — | — | ✓ Own |

New permission module: `lms` with actions: `create`, `read`, `update`, `delete`, `assign`, `grade`

---

## 8. Integration with Existing Modules

### 8.1 Subject ↔ LMS
- LMS content organized by existing Subject model
- Subject's `classIds` determines which classes can see content
- Subject `maxMark`, `passMark` can be used for assessment defaults

### 8.2 Class/Division ↔ LMS
- Content assigned to existing Class → Division hierarchy
- Student enrollment in Class determines content visibility
- Division-level granularity for targeted assignments

### 8.3 Exam ↔ LMS Assessment
- LMS online exams can optionally link to existing Exam model
- Assessment scores can feed into MarkSheet for consolidated results
- Teacher can choose: "Record in mark sheet? Yes/No"

### 8.4 Attendance ↔ LMS
- Content access as digital attendance indicator
- "Student accessed 3/5 lessons today" correlation with attendance

### 8.5 File Upload ↔ DigitalOcean Spaces
- Reuse existing `doSpacesService.ts` for file uploads
- Separate S3 prefix: `lms/content/{orgId}/{classId}/`
- Support large video uploads with presigned URLs

---

## 9. Implementation Phases

### Phase 1: Foundation (Core Content Management)
**Backend:**
- [ ] Chapter model + CRUD routes
- [ ] LessonContent model + CRUD routes (with file upload)
- [ ] LMS permission module setup

**Frontend:**
- [ ] Content Library page (class → subject → chapter browse)
- [ ] Chapter management (create, edit, reorder)
- [ ] Content upload (text, file, video URL, document)
- [ ] Content viewer (render different content types)
- [ ] Sidebar navigation update with LMS section

### Phase 2: Assessments
**Backend:**
- [ ] LmsAssessment model + CRUD routes
- [ ] Question builder API
- [ ] Auto-grading logic for MCQ/True-False/Fill-blank

**Frontend:**
- [ ] Assessment builder page (question creation UI)
- [ ] MCQ option builder with correct answer marking
- [ ] Assessment preview
- [ ] Student quiz attempt interface with timer
- [ ] Auto-grade display

### Phase 3: Assignment & Scheduling
**Backend:**
- [ ] ClassContentAssignment model + CRUD routes
- [ ] Bulk assignment API
- [ ] Scheduling engine (cron job for scheduled/recurring)
- [ ] Calendar API

**Frontend:**
- [ ] Schedule/assign content to classes UI
- [ ] Bulk assignment (multi-class, multi-division)
- [ ] Calendar view
- [ ] Recurring schedule configuration

### Phase 4: Submissions & Grading
**Backend:**
- [ ] StudentSubmission model + CRUD routes
- [ ] File submission upload handling
- [ ] Auto-grading pipeline
- [ ] Grade integration with MarkSheet (optional link)

**Frontend:**
- [ ] Student submission interface (file upload, text editor)
- [ ] Teacher grading interface
- [ ] Feedback system
- [ ] Grade overview

### Phase 5: Progress Tracking & Reports
**Backend:**
- [ ] ContentProgress model + tracking routes
- [ ] Aggregation pipelines for reports
- [ ] Class/student/content analytics APIs

**Frontend:**
- [ ] Student progress dashboard
- [ ] Teacher analytics dashboard
- [ ] Per-content engagement reports
- [ ] Assessment analysis (per-question, class comparison)

### Phase 6: Automation & Polish
- [ ] Recurring schedule engine
- [ ] Content cloning across classes/years
- [ ] Syllabus template system
- [ ] Academic year content rollover
- [ ] Notification integration (if available)
- [ ] Student portal refinements

---

## 10. File Structure (New Files)

### Backend
```
api/src/
  models/
    Chapter.ts
    LessonContent.ts
    LmsAssessment.ts
    ClassContentAssignment.ts
    StudentSubmission.ts
    ContentProgress.ts
  routes/
    lms/
      chapters.ts
      content.ts
      assessments.ts
      assignments.ts
      submissions.ts
      progress.ts
      reports.ts
      index.ts              ← aggregates all LMS routes
  validations/
    lms.ts                  ← Joi schemas for all LMS endpoints
  services/
    lmsScheduler.ts         ← Cron-based schedule activation
    autoGrader.ts           ← MCQ/fill-blank auto-grading
```

### Frontend
```
front/src/
  pages/
    lms/
      ContentLibrary.tsx
      ChapterView.tsx
      ContentEditor.tsx
      Assessments.tsx
      AssessmentBuilder.tsx
      Scheduling.tsx
      Calendar.tsx
      StudentLms.tsx
      AttemptQuiz.tsx
      Submissions.tsx
      ProgressDashboard.tsx
      Reports.tsx
  components/
    lms/
      ContentCard.tsx
      ChapterAccordion.tsx
      QuestionBuilder.tsx
      QuestionRenderer.tsx
      QuizTimer.tsx
      FileUploader.tsx
      RichTextEditor.tsx
      ProgressBar.tsx
      ContentScheduleForm.tsx
      CalendarView.tsx
      SubmissionGrader.tsx
      StudentProgressCard.tsx
      ContentTypeIcon.tsx
  services/
    lmsService.ts           ← API calls for all LMS endpoints
  hooks/
    useLms.ts               ← TanStack Query hooks
```

---

## 11. Technology Decisions

| Concern | Decision | Reason |
|---------|----------|--------|
| **Rich Text Editor** | TipTap (or React Quill) | Modern, extensible, supports embed |
| **File Upload** | Existing DO Spaces + presigned URLs | Already integrated, supports large files |
| **Video Player** | react-player | Supports YouTube, Vimeo, S3 URLs |
| **Calendar** | FullCalendar or custom with date-fns | Robust calendar UI |
| **Quiz Timer** | Custom React hook with `useEffect` | Lightweight, no dependency needed |
| **Cron Scheduler** | node-cron | For scheduled content activation |
| **PDF Viewer** | react-pdf or iframe embed | View uploaded PDFs inline |

---

## 12. Estimated Scope

| Phase | Models | API Routes | Pages | Components |
|-------|--------|-----------|-------|------------|
| Phase 1 | 2 | ~12 | 3 | 5 |
| Phase 2 | 1 | ~8 | 3 | 4 |
| Phase 3 | 1 | ~10 | 2 | 3 |
| Phase 4 | 1 | ~8 | 2 | 2 |
| Phase 5 | 1 | ~6 | 2 | 2 |
| Phase 6 | 0 | ~4 | 0 | 0 |
| **Total** | **6** | **~48** | **12** | **16** |

---

## 13. Quick Wins for Phase 1

ആദ്യം implement ചെയ്യേണ്ടത്:

1. **Chapter + Content models** — Database foundation
2. **Content Library page** — Class → Subject → Chapter → Content browse UI
3. **File upload integration** — Extend existing DO Spaces service
4. **Teacher content creation** — CRUD for chapters and lessons
5. **Student content viewer** — Basic view assigned content

ഇത് ready ആയാൽ, assessments, scheduling, grading എന്നിവ iteratively add ചെയ്യാം.

---

*Ready to start Phase 1 implementation? Confirm ചെയ്താൽ coding start ചെയ്യാം.*
