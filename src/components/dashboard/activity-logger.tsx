'use client';

import { useState, useEffect } from 'react';
import { format, startOfToday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import type { WellnessLog } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CalendarIcon, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { saveMoodLog } from '@/firebase/user-actions';

const activitiesList = [
  { id: 'hydration', label: '8 glasses of water' },
  { id: 'sleep', label: 'Slept 7-9 hours' },
  { id: 'exercise', label: '30 mins of exercise' },
  { id: 'meditation', label: 'Meditated for 10 mins' },
  { id: 'nutrition', label: 'Ate balanced meals' },
  { id: 'social', label: 'Connected with someone' },
];

const moodLabels = ['Very Low', 'Low', 'Neutral', 'Good', 'Very Good'];

interface ActivityLoggerProps {
  logs: WellnessLog[];
  setLogs: (
    value: WellnessLog[] | ((val: WellnessLog[]) => WellnessLog[])
  ) => void;
}

export function ActivityLogger({ logs, setLogs }: ActivityLoggerProps) {
  const [date, setDate] = useState<Date>(startOfToday());
  const [mood, setMood] = useState<number>(3);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  useEffect(() => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const logForDate = logs.find((log) => log.date === formattedDate);
    if (logForDate) {
      setMood(logForDate.mood);
      setSelectedActivities(logForDate.activities);
    } else {
      setMood(3);
      setSelectedActivities([]);
    }
  }, [date, logs]);

  const handleSave = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to save logs.',
      });
      return;
    }

    setIsSaving(true);
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    try {
      // Save to Firestore
      await saveMoodLog(firestore, user.uid, {
        mood,
        activities: selectedActivities,
        date: formattedDate,
      });

      // Update local state
      const newLog: WellnessLog = {
        date: formattedDate,
        mood,
        activities: selectedActivities,
      };

      setLogs((prevLogs) => {
        const otherLogs = prevLogs.filter((log) => log.date !== formattedDate);
        const sortedLogs = [...otherLogs, newLog].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        return sortedLogs;
      });

      toast({
        title: 'Log Saved',
        description: `Your entry for ${format(date, 'PPP')} has been saved to the database.`,
      });
    } catch (error) {
      console.error('Error saving log:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Failed to save your log. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivityChange = (activityId: string, checked: boolean) => {
    setSelectedActivities((prev) =>
      checked ? [...prev, activityId] : prev.filter((id) => id !== activityId)
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Log Your Day</CardTitle>
        <CardDescription>
          Select a date and record your mood and activities.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <Label>Date</Label>
            <Popover open={isCalendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) {
                      setDate(d);
                      setCalendarOpen(false);
                    }
                  }}
                  disabled={(date) =>
                    date > new Date() || date < new Date('1900-01-01')
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-4">
            <Label>Mood: {moodLabels[mood - 1]}</Label>
            <Slider
              value={[mood]}
              onValueChange={(value) => setMood(value[0])}
              min={1}
              max={5}
              step={1}
              className="py-2"
            />
          </div>

          <div className="space-y-4">
            <Label>Activities</Label>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-1">
              {activitiesList.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={activity.id}
                    checked={selectedActivities.includes(activity.id)}
                    onCheckedChange={(checked) =>
                      handleActivityChange(activity.id, !!checked)
                    }
                  />
                  <label
                    htmlFor={activity.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {activity.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Log'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
