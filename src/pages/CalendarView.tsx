import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, CalendarDays } from 'lucide-react';

export default function CalendarView() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const openGoogleCalendar = () => {
    window.open('https://calendar.google.com', '_blank');
  };

  const today = new Date();

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            {today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={openGoogleCalendar}>
          <ExternalLink className="h-4 w-4 mr-1" /> Google
        </Button>
      </div>

      <Card className="p-3 flex justify-center mb-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="pointer-events-auto"
          initialFocus
        />
      </Card>

      {date && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <p className="font-semibold">
              {date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            To view or manage appointments, open Google Calendar.
          </p>
          <Button className="mt-3 w-full" variant="outline" onClick={openGoogleCalendar}>
            <ExternalLink className="h-4 w-4 mr-2" /> Open Google Calendar
          </Button>
        </Card>
      )}

      <Card className="p-4 mt-4 border-dashed">
        <p className="text-xs text-muted-foreground text-center">
          💡 Sync tip: On your phone, open Google Calendar and sign in with your Google account to sync appointments across devices.
        </p>
      </Card>
    </div>
  );
}
