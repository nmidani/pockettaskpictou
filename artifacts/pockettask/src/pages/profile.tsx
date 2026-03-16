import { useAuth } from "@workspace/replit-auth-web";
import { useGetMyProfile, useUpdateMyProfile, getGetMyProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Loader2, Settings, Star, CheckCircle, ListTodo } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().max(300).optional(),
  phone: z.string().optional(),
});

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { data: profile, isLoading } = useGetMyProfile({ query: { enabled: isAuthenticated } });
  const { mutateAsync: updateProfile, isPending } = useUpdateMyProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditOpen, setIsEditOpen] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      bio: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
      });
    }
  }, [profile, form]);

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    try {
      await updateProfile({ data: values });
      queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
      toast({ title: "Profile updated successfully" });
      setIsEditOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (!isAuthenticated) return null; // Let the protected route or Layout handle this

  if (isLoading || !profile) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-16 mb-20 md:mb-0">
      
      {/* Profile Header Card */}
      <div className="bg-card rounded-[2.5rem] border border-border shadow-xl shadow-black/5 overflow-hidden relative">
        <div className="h-32 md:h-48 bg-gradient-to-r from-primary/30 via-accent/20 to-secondary/50 w-full absolute top-0 left-0" />
        
        <div className="relative pt-20 md:pt-32 px-6 md:px-12 pb-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
          <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-card shadow-2xl rounded-[2rem] bg-card">
            <AvatarImage src={profile.profileImage || undefined} className="object-cover" />
            <AvatarFallback className="text-4xl font-display font-bold bg-primary/10 text-primary">
              {profile.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-1 tracking-tight">
              {profile.firstName ? `${profile.firstName} ${profile.lastName || ''}` : profile.username}
            </h1>
            <p className="text-muted-foreground font-medium mb-4">@{profile.username} • Joined {format(new Date(profile.createdAt), 'MMMM yyyy')}</p>
            
            {profile.bio && (
              <p className="text-foreground max-w-xl text-lg leading-relaxed mb-4">
                "{profile.bio}"
              </p>
            )}
          </div>
          
          <Button 
            onClick={() => setIsEditOpen(true)}
            variant="outline" 
            className="rounded-full shadow-sm hover:shadow-md transition-all self-center md:self-end md:mb-4"
          >
            <Settings className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="p-6 rounded-3xl border-border flex items-center gap-4 bg-card hover:border-primary/30 transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <ListTodo className="w-7 h-7" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{profile.tasksPosted}</p>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tasks Posted</p>
          </div>
        </Card>
        
        <Card className="p-6 rounded-3xl border-border flex items-center gap-4 bg-card hover:border-primary/30 transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{profile.tasksCompleted}</p>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tasks Completed</p>
          </div>
        </Card>
        
        <Card className="p-6 rounded-3xl border-border flex items-center gap-4 bg-card hover:border-primary/30 transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
            <Star className="w-7 h-7" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{profile.rating ? profile.rating.toFixed(1) : 'New'}</p>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Community Rating</p>
          </div>
        </Card>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Profile</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input className="rounded-xl h-12 bg-background" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input className="rounded-xl h-12 bg-background" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input className="rounded-xl h-12 bg-background" placeholder="(555) 555-5555" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )} />
              <FormField control={form.control} name="bio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>About You</FormLabel>
                    <FormControl><Textarea className="rounded-xl resize-none min-h-[100px] bg-background" placeholder="Tell your neighbors about yourself and what skills you have..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )} />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" disabled={isPending} className="rounded-xl shadow-md shadow-primary/20">
                  {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
