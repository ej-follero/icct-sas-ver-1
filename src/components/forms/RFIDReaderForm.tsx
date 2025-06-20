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
  deviceId: z.string().min(1, "Device ID is required"),
  deviceName: z.string().min(1, "Device name is required"),
  ipAddress: z.string().ip({ version: "v4", message: "Invalid IP address" }),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]),
  roomId: z.number().nullable(),
});

type RFIDReaderFormData = z.infer<typeof rfidReaderFormSchema>;

interface RFIDReaderFormProps {
  type: "create" | "update";
  data?: RFIDReaderFormData;
  id?: number;
  onSuccess: (data: RFIDReaderFormData) => void;
}

const RFIDReaderForm: React.FC<RFIDReaderFormProps> = ({ type, data, id, onSuccess }) => {
  const form = useForm<RFIDReaderFormData>({
    resolver: zodResolver(rfidReaderFormSchema),
    defaultValues: data || {
      deviceId: "",
      deviceName: "",
      ipAddress: "",
      status: "ACTIVE",
      roomId: null,
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
      const method = type === 'update' ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${type} RFID reader`);
      }

      const result = await response.json();
      toast.success(`RFID Reader ${type === 'create' ? 'created' : 'updated'} successfully!`);
      onSuccess(result);
    } catch (error) {
      console.error(`Error ${type}ing reader:`, error);
      toast.error(`Failed to ${type} RFID reader.`);
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
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
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
                <FormLabel>Assigned Room (Optional)</FormLabel>
                <FormControl>
                  {/* This should ideally be a searchable select of rooms */}
                  <Input 
                    type="number"
                    placeholder="Enter Room ID" 
                    {...field} 
                    onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {type === "create" ? "Create Reader" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default RFIDReaderForm; 