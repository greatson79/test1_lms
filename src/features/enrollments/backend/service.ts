import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import { enrollmentErrorCodes, type EnrollmentServiceError } from './error';
import type { EnrollRequest, EnrollResponse, EnrollmentDto, CancelEnrollmentResponse } from './schema';

type EnrollmentRow = {
  id: string;
  course_id: string;
  learner_id: string;
  enrolled_at: string;
  cancelled_at: string | null;
};

const mapEnrollmentRow = (row: EnrollmentRow): EnrollmentDto => ({
  id: row.id,
  courseId: row.course_id,
  learnerId: row.learner_id,
  enrolledAt: row.enrolled_at,
  cancelledAt: row.cancelled_at,
});

export const enrollCourse = async (
  supabase: SupabaseClient,
  learnerId: string,
  data: EnrollRequest,
): Promise<HandlerResult<EnrollResponse, EnrollmentServiceError>> => {
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, status')
    .eq('id', data.courseId)
    .maybeSingle<{ id: string; status: string }>();

  if (courseError) {
    return failure(500, enrollmentErrorCodes.upsertFailed, courseError.message);
  }

  if (!course) {
    return failure(404, enrollmentErrorCodes.courseNotFound, '코스를 찾을 수 없습니다.');
  }

  if (course.status !== 'published') {
    return failure(400, enrollmentErrorCodes.courseNotEnrollable, '수강신청이 불가능한 코스입니다.');
  }

  const { data: existing, error: existingError } = await supabase
    .from('enrollments')
    .select('id, cancelled_at')
    .eq('course_id', data.courseId)
    .eq('learner_id', learnerId)
    .maybeSingle<{ id: string; cancelled_at: string | null }>();

  if (existingError) {
    return failure(500, enrollmentErrorCodes.upsertFailed, existingError.message);
  }

  if (existing && existing.cancelled_at === null) {
    return failure(409, enrollmentErrorCodes.alreadyEnrolled, '이미 수강 중인 코스입니다.');
  }

  if (existing && existing.cancelled_at !== null) {
    const { data: updated, error: updateError } = await supabase
      .from('enrollments')
      .update({ cancelled_at: null, enrolled_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('id, course_id, learner_id, enrolled_at, cancelled_at')
      .single<EnrollmentRow>();

    if (updateError || !updated) {
      return failure(500, enrollmentErrorCodes.upsertFailed, updateError?.message ?? '재신청 처리에 실패했습니다.');
    }

    return success({ enrollment: mapEnrollmentRow(updated), action: 're-enrolled' });
  }

  const { data: inserted, error: insertError } = await supabase
    .from('enrollments')
    .insert({ course_id: data.courseId, learner_id: learnerId })
    .select('id, course_id, learner_id, enrolled_at, cancelled_at')
    .single<EnrollmentRow>();

  if (insertError || !inserted) {
    return failure(500, enrollmentErrorCodes.upsertFailed, insertError?.message ?? '수강신청에 실패했습니다.');
  }

  return success({ enrollment: mapEnrollmentRow(inserted), action: 'enrolled' }, 201);
};

export const cancelEnrollment = async (
  supabase: SupabaseClient,
  learnerId: string,
  courseId: string,
): Promise<HandlerResult<CancelEnrollmentResponse, EnrollmentServiceError>> => {
  const { data: existing, error: fetchError } = await supabase
    .from('enrollments')
    .select('id, cancelled_at')
    .eq('course_id', courseId)
    .eq('learner_id', learnerId)
    .maybeSingle<{ id: string; cancelled_at: string | null }>();

  if (fetchError) {
    return failure(500, enrollmentErrorCodes.cancelFailed, fetchError.message);
  }

  if (!existing || existing.cancelled_at !== null) {
    return failure(404, enrollmentErrorCodes.notFound, '수강 중인 코스가 아닙니다.');
  }

  const { error: updateError } = await supabase
    .from('enrollments')
    .update({ cancelled_at: new Date().toISOString() })
    .eq('id', existing.id);

  if (updateError) {
    return failure(500, enrollmentErrorCodes.cancelFailed, updateError.message);
  }

  return success({ success: true as const });
};
