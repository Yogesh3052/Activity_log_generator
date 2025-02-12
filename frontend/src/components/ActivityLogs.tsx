import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ClipboardList, Loader2, BarChart2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ActivityAnalysis } from './ActivityAnalysis';

interface ActivityLog {
  date: string;
  day: string;
  time: string;
  activity: string;
}

interface ActivityLogsProps {
  isConnected: boolean;
}

export function ActivityLogs({ isConnected }: ActivityLogsProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const { toast } = useToast();

  const fetchLogs = async () => {
    if (!isConnected) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Cannot connect to the server. Please make sure the backend is running.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/activities');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch activities');
      }

      setLogs(data);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to fetch activities. Please check your connection and try again.";
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAnalysis = () => {
    if (!showAnalysis && logs.length === 0) {
      fetchLogs();
    }
    setShowAnalysis(!showAnalysis);
  };

  return (
    <Card className="mt-8 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Activity {showAnalysis ? 'Analysis' : 'Logs'}
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={fetchLogs}
            disabled={isLoading || !isConnected}
            variant={showAnalysis ? "outline" : "default"}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Get Logs'
            )}
          </Button>
          <Button
            onClick={toggleAnalysis}
            disabled={isLoading || !isConnected}
            variant={showAnalysis ? "default" : "outline"}
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            {showAnalysis ? 'Show Logs' : 'Show Analysis'}
          </Button>
        </div>
      </div>

      {showAnalysis ? (
        <ActivityAnalysis logs={logs} />
      ) : (
        <>
          {logs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Day</th>
                    <th className="px-4 py-2 text-left">Time</th>
                    <th className="px-4 py-2 text-left">Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr 
                      key={index} 
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-2">{log.date}</td>
                      <td className="px-4 py-2">{log.day}</td>
                      <td className="px-4 py-2">{log.time}</td>
                      <td className="px-4 py-2">{log.activity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && logs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No activities logged yet. Click "Get Logs" to fetch activities.
            </div>
          )}
        </>
      )}
    </Card>
  );
} 