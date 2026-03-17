import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateTask } from "@/hooks/use-tasks";
import { useLocation } from "wouter";
import { PICTOU_TOWNS, TASK_CATEGORIES } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(5, "Title is too short").max(100),
  description: z.string().min(10, "Provide a bit more detail"),
  category: z.string().min(1, "Select a category"),
  pay: z.coerce.number().min(5, "Minimum pay is $5"),
  paymentMethod: z.enum(["cash", "etransfer"]),
  town: z.string().min(1, "Select a town"),
  estimatedHours: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PostTask() {
  const [, setLocation] = useLocation();
  const createTask = useCreateTask();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { paymentMethod: "cash", pay: 20 }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setError(null);
      const res = await createTask.mutateAsync(data);
      setLocation(`/tasks/${res.id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-extrabold text-foreground mb-2">Post a Task</h1>
        <p className="text-lg text-muted-foreground">Fill out the details below to get help from a local neighbor.</p>
      </div>

      <Card className="shadow-xl shadow-black/5 overflow-hidden border-border/50">
        <div className="bg-primary/5 p-6 border-b border-border/50">
          <h2 className="font-display font-bold text-xl text-primary flex items-center gap-2">
            📝 Task Details
          </h2>
        </div>
        <CardContent className="p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-xl flex items-center gap-3 font-medium">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">What do you need help with?</label>
              <input
                {...register("title")}
                placeholder="e.g. Help moving a couch down one flight of stairs"
                className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/50"
              />
              {errors.title && <p className="text-destructive text-sm mt-1.5">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Category</label>
                <select
                  {...register("category")}
                  className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                >
                  <option value="">Select a category</option>
                  {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className="text-destructive text-sm mt-1.5">{errors.category.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Town (Pictou County)</label>
                <select
                  {...register("town")}
                  className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                >
                  <option value="">Select a town</option>
                  {PICTOU_TOWNS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.town && <p className="text-destructive text-sm mt-1.5">{errors.town.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Detailed Description</label>
              <textarea
                {...register("description")}
                rows={4}
                placeholder="Provide specific details, tools needed, exact location info, etc."
                className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium resize-none"
              />
              {errors.description && <p className="text-destructive text-sm mt-1.5">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border/50">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Pay ($ CAD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">$</span>
                  <input
                    type="number"
                    {...register("pay")}
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-lg"
                  />
                </div>
                {errors.pay && <p className="text-destructive text-sm mt-1.5">{errors.pay.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Payment Method</label>
                <select
                  {...register("paymentMethod")}
                  className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                >
                  <option value="cash">Cash in hand</option>
                  <option value="etransfer">E-transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Est. Hours</label>
                <input
                  type="number"
                  step="0.5"
                  {...register("estimatedHours")}
                  placeholder="e.g. 2.5"
                  className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                />
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-border/50">
              <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
                Post Task
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-4 font-medium">
                By posting, you agree to our Community Guidelines. Remember to stay safe and meet in well-lit areas.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
