import { Minus, Plus, Trash2 } from 'lucide-react';

/** Compact quantity stepper used on product, cart and checkout pages. */
export default function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  disabled = false,
  size = 'md',
}) {
  const small = size === 'sm';
  const buttonClass = small
    ? 'grid h-7 w-7 place-items-center rounded-lg text-navy-600 hover:bg-navy-100 disabled:opacity-40'
    : 'grid h-9 w-9 place-items-center rounded-xl text-navy-600 hover:bg-navy-100 disabled:opacity-40';

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-xl border border-line bg-white ${
        small ? 'p-0.5' : 'p-1'
      }`}
    >
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className={small ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </button>
      <span
        className={`min-w-[2rem] text-center font-bold text-navy-900 ${
          small ? 'text-sm' : 'text-base'
        }`}
      >
        {value}
      </span>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus className={small ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </button>
    </div>
  );
}
