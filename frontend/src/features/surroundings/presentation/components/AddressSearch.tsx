import { useCallback, useRef, useState } from "react";
import { useAddressAutocomplete } from "../hooks/useAddressAutocomplete";

interface AddressSearchProps {
  onSelect: (address: string) => void;
}

export function AddressSearch({ onSelect }: AddressSearchProps) {
  const { setQuery, suggestions } = useAddressAutocomplete();
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleInput = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setQuery(value), 250);
      setIsOpen(true);
    },
    [setQuery],
  );

  const handleSelect = useCallback(
    (address: string) => {
      if (inputRef.current) inputRef.current.value = address;
      setIsOpen(false);
      onSelect(address);
    },
    [onSelect],
  );

  return (
    <div className="relative">
      <label htmlFor="address-search" className="mb-1.5 block text-sm font-medium">
        Adresse
      </label>
      <input
        ref={inputRef}
        id="address-search"
        type="text"
        placeholder="Søg efter adresse..."
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm transition-colors duration-200 placeholder:text-muted-foreground hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
      />
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-card shadow-lg">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onMouseDown={() => handleSelect(suggestion)}
                className="w-full cursor-pointer px-3 py-2 text-left text-sm transition-colors duration-100 hover:bg-secondary"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
