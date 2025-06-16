export const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "TESTING", label: "Testing" },
  { value: "CALIBRATION", label: "Calibration" },
  { value: "REPAIR", label: "Repair" },
  { value: "OFFLINE", label: "Offline" },
  { value: "ERROR", label: "Error" },
];

export const DEFAULT_EXPORT_COLUMNS = [
  { key: "deviceId", label: "Device ID", checked: true },
  { key: "deviceName", label: "Name", checked: true },
  { key: "room", label: "Room", checked: true },
  { key: "status", label: "Status", checked: true },
  { key: "ipAddress", label: "IP Address", checked: true },
  { key: "lastSeen", label: "Last Seen", checked: true },
];

export const TAG_TYPE_OPTIONS = [
  { value: "INSTRUCTOR_CARD", label: "Instructor Card" },
  { value: "STUDENT_CARD", label: "Student Card" },
  { value: "TEMPORARY_PASS", label: "Temporary Pass" },
  { value: "VISITOR_PASS", label: "Visitor Pass" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "TEST", label: "Test" },
];

export const TAG_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "LOST", label: "Lost" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REPLACED", label: "Replaced" },
  { value: "RESERVED", label: "Reserved" },
];

export const USER_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "viewer", label: "Viewer" },
]; 