import { useEffect, useRef, useState } from 'react';
import { Activity, Play, Square, Thermometer, HardDrive } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';

interface Stats {
  cpu: { usage: number; cores: number };
  memory: { pct: number };
  disk: { pct: number };
  load: [number, number, number];
  temp: number | null;
  network: { rx: number; tx: number };
  timestamp: number;
}

const WINDOW = 60;

function drawChart(canvas: HTMLCanvasElement, data: number[], color: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  // Grid
  ctx.strokeStyle = 'rgba(148,163,184,0.2)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = (height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  if (data.length < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = (i / (WINDOW - 1)) * width;
    const y = height - (Math.min(v, 100) / 100) * height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Fill under line
  ctx.lineTo(((data.length - 1) / (WINDOW - 1)) * width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = color + '22';
  ctx.fill();
}

export function SystemLiveMonitor() {
  const [running, setRunning] = useState(false);
  const [connected, setConnected] = useState(false);
  const [latest, setLatest] = useState<Stats | null>(null);
  const cpuRef = useRef<HTMLCanvasElement>(null);
  const memRef = useRef<HTMLCanvasElement>(null);
  const cpuData = useRef<number[]>([]);
  const memData = useRef<number[]>([]);
  const esRef = useRef<EventSource | null>(null);

  const start = () => {
    const token = localStorage.getItem('ocp_token');
    if (!token || esRef.current) return;
    const es = new EventSource(`/api/stats/stream?token=${encodeURIComponent(token)}`);
    es.onopen = () => { setConnected(true); setRunning(true); };
    es.onerror = () => { setConnected(false); };
    es.onmessage = (ev) => {
      try {
        const s: Stats = JSON.parse(ev.data);
        setLatest(s);
        cpuData.current.push(s.cpu.usage);
        memData.current.push(s.memory.pct);
        if (cpuData.current.length > WINDOW) cpuData.current.shift();
        if (memData.current.length > WINDOW) memData.current.shift();
        if (cpuRef.current) drawChart(cpuRef.current, cpuData.current, '#e8740c');
        if (memRef.current) drawChart(memRef.current, memData.current, '#27ae60');
      } catch { /* ignore parse errors */ }
    };
    esRef.current = es;
  };

  const stop = () => {
    esRef.current?.close();
    esRef.current = null;
    setRunning(false);
    setConnected(false);
  };

  useEffect(() => () => { esRef.current?.close(); esRef.current = null; }, []);

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Live Monitor</h1>
          <p className="page-subtitle">Real-time server metrics via SSE (1s interval)</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-sm ${connected ? 'text-green-600' : 'text-slate-400'}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-slate-300'}`} />
            {connected ? 'Live' : 'Stopped'}
          </span>
          {running ? (
            <button className="btn-x3-secondary btn-x3-sm flex items-center gap-1" onClick={stop}>
              <Square className="w-3.5 h-3.5" /> Stop
            </button>
          ) : (
            <button className="btn-x3-primary btn-x3-sm flex items-center gap-1" onClick={start}>
              <Play className="w-3.5 h-3.5" /> Start
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card><CardBody className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-xl"><Activity className="w-5 h-5 text-orange-600" /></div>
            <div><p className="text-sm text-slate-500">Load 1m / 5m</p>
              <p className="text-xl font-bold text-slate-900">{latest ? `${latest.load[0].toFixed(2)} / ${latest.load[1].toFixed(2)}` : '—'}</p></div>
          </div>
        </CardBody></Card>
        <Card><CardBody className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl"><Thermometer className="w-5 h-5 text-red-600" /></div>
            <div><p className="text-sm text-slate-500">Temperature</p>
              <p className="text-xl font-bold text-slate-900">{latest?.temp != null ? `${latest.temp}°C` : '—'}</p></div>
          </div>
        </CardBody></Card>
        <Card><CardBody className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl"><HardDrive className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-sm text-slate-500">Disk</p>
              <p className="text-xl font-bold text-slate-900">{latest ? `${latest.disk.pct}%` : '—'}</p></div>
          </div>
        </CardBody></Card>
        <Card><CardBody className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl"><Activity className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-sm text-slate-500">Network RX / TX</p>
              <p className="text-xl font-bold text-slate-900">{latest ? `${latest.network.rx} / ${latest.network.tx}` : '—'}</p></div>
          </div>
        </CardBody></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-slate-900">CPU Usage</h2>
              <span className="text-lg font-bold text-orange-600">{latest ? `${latest.cpu.usage}%` : '—'}</span>
            </div>
            <canvas ref={cpuRef} width={600} height={140} className="w-full h-[140px] bg-slate-50 rounded" />
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-slate-900">Memory Usage</h2>
              <span className="text-lg font-bold text-green-600">{latest ? `${latest.memory.pct}%` : '—'}</span>
            </div>
            <canvas ref={memRef} width={600} height={140} className="w-full h-[140px] bg-slate-50 rounded" />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
