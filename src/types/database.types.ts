export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          phone: string;
          role: Database['public']['Enums']['user_role'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          phone: string;
          role: Database['public']['Enums']['user_role'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          role?: Database['public']['Enums']['user_role'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      terms_agreements: {
        Row: {
          id: string;
          user_id: string;
          agreed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          agreed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          agreed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'terms_agreements_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      difficulties: {
        Row: {
          id: string;
          name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          instructor_id: string;
          title: string;
          description: string | null;
          category_id: string | null;
          difficulty_id: string | null;
          curriculum: string | null;
          status: Database['public']['Enums']['course_status'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          instructor_id: string;
          title: string;
          description?: string | null;
          category_id?: string | null;
          difficulty_id?: string | null;
          curriculum?: string | null;
          status?: Database['public']['Enums']['course_status'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          instructor_id?: string;
          title?: string;
          description?: string | null;
          category_id?: string | null;
          difficulty_id?: string | null;
          curriculum?: string | null;
          status?: Database['public']['Enums']['course_status'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'courses_instructor_id_fkey';
            columns: ['instructor_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'courses_category_id_fkey';
            columns: ['category_id'];
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'courses_difficulty_id_fkey';
            columns: ['difficulty_id'];
            referencedRelation: 'difficulties';
            referencedColumns: ['id'];
          },
        ];
      };
      enrollments: {
        Row: {
          id: string;
          course_id: string;
          learner_id: string;
          enrolled_at: string;
          cancelled_at: string | null;
        };
        Insert: {
          id?: string;
          course_id: string;
          learner_id: string;
          enrolled_at?: string;
          cancelled_at?: string | null;
        };
        Update: {
          id?: string;
          course_id?: string;
          learner_id?: string;
          enrolled_at?: string;
          cancelled_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'enrollments_course_id_fkey';
            columns: ['course_id'];
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'enrollments_learner_id_fkey';
            columns: ['learner_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      assignments: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          due_at: string;
          weight: number;
          allow_late: boolean;
          allow_resubmit: boolean;
          status: Database['public']['Enums']['assignment_status'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          description?: string | null;
          due_at: string;
          weight: number;
          allow_late?: boolean;
          allow_resubmit?: boolean;
          status?: Database['public']['Enums']['assignment_status'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          description?: string | null;
          due_at?: string;
          weight?: number;
          allow_late?: boolean;
          allow_resubmit?: boolean;
          status?: Database['public']['Enums']['assignment_status'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'assignments_course_id_fkey';
            columns: ['course_id'];
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
        ];
      };
      submissions: {
        Row: {
          id: string;
          assignment_id: string;
          learner_id: string;
          content_text: string;
          content_link: string | null;
          is_late: boolean;
          status: Database['public']['Enums']['submission_status'];
          score: number | null;
          feedback: string | null;
          submitted_at: string;
          graded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          learner_id: string;
          content_text: string;
          content_link?: string | null;
          is_late?: boolean;
          status?: Database['public']['Enums']['submission_status'];
          score?: number | null;
          feedback?: string | null;
          submitted_at?: string;
          graded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          assignment_id?: string;
          learner_id?: string;
          content_text?: string;
          content_link?: string | null;
          is_late?: boolean;
          status?: Database['public']['Enums']['submission_status'];
          score?: number | null;
          feedback?: string | null;
          submitted_at?: string;
          graded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'submissions_assignment_id_fkey';
            columns: ['assignment_id'];
            referencedRelation: 'assignments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'submissions_learner_id_fkey';
            columns: ['learner_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: Database['public']['Enums']['report_target_type'];
          target_id: string;
          reason: string;
          content: string;
          status: Database['public']['Enums']['report_status'];
          action: Database['public']['Enums']['report_action'] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: Database['public']['Enums']['report_target_type'];
          target_id: string;
          reason: string;
          content: string;
          status?: Database['public']['Enums']['report_status'];
          action?: Database['public']['Enums']['report_action'] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          target_type?: Database['public']['Enums']['report_target_type'];
          target_id?: string;
          reason?: string;
          content?: string;
          status?: Database['public']['Enums']['report_status'];
          action?: Database['public']['Enums']['report_action'] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reports_reporter_id_fkey';
            columns: ['reporter_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: 'learner' | 'instructor' | 'operator';
      course_status: 'draft' | 'published' | 'archived';
      assignment_status: 'draft' | 'published' | 'closed';
      submission_status: 'submitted' | 'graded' | 'resubmission_required';
      report_target_type: 'course' | 'assignment' | 'submission' | 'user';
      report_status: 'received' | 'investigating' | 'resolved';
      report_action: 'warning' | 'invalidate_submission' | 'restrict_account';
    };
    CompositeTypes: Record<string, never>;
  };
};

// 테이블 Row 타입 단축 alias
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

// Enum 타입 단축 alias
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
