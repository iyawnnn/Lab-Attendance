export interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  public_key: string;
}

export interface Schedule {
  id: number;
  lab_room: string;
  date: string;
  schedule: string;
  course_code: string;
  section: string;
  teacher_id?: number | null;
  teacher?: {
    name: string;
    user_id: string;
  } | null;

  active_pin?: string | null;
  pin_expires_at?: Date | string | null;
}

export interface AttendanceLog {
  id: number;
  timestamp: Date | string;
  status: string;
  signature?: string | null; 
  student: Student;
  schedule: Schedule;
}