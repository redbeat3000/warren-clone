import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";

const fineSchema = z.object({
  member_id: z.string().min(1, "Please select a member"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  reason: z.string().min(1, "Reason is required"),
  fine_date: z.date(),
});

type FineFormData = z.infer<typeof fineSchema>;

interface AddFineFormProps {
  onSuccess: () => void;
}

export function AddFineForm({ onSuccess }: AddFineFormProps) {
  const { toast } = useToast();
  const { data: members } = useSupabaseQuery('users', 'id, first_name, last_name, member_no', []);
  
  const form = useForm<FineFormData>({
    resolver: zodResolver(fineSchema),
    defaultValues: {
      member_id: "",
      amount: 0,
      reason: "",
      fine_date: new Date(),
    },
  });

  const onSubmit = async (data: FineFormData) => {
    try {
      const insertData = {
        member_id: data.member_id,
        amount: data.amount,
        reason: data.reason,
        fine_date: data.fine_date.toISOString().split('T')[0],
        status: 'unpaid'
      };
      
      const { error } = await supabase
        .from('fines')
        .insert([insertData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Fine recorded successfully",
      });
      form.reset();
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record fine",
        variant: "destructive",
      });
    }
  };

  const commonFineReasons = [
    "Late contribution payment",
    "Missed meeting attendance",
    "Late loan repayment",
    "Violation of group rules",
    "Administrative penalty",
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="member_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Member</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {members.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.first_name} {member.last_name} ({member.member_no})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fine Amount (KES)</FormLabel>
                <FormControl>
                <Input 
                  placeholder="Enter fine amount" 
                  type="number" 
                  step="0.01"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fine_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fine Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for Fine</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter reason for fine or select from common reasons below"
                  {...field} 
                />
              </FormControl>
              <div className="flex flex-wrap gap-2 mt-2">
                {commonFineReasons.map((reason) => (
                  <Button
                    key={reason}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue("reason", reason)}
                    className="text-xs"
                  >
                    {reason}
                  </Button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit">Record Fine</Button>
        </div>
      </form>
    </Form>
  );
}