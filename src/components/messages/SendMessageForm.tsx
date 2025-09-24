import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";

const messageSchema = z.object({
  message_content: z.string().min(1, "Message content is required").max(1000, "Message too long"),
  channel: z.enum(["sms", "email", "whatsapp"]),
  member_ids: z.array(z.string()).min(1, "Please select at least one member"),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface SendMessageFormProps {
  onSuccess: () => void;
}

export function SendMessageForm({ onSuccess }: SendMessageFormProps) {
  const { toast } = useToast();
  const { data: members } = useSupabaseQuery('users', 'id, first_name, last_name, member_no, phone, email', []);
  
  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message_content: "",
      channel: "sms",
      member_ids: [],
    },
  });

  const onSubmit = async (data: MessageFormData) => {
    try {
      // Create a message record for each selected member
      const messageRecords = data.member_ids.map(member_id => ({
        member_id,
        message_content: data.message_content,
        channel: data.channel,
        status: 'queued' as const,
      }));

      const { error } = await supabase
        .from('messages')
        .insert(messageRecords);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Message queued for ${data.member_ids.length} member(s)`,
      });
      form.reset();
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const selectedMemberIds = form.watch("member_ids");
  const allSelected = selectedMemberIds.length === members.length;
  const someSelected = selectedMemberIds.length > 0;

  const toggleAllMembers = () => {
    if (allSelected) {
      form.setValue("member_ids", []);
    } else {
      form.setValue("member_ids", members.map((member: any) => member.id));
    }
  };

  const toggleMember = (memberId: string) => {
    const current = form.getValues("member_ids");
    if (current.includes(memberId)) {
      form.setValue("member_ids", current.filter(id => id !== memberId));
    } else {
      form.setValue("member_ids", [...current, memberId]);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="channel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message Channel</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select message channel" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message_content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message Content</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter your message here..."
                  className="min-h-[120px]"
                  {...field} 
                />
              </FormControl>
              <div className="text-xs text-muted-foreground text-right">
                {field.value.length}/1000 characters
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="member_ids"
          render={() => (
            <FormItem>
              <FormLabel>Recipients</FormLabel>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={toggleAllMembers}
                    ref={(ref) => {
                      if (ref) {
                        ref.indeterminate = someSelected && !allSelected;
                      }
                    }}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Select All Members ({members.length})
                  </label>
                </div>
                <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
                  {members.map((member: any) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={member.id}
                        checked={selectedMemberIds.includes(member.id)}
                        onCheckedChange={() => toggleMember(member.id)}
                      />
                      <label htmlFor={member.id} className="text-sm flex-1">
                        {member.first_name} {member.last_name} ({member.member_no})
                        <span className="text-muted-foreground ml-2">
                          {form.watch("channel") === "email" ? member.email : member.phone}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm text-muted-foreground">
            <strong>Selected:</strong> {selectedMemberIds.length} member(s)
          </p>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={selectedMemberIds.length === 0}>
            Send Message
          </Button>
        </div>
      </form>
    </Form>
  );
}