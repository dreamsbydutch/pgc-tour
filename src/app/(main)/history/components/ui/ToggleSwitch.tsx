/**
 * Reusable Toggle Switch Component
 * Used for filtering options like "Friends Only" and "Adjusted" toggles
 */

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  id,
}: ToggleSwitchProps) {
  return (
    <label className="flex cursor-pointer items-center" htmlFor={id}>
      <div className="relative">
        <input
          id={id}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="peer-focus:ring-3 h-4 w-7 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-blue-300"></div>
      </div>
      <span className="mx-2 text-2xs">{label}</span>
    </label>
  );
}
