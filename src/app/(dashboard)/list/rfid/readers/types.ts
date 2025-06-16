import { z } from "zod";

export type RFIDReader = {
  readerId: number;
  roomId: number;
  deviceId: string;
  deviceName?: string;
  components: any;
  assemblyDate: string;
  lastCalibration?: string;
  nextCalibration?: string;
  ipAddress?: string;
  status: string;
  lastSeen: string;
  notes?: string;
  testResults?: any;
};

export const rfidReaderFormSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
  deviceName: z.string().optional(),
  roomId: z.number().min(1, "Room ID is required"),
  ipAddress: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "TESTING", "CALIBRATION", "REPAIR", "OFFLINE", "ERROR"]),
  notes: z.string().optional(),
});

export type RFIDReaderFormData = z.infer<typeof rfidReaderFormSchema>; 