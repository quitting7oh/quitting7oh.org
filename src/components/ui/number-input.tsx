import * as React from 'react';

import { Input } from '~/components/ui/input';

type InputProps = React.ComponentProps<typeof Input>;

interface NumberInputProps
  extends Omit<InputProps, 'defaultValue' | 'onChange' | 'type' | 'value'> {
  value: number;
  onValueChange: (value: number) => void;
  integer?: boolean;
  emptyWhenZero?: boolean;
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
  min,
  max,
  onBlur,
  onFocus,
  ...props
}: NumberInputProps) {
  const focused = React.useRef(false);
  const displayValue = React.useCallback(
    (next: number) => (emptyWhenZero && next === 0 ? '' : String(next)),
    [emptyWhenZero],
  );
  const [draft, setDraft] = React.useState(() => displayValue(value));

  React.useEffect(() => {
    if (!focused.current) setDraft(displayValue(value));
  }, [displayValue, value]);

  const parseDraft = (raw: string): number | null => {
    if (raw.trim() === '') return null;
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
        if (next !== null) onValueChange(next);
      }}
      onBlur={(event) => {
        focused.current = false;
        const next = parseDraft(event.target.value);
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
