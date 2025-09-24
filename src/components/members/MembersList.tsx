import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddMemberForm } from "./AddMemberForm";
import { useState } from "react";

export default function MembersList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: members, loading, refetch } = useSupabaseQuery('users', '*', []);

  // Sample data when database is empty
  const sampleMembers = [
    {
      id: 'sample-1',
      first_name: 'Alice',
      last_name: 'Wanjiku',
      member_no: 'CH001',
      phone: '+254701234567',
      email: 'alice.wanjiku@email.com',
      role: 'chairperson',
      status: 'active',
      join_date: '2023-01-15'
    },
    {
      id: 'sample-2',
      first_name: 'John',
      last_name: 'Kamau',
      member_no: 'CH002',
      phone: '+254702345678',
      email: 'john.kamau@email.com',
      role: 'treasurer',
      status: 'active',
      join_date: '2023-01-20'
    },
    {
      id: 'sample-3',
      first_name: 'Mary',
      last_name: 'Njoki',
      member_no: 'CH003',
      phone: '+254703456789',
      email: 'mary.njoki@email.com',
      role: 'secretary',
      status: 'active',
      join_date: '2023-02-01'
    }
  ];

  const displayMembers = members.length > 0 ? members : sampleMembers;

  const handleSuccess = () => {
    setDialogOpen(false);
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Members Management</h2>
          <p className="text-muted-foreground">Manage your chama members and their information</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
            </DialogHeader>
            <AddMemberForm onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {displayMembers.map((member: any) => (
          <Card key={member.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    {member.first_name} {member.last_name}
                  </h3>
                  <div className="flex space-x-4 text-sm text-muted-foreground">
                    <span>Member #{member.member_no}</span>
                    <span>{member.phone}</span>
                    <span>{member.email}</span>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      member.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {member.status}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {member.role}
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>Joined: {new Date(member.join_date).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {displayMembers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No members found. Add your first member to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}