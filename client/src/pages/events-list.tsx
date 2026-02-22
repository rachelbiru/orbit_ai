import { useEvents, useCreateEvent } from "@/hooks/use-events";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema } from "@shared/schema";
import { Calendar, Plus, MapPin } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { format } from "date-fns";

export default function EventsList() {
  const { data: events, isLoading } = useEvents();
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: createEvent } = useCreateEvent();

  const form = useForm({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      name: "",
      location: "",
      isActive: true,
      date: new Date(),
    }
  });

  const onSubmit = (values: any) => {
    // Ensure date is properly formatted as Date object for the API
    const eventData = {
      ...values,
      date: values.date instanceof Date ? values.date : new Date(values.date),
    };
    createEvent(eventData, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
      }
    });
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Events</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Event</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Galactic Championship 2025" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Mars Base Alpha" {...field} value={field.value || ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Create</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events?.map(event => (
          <Card key={event.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
            <CardHeader>
              <CardTitle className="group-hover:text-primary transition-colors">{event.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Calendar size={14} />
                {format(new Date(event.date), "MMMM d, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MapPin size={14} />
                {event.location || "TBD"}
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${event.isActive ? 'bg-green-500' : 'bg-slate-500'}`} />
                <span className="text-xs uppercase font-bold tracking-wider">{event.isActive ? 'Active' : 'Archived'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
