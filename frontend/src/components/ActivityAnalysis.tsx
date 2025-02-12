import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Card } from '@/components/ui/card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ActivityLog {
  date: string;
  day: string;
  time: string;
  activity: string;
}

interface ActivityAnalysisProps {
  logs: ActivityLog[];
}

interface ActivityCount {
  activity: string;
  count: number;
}

interface ActivityDuration {
  activity: string;
  totalMinutes: number;
}

interface DayCount {
  day: string;
  count: number;
}

export function ActivityAnalysis({ logs }: ActivityAnalysisProps) {
  // Sort logs by date and time
  const sortedLogs = [...logs].sort((a, b) => {
    const dateTimeA = new Date(`${a.date} ${a.time}`);
    const dateTimeB = new Date(`${b.date} ${b.time}`);
    return dateTimeA.getTime() - dateTimeB.getTime();
  });

  // Calculate time spent on activities
  const getActivityDurations = (): ActivityDuration[] => {
    const activityDurations: { [key: string]: number } = {};
    
    for (let i = 0; i < sortedLogs.length - 1; i++) {
      const currentLog = sortedLogs[i];
      const nextLog = sortedLogs[i + 1];
      
      // Only calculate duration if logs are from the same day
      if (currentLog.date === nextLog.date) {
        const startTime = new Date(`${currentLog.date} ${currentLog.time}`);
        const endTime = new Date(`${nextLog.date} ${nextLog.time}`);
        const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        
        // Only count reasonable durations (less than 8 hours)
        if (durationMinutes > 0 && durationMinutes < 480) {
          activityDurations[currentLog.activity] = (activityDurations[currentLog.activity] || 0) + durationMinutes;
        }
      }
    }

    return Object.entries(activityDurations)
      .map(([activity, totalMinutes]) => ({ activity, totalMinutes }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes)
      .slice(0, 5); // Top 5 time-consuming activities
  };

  // Most repeated activities analysis
  const getTopActivities = (): ActivityCount[] => {
    const activityCounts = logs.reduce((acc: { [key: string]: number }, log) => {
      acc[log.activity] = (acc[log.activity] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(activityCounts)
      .map(([activity, count]) => ({ activity, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 activities
  };

  // Activities by day of week analysis
  const getActivitiesByDay = (): DayCount[] => {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayCounts = logs.reduce((acc: { [key: string]: number }, log) => {
      acc[log.day] = (acc[log.day] || 0) + 1;
      return acc;
    }, {});

    return dayOrder.map(day => ({
      day,
      count: dayCounts[day] || 0
    }));
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const topActivities = getTopActivities();
  const activitiesByDay = getActivitiesByDay();
  const activityDurations = getActivityDurations();

  const mostRepeatedData = {
    labels: topActivities.map(item => item.activity),
    datasets: [
      {
        label: 'Number of Times',
        data: topActivities.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
      },
    ],
  };

  const timeSpentData = {
    labels: activityDurations.map(item => item.activity),
    datasets: [
      {
        label: 'Time Spent (minutes)',
        data: activityDurations.map(item => item.totalMinutes),
        backgroundColor: [
          'rgba(255, 159, 64, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
      },
    ],
  };

  const dayActivityData = {
    labels: activitiesByDay.map(item => item.day),
    datasets: [
      {
        label: 'Activities per Day',
        data: activitiesByDay.map(item => item.count),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available for analysis. Log some activities first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Time Spent on Activities</h3>
        <div className="h-[300px]">
          <Pie data={timeSpentData} options={chartOptions} />
        </div>
        <div className="mt-4">
          <h4 className="font-medium mb-2">Time Breakdown:</h4>
          <ul className="space-y-1 text-sm">
            {activityDurations.map((item, index) => (
              <li key={index}>
                <strong>{item.activity}:</strong> {formatDuration(item.totalMinutes)}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Most Repeated Activities</h3>
        <div className="h-[300px]">
          <Pie data={mostRepeatedData} options={chartOptions} />
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Activities by Day of Week</h3>
        <div className="h-[300px]">
          <Bar data={dayActivityData} options={chartOptions} />
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Most time-consuming activity: <strong>{activityDurations[0]?.activity}</strong> ({formatDuration(activityDurations[0]?.totalMinutes || 0)})</li>
          <li>Most frequent activity: <strong>{topActivities[0]?.activity}</strong> ({topActivities[0]?.count} times)</li>
          <li>Most active day: <strong>{activitiesByDay.reduce((a, b) => a.count > b.count ? a : b).day}</strong></li>
          <li>Total activities logged: <strong>{logs.length}</strong></li>
        </ul>
      </Card>
    </div>
  );
} 