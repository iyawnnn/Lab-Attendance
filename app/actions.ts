// app/actions.ts
export {
  loginAdmin,
  logoutAdmin,
  createAdminAccount,
  createStaffAccount,
  deleteTeacherAccount,
  resetStudentDevice,
  getAdminData,
  fetchAdminData,
} from "./actions/admin";

export {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  assignTeacherToSchedule,
  assignTeacherToMultipleSchedules,
  removeTeacherFromSchedule,
} from "./actions/schedule";

export {
  loginTeacher,
  logoutTeacher,
  getTeacherDashboardData,
  generateSessionPin,
  changeTeacherPassword,
  manuallyAdmitStudent,
} from "./actions/teacher";

export {
  registerStudentToDatabase,
  recoverStudentDevice,
  checkRevokedStatus,
  getLabRooms,
  submitAttendance,
} from "./actions/student";

export { logAdminAction } from "./actions/audit";

export { getServerTime } from "./actions/utils";