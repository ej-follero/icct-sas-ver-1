"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Info, RotateCcw, Save, Loader2 } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";

const roomFormSchema = z.object({
  roomNo: z.string().min(1, "Room number is required"),
  roomType: z.enum(["CLASSROOM", "LABORATORY", "OFFICE", "CONFERENCE"]),
  roomCapacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  roomBuildingLoc: z.string().min(1, "Building location is required"),
  roomFloorLoc: z.string().min(1, "Floor location is required"),
  readerId: z.string().min(1, "RFID reader ID is required"),
});

type RoomFormData = z.infer<typeof roomFormSchema>;

interface RoomFormProps {
  type: "create" | "update";
  data?: RoomFormData;
  id?: string | number;
  onSuccess?: (room: RoomFormData) => void;
}

export default function RoomForm({ type, data, id, onSuccess }: RoomFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [rfidReaders, setRfidReaders] = useState<{ deviceId: string; deviceName?: string }[]>([]);
  const [rfidLoading, setRfidLoading] = useState(false);
  const [rfidError, setRfidError] = useState<string | null>(null);

  const defaultValues: RoomFormData = {
    roomNo: "",
    roomType: "CLASSROOM",
    roomCapacity: 40,
    roomBuildingLoc: "",
    roomFloorLoc: "",
    readerId: "",
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
    getValues,
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: data || defaultValues,
  });

  useEffect(() => {
    const fetchReaders = async () => {
      setRfidLoading(true);
      setRfidError(null);
      try {
        const res = await fetch("/api/rfid/readers?page=1&pageSize=1000");
        if (!res.ok) throw new Error("Failed to fetch RFID readers");
        const json = await res.json();
        setRfidReaders(json.data || []);
      } catch (err: any) {
        setRfidError("Could not load RFID readers");
      } finally {
        setRfidLoading(false);
      }
    };
    fetchReaders();
  }, []);

  const onSubmit = async (formData: RoomFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      // Simulate API call or pass data up
      onSuccess?.(formData);
      toast.success(type === "create" ? "Room created successfully" : "Room updated successfully");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    reset(data || defaultValues);
  };

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      setError(null);
      // Simulate saving draft (could be an API call)
      // For now, just show a toast and log the current form values
      const values = getValues();
      // await fetch('/api/rooms/draft', { method: 'POST', body: JSON.stringify(values) })
      toast.success('Draft saved successfully');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Info: All fields required */}
      <div className="flex items-center gap-2 mb-3 text-gray-500 text-sm">
        <Info className="h-5 w-5" />
        <span>All fields marked with <span className="font-bold">*</span> are required</span>
      </div>
      {/* Basic Information Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-md font-semibold text-blue-900">Room Information</h3>
          </div>
        </div>
        <div className="h-px bg-blue-100 w-full mb-4"></div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="roomNo" className="text-sm text-blue-900">
              Room Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="roomNo"
              {...register("roomNo")}
              className={`mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 ${errors.roomNo ? "border-red-500" : ""}`}
              aria-invalid={!!errors.roomNo}
              aria-describedby={errors.roomNo ? "roomNo-error" : undefined}
            />
            {errors.roomNo && (
              <p id="roomNo-error" className="text-sm text-red-600 mt-1">{errors.roomNo.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="roomType" className="text-sm text-blue-900">
              Room Type <span className="text-red-500">*</span>
            </Label>
            <Select value={watch("roomType")} onValueChange={(v) => setValue("roomType", v as any)} required>
              <SelectTrigger id="roomType" className="w-full mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLASSROOM">Classroom</SelectItem>
                <SelectItem value="LABORATORY">Laboratory</SelectItem>
                <SelectItem value="OFFICE">Office</SelectItem>
                <SelectItem value="CONFERENCE">Conference Room</SelectItem>
              </SelectContent>
            </Select>
            {errors.roomType && (
              <p className="text-sm text-red-600 mt-1">{errors.roomType.message}</p>
            )}
          </div>
        </div>
      </div>
      {/* Location Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-md font-semibold text-blue-900">Location</h3>
          </div>
        </div>
        <div className="h-px bg-blue-100 w-full mb-4"></div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="roomBuildingLoc" className="text-sm text-blue-900">
              Building <span className="text-red-500">*</span>
            </Label>
            <Input
              id="roomBuildingLoc"
              {...register("roomBuildingLoc")}
              className={`mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 ${errors.roomBuildingLoc ? "border-red-500" : ""}`}
              aria-invalid={!!errors.roomBuildingLoc}
              aria-describedby={errors.roomBuildingLoc ? "roomBuildingLoc-error" : undefined}
            />
            {errors.roomBuildingLoc && (
              <p id="roomBuildingLoc-error" className="text-sm text-red-600 mt-1">{errors.roomBuildingLoc.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="roomFloorLoc" className="text-sm text-blue-900">
              Floor <span className="text-red-500">*</span>
            </Label>
            <Input
              id="roomFloorLoc"
              {...register("roomFloorLoc")}
              className={`mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 ${errors.roomFloorLoc ? "border-red-500" : ""}`}
              aria-invalid={!!errors.roomFloorLoc}
              aria-describedby={errors.roomFloorLoc ? "roomFloorLoc-error" : undefined}
            />
            {errors.roomFloorLoc && (
              <p id="roomFloorLoc-error" className="text-sm text-red-600 mt-1">{errors.roomFloorLoc.message}</p>
            )}
          </div>
        </div>
      </div>
      {/* Capacity & RFID Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-md font-semibold text-blue-900">Capacity & RFID</h3>
          </div>
        </div>
        <div className="h-px bg-blue-100 w-full mb-4"></div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="roomCapacity" className="text-sm text-blue-900">
              Capacity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="roomCapacity"
              type="number"
              {...register("roomCapacity", { valueAsNumber: true })}
              className={`mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 ${errors.roomCapacity ? "border-red-500" : ""}`}
              aria-invalid={!!errors.roomCapacity}
              aria-describedby={errors.roomCapacity ? "roomCapacity-error" : undefined}
            />
            {errors.roomCapacity && (
              <p id="roomCapacity-error" className="text-sm text-red-600 mt-1">{errors.roomCapacity.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="readerId" className="text-sm text-blue-900">
              RFID Reader <span className="text-red-500">*</span>
            </Label>
            {rfidLoading ? (
              <div className="flex items-center gap-2 text-blue-600"><Loader2 className="animate-spin w-4 h-4" /> Loading readers...</div>
            ) : rfidError ? (
              <div className="text-red-600 text-sm">{rfidError}</div>
            ) : rfidReaders.length > 0 ? (
              <Select
                value={watch("readerId") || ""}
                onValueChange={v => setValue("readerId", v)}
                required
              >
                <SelectTrigger id="readerId" className="w-full mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                  <SelectValue placeholder="Select RFID reader" />
                </SelectTrigger>
                <SelectContent>
                  {rfidReaders.map(reader => (
                    <SelectItem key={reader.deviceId} value={reader.deviceId}>
                      {reader.deviceId}{reader.deviceName ? ` - ${reader.deviceName}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="readerId"
                {...register("readerId")}
                className={`mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 ${errors.readerId ? "border-red-500" : ""}`}
                aria-invalid={!!errors.readerId}
                aria-describedby={errors.readerId ? "readerId-error" : undefined}
                placeholder="Enter RFID reader ID"
              />
            )}
            {errors.readerId && (
              <p id="readerId-error" className="text-sm text-red-600 mt-1">{errors.readerId.message}</p>
            )}
          </div>
        </div>
      </div>
      {/* Actions */}
      <DialogFooter className="flex items-center justify-end pt-4">
        <div className="flex gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={handleReset}
            disabled={isSubmitting || !isDirty}
            className="w-32 border border-blue-300 text-blue-500"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting || isSavingDraft || !isDirty}
            className="w-32 border border-blue-300 text-blue-500"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSavingDraft ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isSavingDraft}
            className="w-32 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting
              ? type === "update"
                ? "Saving..."
                : "Saving..."
              : type === "update"
                ? "Update Room"
                : "Create Room"}
          </Button>
        </div>
      </DialogFooter>
      {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
    </form>
  );
} 