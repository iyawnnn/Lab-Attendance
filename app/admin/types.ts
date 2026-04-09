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
  professor_name: string;
}

export interface AttendanceLog {
  id: number;
  timestamp: Date | string;
  status: string;
  student: Student;
  schedule: Schedule;
}