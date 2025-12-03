import { useState, useCallback } from 'react';
import { Play, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { taskRunnerService } from '../services/taskRunnerService';
import { AgentChatter } from './AgentChatter';
import { useChatterSubscription } from '../hooks/useChatterSubscription';

interface ChatterMessage {
  id: string;
  timestamp: string;
  source: string;
  detailType: string;
  detail: any;
}

export function TaskRunner() {
  const [taskDetails, setTaskDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orchestrationId: string; message: string } | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [chatterMessages, setChatterMessages] = useState<ChatterMessage[]>([]);

  const handleChatterMessage = useCallback((message: ChatterMessage) => {
    setChatterMessages((prev) => [...prev, message]);
  }, []);

  // Subscribe to chatter when a task is active
  useChatterSubscription(handleChatterMessage, isSubscribed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskDetails.trim()) {
      setError('Please enter task details');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await taskRunnerService.submitTask({
        taskDetails: taskDetails.trim(),
      });

      if (response.success) {
        setSuccess({
          orchestrationId: response.orchestrationId,
          message: response.message || 'Task submitted successfully',
        });
        setTaskDetails(''); // Clear the form
        setIsSubscribed(true); // Start listening to chatter
        setChatterMessages([]); // Clear previous messages
      } else {
        setError(response.message || 'Failed to submit task');
      }
    } catch (err: any) {
      console.error('Failed to submit task:', err);
      setError(err.message || 'Failed to submit task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1319] p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Task Runner</h2>
        <p className="text-[#9ca3af] text-sm">
          Submit tasks to the Supervisor agent for orchestration and execution
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="flex gap-6 mb-6">
        {/* Left Column - Task Submission */}
        <div className="flex-1 space-y-6" style={{ minWidth: '400px', maxWidth: '600px' }}>
          <Card className="bg-[#1a1f2e] border-[#2a3142]">
            <CardHeader>
              <CardTitle className="text-white">Submit New Task</CardTitle>
              <CardDescription className="text-[#9ca3af]">
                Describe the task you want the AI agents to perform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="taskDetails" className="block text-sm font-medium text-white mb-2">
                    Task Details *
                  </label>
                  <textarea
                    id="taskDetails"
                    value={taskDetails}
                    onChange={(e) => setTaskDetails(e.target.value)}
                    placeholder="Describe what you want the agents to do..."
                    className="w-full min-h-[200px] px-4 py-3 bg-[#0f1319] border border-[#2a3142] rounded-lg text-white placeholder:text-[#6b7280] focus:border-[#f90] focus:ring-1 focus:ring-[#f90] focus:outline-none resize-y"
                    disabled={loading}
                  />
                  <p className="mt-2 text-xs text-[#6b7280]">
                    Be specific about what you want to achieve
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-medium">Error</p>
                      <p className="text-red-300 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading || !taskDetails.trim()}
                    className="bg-white text-[#0f1319] hover:bg-[#f2f3f3] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0f1319] mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Submit Task
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-[#1a1f2e] border-[#2a3142]">
            <CardHeader>
              <CardTitle className="text-white text-base">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[#9ca3af]">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#f90]/20 text-[#f90] flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="text-white font-medium">Task Submission</p>
                  <p className="text-xs mt-1">Your task is sent to the Supervisor agent via EventBridge</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#f90]/20 text-[#f90] flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="text-white font-medium">Task Analysis</p>
                  <p className="text-xs mt-1">The Supervisor analyzes the task and determines which agents are needed</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#f90]/20 text-[#f90] flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="text-white font-medium">Agent Orchestration</p>
                  <p className="text-xs mt-1">The Supervisor coordinates multiple agents to complete the task</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#f90]/20 text-[#f90] flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <div>
                  <p className="text-white font-medium">Results</p>
                  <p className="text-xs mt-1">You'll receive updates as the task progresses and completes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Message Bus Display */}
        <div className="flex-1">
          <AgentChatter isActive={isSubscribed} messages={chatterMessages} />
        </div>
      </div>

      {/* Supervisor Response Section - Full Width Below */}
      {success && (
        <div className="mt-6">
          <Card className="bg-[#1a1f2e] border-[#2a3142]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Supervisor Response
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-green-400 font-medium">Task Submitted Successfully</p>
                  <p className="text-green-300 text-sm mt-1">{success.message}</p>
                  <div className="mt-3 p-3 bg-[#0f1319] rounded border border-[#2a3142]">
                    <p className="text-xs text-[#6b7280] mb-1">Orchestration ID:</p>
                    <p className="text-sm text-white font-mono">{success.orchestrationId}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
