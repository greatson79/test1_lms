import { Hono } from "hono";
import { errorBoundary } from "@/backend/middleware/error";
import { withAppContext } from "@/backend/middleware/context";
import { withSupabase } from "@/backend/middleware/supabase";
import { registerExampleRoutes } from "@/features/example/backend/route";
import { registerProfileRoutes } from "@/features/profiles/backend/route";
import { registerCourseRoutes } from "@/features/courses/backend/route";
import { registerEnrollmentRoutes } from "@/features/enrollments/backend/route";
import { registerDashboardRoutes } from "@/features/dashboard/backend/route";
import { registerAssignmentRoutes } from "@/features/assignments/backend/route";
import { registerSubmissionRoutes } from "@/features/submissions/backend/route";
import { registerGradeRoutes } from "@/features/grades/backend/route";
import { registerInstructorDashboardRoutes } from "@/features/instructor-dashboard/backend/route";
import type { AppEnv } from "@/backend/hono/context";

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  if (singletonApp && process.env.NODE_ENV === "production") {
    return singletonApp;
  }

  const app = new Hono<AppEnv>();

  app.use("*", errorBoundary());
  app.use("*", withAppContext());
  app.use("*", withSupabase());

  registerExampleRoutes(app);
  registerProfileRoutes(app);
  registerCourseRoutes(app);
  registerEnrollmentRoutes(app);
  registerDashboardRoutes(app);
  registerAssignmentRoutes(app);
  registerSubmissionRoutes(app);
  registerGradeRoutes(app);
  registerInstructorDashboardRoutes(app);

  app.notFound((c) => {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: `Route not found: ${c.req.method} ${c.req.path}`,
        },
      },
      404
    );
  });

  if (process.env.NODE_ENV === "production") {
    singletonApp = app;
  }

  return app;
};
