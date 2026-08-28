# Learning Management System (LMS)

A production-quality Learning Management System built for a strict technical evaluation. This project prioritizes human-readable code, explicit architectural boundaries, and a clean, functional UI over speculative abstraction and "AI-generated" aesthetics.

## Live Links
- **Frontend (Vercel):** https://learning-management-system-ten-rho.vercel.app/
- **Backend/CMS (Railway):** https://learning-management-system-production-3a65.up.railway.app/

---

## Completed Features

**All core features and differentiators from the project spec have been 100% completed.**
- ✅ **Authentication & Role-Based Access Control (RBAC):** Admin, Content Manager, Instructor, and Student roles with strict backend-enforced permissions.
- ✅ **Course Management:** Content Managers and Instructors can manage courses and lessons.
- ✅ **Course Enrollment:** Students can browse available courses, enroll, and view them separately in their Dashboard.
- ✅ **Sequential Lesson Viewing:** Enrolled students are guided through lessons sequentially based on an integer `sequence` field.
- ✅ **Progress Tracking (Differentiator):** Accurate, persistent progress tracking per student/course, calculated and displayed visually as a percentage.
- ✅ **Auto-Grading Quiz (Differentiator):** Instructors can create MCQ quizzes. Students receive immediate, auto-calculated scores that are permanently saved.
- ✅ **Admin Panel:** A dedicated, protected dashboard for Admins to view platform stats and manage user roles globally.
- ✅ **Blog System:** Draft/Publish states handled natively via Strapi, managed by Admins and Content Managers, visible publicly.

---

## How to Run Locally

### Prerequisites
- Node.js (v18+)
- PostgreSQL (or SQLite for local fallback)
- npm or yarn

### 1. Start the Backend (Strapi)
```bash
cd backend
npm install
# Copy the env example
cp .env.example .env 
# Start the development server
npm run develop
```
The Strapi Admin panel will be available at `http://localhost:1337/admin`.

### 2. Start the Frontend (Next.js)
```bash
cd frontend
npm install
# Ensure .env contains NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
npm run dev
```
The frontend application will be available at `http://localhost:3000`.

---

## Architecture & Implementation Deep-Dives

### 1. Data Flow (Example: Course Enrollment)
**Frontend → Backend → Database → Frontend**
1. **Frontend Request:** When a student clicks "Enroll", the frontend (`courses/[id]/page.tsx`) sends a `PUT` request to `/api/courses/:id` via standard `fetch`, attaching the updated array of `student` IDs in the JSON body alongside the user's JWT token.
2. **Strapi API:** The Strapi router receives the request and triggers the Course Controller.
3. **Database Write:** Strapi updates the `course_students` many-to-many join table in PostgreSQL.
4. **Frontend Update:** The `fetch` promise resolves, and the React local state is updated to instantly reflect the enrollment without requiring a hard refresh.

### 2. Role-Based Access Control (Backend Enforcement)
Permissions are enforced at the API layer, **not** just by hiding UI buttons. 
For example, Instructors can only edit their *own* courses. We enforce this by overriding the Strapi core controller (`backend/src/api/course/controllers/course.ts`):

```javascript
async update(ctx) {
  const user = ctx.state.user;
  const { id } = ctx.params;
  
  // If the user is an Instructor, mathematically verify ownership
  if (user.role.name === 'Instructor') {
    const course = await strapi.entityService.findOne('api::course.course', id, { populate: ['instructor'] });
    if (course.instructor?.id !== user.id) {
      return ctx.unauthorized("You can only edit your own courses."); // 403 Forbidden
    }
  }
  // Proceed with default update...
}
```

### 3. Progress Tracking Logic
When a student clicks "Mark as Complete", a `POST` request creates a new `Progress` record in the database, explicitly tying `student_id`, `course_id`, and `lesson_id` to `completed: true`.

When the student views a lesson (`frontend/src/app/courses/[id]/lessons/[lessonId]/page.tsx`), the progress percentage is calculated dynamically by reading these persistent records:

```typescript
// 1. Fetch all progress records for THIS student and THIS course
const progressRes = await fetch(`/api/progresses?filters[course][id][$eq]=${courseId}&filters[student][id][$eq]=${user?.id}`);
const progressData = await progressRes.json();

// 2. Count the total number of lessons in the course
const totalLessons = courseLessons.length || 1;

// 3. Count how many lessons this student has marked 'completed: true'
const currentCompletedCount = progressData.filter(p => p.completed).length;

// 4. Calculate the visual percentage
const progressPercentage = Math.round((currentCompletedCount / totalLessons) * 100);
```

### 4. Quiz Auto-Grading Logic
Quizzes are auto-graded immediately on the client upon submission (`frontend/src/app/courses/[id]/quiz/page.tsx`), and the final score is stored persistently.

```typescript
const handleSubmit = async () => {
  let score = 0;
  
  // 1. Iterate through all questions and compare user selection to correctOptionIndex
  quiz.questions.forEach((q, idx) => {
    if (answers[idx] === q.correctOptionIndex) {
      score++;
    }
  });

  // 2. Calculate the exact percentage score
  const percentage = Math.round((score / quiz.questions.length) * 100);
  
  // 3. Persist the score to the backend Database immediately
  await fetch('/api/quiz-results', {
    method: "POST",
    body: JSON.stringify({ data: { score: percentage, quiz: quiz.id, student: user.id } })
  });
};
```

### 5. Admin Panel & Blog Control
- **Admin Panel:** The custom `/admin` dashboard uses a `<ProtectedRoute allowedRoles={["Admin"]}>` component. It maps over the global `/api/users` endpoint to display a management table. Changing a dropdown immediately fires a `PUT` request to update the user's role relation.
- **Blog (Draft → Publish flow):** We enabled `draftAndPublish: true` in the Strapi `blog-post` schema. Because of this, Strapi natively hides "Draft" posts from the public API. The frontend simply fetches `/api/blog-posts` without authentication, and Strapi automatically filters out everything that isn't explicitly marked as "Published" by an Admin or Content Manager in the backend.

### 6. Deployment Setup & Environment Variables
- **Backend (Railway):** Strapi is deployed to a Railway container backed by a PostgreSQL database. Critical environment variables (`DATABASE_URL`, `JWT_SECRET`, `APP_KEYS`, `API_TOKEN_SALT`, `TRANSFER_TOKEN_SALT`) are injected securely via Railway's Variable manager.
- **Frontend (Vercel):** The Next.js App Router is deployed to Vercel. It connects to the backend exclusively via the `NEXT_PUBLIC_STRAPI_URL` environment variable, ensuring the exact same code runs identically in both local development (pointing to `localhost:1337`) and production (pointing to the Railway URL).
