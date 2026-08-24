import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Send, X, Terminal as TerminalIcon, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';

interface TerminalOutput {
  output: string;
  timestamp: string;
}

export function SystemTerminal() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<TerminalOutput[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const executeMutation = useMutation({
    mutationFn: (cmd: string) => api.post('/api/system/terminal', { command: cmd }),
    onSuccess: (response) => {
      setHistory((prev) => [
        ...prev,
        { output: `$ ${command}`, timestamp: new Date().toISOString() },
        { output: response.data.output || 'Command executed (no output)', timestamp: new Date().toISOString() },
      ]);
      setCommand('');
    },
    onError: (err: any) => {
      setHistory((prev) => [
        ...prev,
        { output: `$ ${command}`, timestamp: new Date().toISOString() },
        { output: `Error: ${err.response?.data?.error || 'Command failed'}`, timestamp: new Date().toISOString() },
      ]);
      setCommand('');
    },
    onSettled: () => setIsExecuting(false),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isExecuting) return;
    setIsExecuting(true);
    executeMutation.mutate(command);
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
    inputRef.current?.focus();
  }, [history]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Terminal</h1>
        <p className="page-subtitle">Execute shell commands on the server</p>
      </div>

      <Card>
        <CardHeader title="Server Terminal" subtitle="Type commands and press Enter" />
        <CardBody className="p-0">
          <div
            ref={terminalRef}
            className="h-96 bg-slate-900 text-green-400 font-mono text-sm p-4 overflow-y-auto"
          >
            {history.length === 0 && (
              <div className="text-slate-500">
                <p>OCP Panel Terminal</p>
                <p>Type commands to execute on the server.</p>
                <p className="mt-2">Examples: <code className="text-green-300">ls -la</code>, <code className="text-green-300">df -h</code>, <code className="text-green-300">free -h</code></p>
              </div>
            )}
            {history.map((item, index) => (
              <div key={index} className="whitespace-pre-wrap break-all">
                {item.output}
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 p-4 bg-slate-50">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <span className="text-green-400 font-mono mr-2 select-none">$</span>
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="flex-1 bg-slate-900 text-green-400 border-none rounded px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter command..."
                disabled={isExecuting}
                autoFocus
              />
              <button
                type="submit"
                className="btn-x3-primary"
                disabled={isExecuting || !command.trim()}
              >
                {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
              <button
                type="button"
                className="btn-x3-secondary btn-x3-sm"
                onClick={() => setHistory([])}
              >
                Clear
              </button>
            </form>
            <p className="text-xs text-slate-500 mt-2">
              Commands run with limited privileges. Use <code className="bg-slate-100 px-1 py-0.5 rounded">sudo</code> for admin commands if permitted.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}