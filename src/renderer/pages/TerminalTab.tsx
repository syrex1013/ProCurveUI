import React, { useState, useRef, useEffect } from 'react';

interface Entry {
  type: 'input' | 'output' | 'error';
  text: string;
  ts: string;
}

export default function TerminalTab() {
  const [history, setHistory] = useState<Entry[]>([
    { type: 'output', text: 'ProCurve Manager — SSH Terminal\nType commands to execute on the switch. Use "help" to see available commands.', ts: '' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const ts = () => new Date().toLocaleTimeString('en-US', { hour12: false });

  const run = async () => {
    const cmd = input.trim();
    if (!cmd) return;

    setHistory(h => [...h, { type: 'input', text: cmd, ts: ts() }]);
    setCmdHistory(h => [cmd, ...h.slice(0, 49)]);
    setHistoryIdx(-1);
    setInput('');
    setLoading(true);

    try {
      const result = await window.ipc.sshExecute(cmd);
      setHistory(h => [...h, { type: 'output', text: result || '(no output)', ts: ts() }]);
    } catch (e: any) {
      setHistory(h => [...h, { type: 'error', text: String(e), ts: ts() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { run(); return; }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = Math.min(historyIdx + 1, cmdHistory.length - 1);
      setHistoryIdx(idx);
      if (cmdHistory[idx] !== undefined) setInput(cmdHistory[idx]);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(idx);
      setInput(idx === -1 ? '' : cmdHistory[idx]);
    }
    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
    }
  };

  const entryColor = (type: Entry['type']) =>
    type === 'input' ? '#60a5fa' : type === 'error' ? '#fca5a5' : '#e5e7eb';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Geist Mono, monospace', fontSize: '13px' }} onClick={() => inputRef.current?.focus()}>
      {/* Output */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
        {history.map((entry, i) => (
          <div key={i} style={{ marginBottom: entry.type === 'input' ? 2 : 12, lineHeight: 1.5 }}>
            {entry.type === 'input' ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                {entry.ts && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', flexShrink: 0 }}>{entry.ts}</span>}
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>switch#</span>
                <span style={{ color: '#60a5fa' }}>{entry.text}</span>
              </div>
            ) : (
              <pre style={{ margin: 0, color: entryColor(entry.type), whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '12px' }}>
                {entry.text}
              </pre>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'rgba(255,255,255,0.4)' }}>
            <span style={{ animation: 'pulse 1s infinite' }}>⏳</span>
            <span style={{ fontSize: '12px' }}>Executing…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 10, alignItems: 'center', backgroundColor: '#1f2228' }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0, fontSize: '12px' }}>switch#</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
          placeholder="Enter command (↑↓ for history, Ctrl+L to clear)"
          autoFocus
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#60a5fa',
            fontFamily: 'Geist Mono, monospace',
            fontSize: '13px',
          }}
        />
        <button
          onClick={run}
          disabled={loading || !input.trim()}
          style={{
            padding: '4px 14px',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff',
            fontFamily: 'Geist Mono, monospace',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.4 : 1,
            borderRadius: 0,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Run
        </button>
        <button
          onClick={() => setHistory([])}
          style={{
            padding: '4px 10px',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'Geist Mono, monospace',
            fontSize: '10px',
            cursor: 'pointer',
            borderRadius: 0,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
          title="Clear (Ctrl+L)"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
