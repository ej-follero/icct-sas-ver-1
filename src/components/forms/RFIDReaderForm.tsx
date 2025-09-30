import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const rfidReaderFormSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required").max(50, "Device ID must be less than 50 characters"),
  deviceName: z.string().optional().or(z.literal("")),
  ipAddress: z.string().ip({ version: "v4", message: "Invalid IP address" }).optional().or(z.literal("")),
  status: z.enum(["ACTIVE","INACTIVE","TESTING","CALIBRATION","REPAIR","OFFLINE","ERROR"], {
    required_error: "Status is required"
  }),
  roomId: z.number({ required_error: "Room is required" }).int().min(1, "Room ID must be a positive integer"),
  notes: z.string().optional().or(z.literal("")),
});

type RFIDReaderFormData = z.infer<typeof rfidReaderFormSchema>;

interface RFIDReaderFormProps {
  type: "create" | "update";
  data?: RFIDReaderFormData;
  id?: number;
  onSuccess: (data: RFIDReaderFormData) => void;
  showFooter?: boolean;
}

const RFIDReaderForm: React.FC<RFIDReaderFormProps> = ({ type, data, id, onSuccess, showFooter = true }) => {
  const form = useForm<RFIDReaderFormData>({
    resolver: zodResolver(rfidReaderFormSchema),
    defaultValues: data || {
      deviceId: "",
      deviceName: undefined,
      ipAddress: undefined,
      status: "ACTIVE",
      roomId: 0,
      notes: undefined,
    },
  });

  useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [data, form]);

  const onSubmit = async (formData: RFIDReaderFormData) => {
    try {
      const url = type === 'update' ? `/api/rfid/readers/${id}` : '/api/rfid/readers';
      const method = type === 'update' ? 'PATCH' : 'POST';
      
      // Clean up the data before sending
      const cleanData = {
        deviceId: formData.deviceId.trim(),
        deviceName: formData.deviceName?.trim() || null,
        ipAddress: formData.ipAddress?.trim() || null,
        status: formData.status,
        roomId: formData.roomId,
        notes: formData.notes?.trim() || null,
      };
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Failed to ${type} RFID reader`);
      }

      const result = await response.json();
      toast.success(`RFID Reader ${type === 'create' ? 'created' : 'updated'} successfully!`);
      onSuccess(result);
    } catch (error: any) {
      console.error(`Error ${type}ing reader:`, error);
      toast.error(error.message || `Failed to ${type} RFID reader.`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="deviceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Device ID</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., RD-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deviceName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Device Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Main Entrance Reader" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ipAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IP Address</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 192.168.1.100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="TESTING">Testing</SelectItem>
                    <SelectItem value="CALIBRATION">Calibration</SelectItem>
                    <SelectItem value="REPAIR">Repair</SelectItem>
                    <SelectItem value="OFFLINE">Offline</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="roomId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned Room *</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder="Enter Room ID (must exist in database)" 
                    {...field} 
                    onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-gray-500">Room ID must reference an existing room in the database</p>
              </FormItem>
            )}
          />
        </div>
        {showFooter && (
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => form.reset()}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {type === "create" ? "Create Reader" : "Save Changes"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};

export default RFIDReaderForm; 