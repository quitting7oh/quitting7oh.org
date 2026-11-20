import * as React from 'react';

import { Input } from '~/components/ui/input';

type InputProps = React.ComponentProps<typeof Input>;

interface NumberInputProps
  extends Omit<InputProps, 'defaultValue' | 'onChange' | 'type' | 'value'> {
  value: number;
  onValueChange: (value: number) => void;
  integer?: boolean;
  emptyWhenZero?: boolean;
  /** Only commit on blur or Enter, not on every keystroke. For fields where a
   *  partial value ("1" on the way to "14") would do something drastic. */
  commitOnBlur?: boolean;
  /** Called with false while the text can't be used (blank or not a number). */
  onDraftValidityChange?: (valid: boolean) => void;
}

function finiteConstraint(value: string | number | undefined): number | null {
  if (value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Keep the user's in-progress text separate from the last usable number.
 * Clearing the field therefore stays blank while they type instead of
 * immediately snapping to 0 or the minimum value.
 */
export function NumberInput({
  value,
  onValueChange,
  integer = false,
  emptyWhenZero = false,
  commitOnBlur = false,
  onDraftValidityChange,
  min,
  max,
  onBlur,
  onFocus,
  onKeyDown,
  ...props
}: NumberInputProps) {
  const focused = React.useRef(false);
  const displayValue = React.useCallback(
    (next: number) => (emptyWhenZero && next === 0 ? '' : String(next)),
    [emptyWhenZero],
  );
  const [draft, setDraft] = React.useState(() => displayValue(value));

  // A field that unmounts mid-edit shouldn't leave its parent thinking a
  // value is still unfinished.
  React.useEffect(() => () => onDraftValidityChange?.(true), []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!focused.current) setDraft(displayValue(value));
  }, [displayValue, value]);

  const parseDraft = (raw: string): number | null => {
    // A field that shows 0 as blank treats blank as 0, not as unfinished.
    if (raw.trim() === '') return emptyWhenZero ? 0 : null;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return null;

    let next = integer ? Math.trunc(parsed) : parsed;
    const minimum = finiteConstraint(min);
    const maximum = finiteConstraint(max);
    if (minimum !== null) next = Math.max(minimum, next);
    if (maximum !== null) next = Math.min(maximum, next);
    return next;
  };

  return (
    <Input
      {...props}
      type="number"
      min={min}
      max={max}
      value={draft}
      onFocus={(event) => {
        focused.current = true;
        onFocus?.(event);
      }}
      onChange={(event) => {
        const raw = event.target.value;
        setDraft(raw);
        const next = parseDraft(raw);
        onDraftValidityChange?.(next !== null);
        if (next !== null && !commitOnBlur) onValueChange(next);
      }}
      onKeyDown={(event) => {
        if (commitOnBlur && event.key === 'Enter') {
          const next = parseDraft(event.currentTarget.value);
          if (next !== null) {
            onValueChange(next);
            setDraft(displayValue(next));
          }
        }
        onKeyDown?.(event);
      }}
      onBlur={(event) => {
        focused.current = false;
        // Leaving the field without editing commits nothing. Otherwise a
        // displayed value outside min/max would be clamped and sent back.
        if (event.target.value === displayValue(value)) {
          onDraftValidityChange?.(true);
          onBlur?.(event);
          return;
        }
        const next = parseDraft(event.target.value);
        onDraftValidityChange?.(true);
        if (next === null) {
          setDraft(displayValue(value));
        } else {
          onValueChange(next);
          setDraft(displayValue(next));
        }
        onBlur?.(event);
      }}
    />
  );
}
