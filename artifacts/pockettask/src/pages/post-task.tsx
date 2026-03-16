import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useCreateTask } from "@workspace/api-client-react";
import { Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(10, "Please provide more details (min 10 chars)"),
  category: z.string().min(1, "Please select a category"),
  pay: z.coerce.number().min(1, "Pay must be at least $1"),
  locationName: z.string().optional(),
  estimatedHours: z.coerce.number().optional().or(z.literal(0)),
});

export default function PostTask() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { mutateAsync: createTask, isPending } = useCreateTask();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      pay: 0,
      locationName: "",
      estimatedHours: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const task = await createTask({
        data: {
          ...values,
          // Add default lat/lng for Pictou if map selection isn't implemented
          lat: 45.6830 + (Math.random() * 0.1 - 0.05),
          lng: -62.7082 + (Math.random() * 0.1 - 0.05),
        }
      });
      toast({
        title: "Task posted successfully!",
        description: "Your neighbors can now see and apply to your task.",
      });
      setLocation(`/tasks/${task.id}`);
    } catch (error: any) {
      toast({
        title: "Error posting task",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-card rounded-3xl border border-border shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-accent mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Log In Required</h2>
        <p className="text-muted-foreground mb-6">You need an account to post tasks to the community.</p>
        <Link href="/">
          <Button className="w-full rounded-full">Return Home</Button>
        </Link>
      </div>
    );
  }

  const categories = ["Yard Work", "Snow Removal", "Moving Help", "Grocery/Errands", "Pet Care", "Cleaning", "Home Repair", "Tech Help", "Tutoring", "Other"];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 mb-20 md:mb-0">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">Post a Task</h1>
        <p className="text-muted-foreground text-lg mt-2">Describe what you need help with and set a fair price.</p>
      </div>

      <div className="bg-card p-6 md:p-8 rounded-3xl border border-border shadow-lg shadow-black/5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Help moving a sofa" className="h-12 bg-background rounded-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 bg-background rounded-xl">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Pay Amount ($)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input type="number" min="1" step="1" className="pl-8 h-12 bg-background rounded-xl" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Details</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe exactly what needs to be done, tools required, etc." 
                      className="min-h-[120px] bg-background rounded-xl resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="locationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Neighborhood / Area (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Stellarton or Westville" className="h-12 bg-background rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Estimated Hours (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.5" placeholder="e.g., 2" className="h-12 bg-background rounded-xl" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isPending} className="w-full h-14 text-lg rounded-xl font-bold shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all">
              {isPending ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Posting Task...</>
              ) : "Post Task to Community"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
