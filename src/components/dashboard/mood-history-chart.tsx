'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { WellnessLog } from '@/lib/types';
import { format, subDays, startOfToday } from 'date-fns';
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts';

interface MoodHistoryChartProps {
  logs: WellnessLog[];
}

const moodLabels = ['Very Low', 'Low', 'Neutral', 'Good', 'Very Good'];

export function MoodHistoryChart({ logs }: MoodHistoryChartProps) {
  const data = Array.from({ length: 30 }).map((_, i) => {
    const date = subDays(startOfToday(), 29 - i);
    const formattedDate = format(date, 'yyyy-MM-dd');
    const log = logs.find((l) => l.date === formattedDate);
    return {
      date: format(date, 'MMM d'),
      mood: log ? log.mood : null,
    };
  });

  const chartConfig = {
    mood: {
      label: 'Mood',
      color: 'var(--primary)',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">
          Mood History (Last 30 Days)
        </CardTitle>
        <CardDescription>
          Visualize your mood trends over time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tickFormatter={(value) => moodLabels[value - 1]}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(label, payload) => {
                    const moodValue = payload[0]?.payload.mood;
                    if (moodValue) {
                      return `${label}: ${moodLabels[moodValue - 1]}`;
                    }
                    return label;
                  }}
                  indicator="dot"
                />
              }
            />
            <Line
              dataKey="mood"
              type="monotone"
              stroke="var(--color-mood)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--color-mood)' }}
              connectNulls
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
