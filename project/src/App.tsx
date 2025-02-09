import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ClipboardList, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';

const API_URL = 'http://localhost:8000';

function App() {
  const [currentActivity, setCurrentActivity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const { toast } = useToast();

  // Check if backend is accessible
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${API_URL}/health`);
        setIsConnected(response.ok);
      } catch (error) {
        setIsConnected(false);
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Cannot connect to the server. Please make sure the backend is running.",
        });
      }
    };

    checkConnection();
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentActivity.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an activity",
      });
      return;
    }

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
      const response = await fetch(`${API_URL}/api/log-activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activity: currentActivity }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to save activity');
      }

      toast({
        title: "Success",
        description: "Activity logged successfully",
      });
      
      setCurrentActivity('');
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to save activity. Please check your connection and try again.";
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      console.error('Error saving activity:', error);
      
      // Update connection status if it's a network error
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setIsConnected(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <ClipboardList className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Logger</h1>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="mb-4 p-4 bg-destructive/15 text-destructive rounded-md">
            Cannot connect to the server. Please make sure the backend is running.
          </div>
        )}

        {/* Input Form */}
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={currentActivity}
              onChange={(e) => setCurrentActivity(e.target.value)}
              placeholder="What are you working on?"
              className="flex-1"
              disabled={isLoading || !isConnected}
            />
            <Button 
              type="submit" 
              disabled={isLoading || !isConnected}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Log
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}

export default App;