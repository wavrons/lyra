import { useState, useCallback } from 'react';
const LinkIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4" />
    <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 1 0 7.07 7.07L13 20" />
  </svg>
);
const LoaderIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </svg>
);
import { Button } from './Button';
import { Input } from './Input';
import { parseUrl, looksLikeUrl, normalizeUrl, type OGData } from '../lib/ogParse';

interface BoardPasteInputProps {
  /** Called with parsed OG data + the normalized URL when parsing succeeds */
  onParsed: (data: OGData & { raw_url: string }) => void;
  /** Called when the user submits a plain note (non-URL text) */
  onNote?: (text: string) => void;
  disabled?: boolean;
}

export function BoardPasteInput({ onParsed, onNote, disabled }: BoardPasteInputProps) {
  const [value, setValue] = useState('');
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (looksLikeUrl(trimmed)) {
      setParsing(true);
      setError('');
      try {
        const url = normalizeUrl(trimmed);
        const og = await parseUrl(url);
        onParsed({ ...og, raw_url: url });
        setValue('');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to parse URL';
        setError(msg);
      } finally {
        setParsing(false);
      }
    } else if (onNote) {
      onNote(trimmed);
      setValue('');
    }
  }, [value, onParsed, onNote]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text/plain').trim();
    if (text && looksLikeUrl(text)) {
      e.preventDefault();
      setValue(text);
      // Auto-parse on paste
      setParsing(true);
      setError('');
      try {
        const url = normalizeUrl(text);
        const og = await parseUrl(url);
        onParsed({ ...og, raw_url: url });
        setValue('');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to parse URL';
        setError(msg);
        setValue(text);
      } finally {
        setParsing(false);
      }
    }
  }, [onParsed]);

  return (
    <div className="board-paste-input">
      <div className="board-paste-input__row">
        <LinkIcon className="h-4 w-4 board-paste-input__icon" />
        <Input
          value={value}
          onChange={e => { setValue(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Paste a URL or type a note…"
          disabled={disabled || parsing}
          className="flex-1"
        />
        <Button
          size="sm"
          onClick={() => void handleSubmit()}
          disabled={disabled || parsing || !value.trim()}
        >
          {parsing ? <LoaderIcon className="h-4 w-4 animate-spin" /> : 'Add'}
        </Button>
      </div>
      {error && <p className="board-paste-input__error">{error}</p>}
    </div>
  );
}
