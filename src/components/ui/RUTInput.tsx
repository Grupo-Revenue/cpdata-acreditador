import { forwardRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { formatRUT, cleanRUT, validateRUT } from '@/lib/rut';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface RUTInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string) => void;
  onValidation?: (isValid: boolean, error?: string) => void;
  showValidation?: boolean;
}

export const RUTInput = forwardRef<HTMLInputElement, RUTInputProps>(
  ({ value = '', onChange, onValidation, showValidation = true, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [touched, setTouched] = useState(false);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const cleaned = cleanRUT(inputValue);
      
      // Limitar a 9 caracteres (8 dígitos + 1 DV)
      if (cleaned.length > 9) return;
      
      // Formatear y enviar
      const formatted = formatRUT(cleaned);
      onChange?.(formatted);

      // Validar si tiene suficientes caracteres
      if (cleaned.length >= 2) {
        const { isValid, error } = validateRUT(cleaned);
        onValidation?.(isValid, error);
      }
    }, [onChange, onValidation]);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
      setTouched(true);
      
      if (value) {
        const { isValid, error } = validateRUT(value);
        onValidation?.(isValid, error);
      }
    }, [value, onValidation]);

    const getValidationState = () => {
      if (!touched || !value || value.length < 2) return null;
      const { isValid } = validateRUT(value);
      return isValid;
    };

    const validationState = getValidationState();

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder="12.345.678-9"
          className={cn(
            'pr-10',
            validationState === true && 'border-success focus-visible:ring-success',
            validationState === false && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          {...props}
        />
        {showValidation && touched && validationState !== null && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {validationState ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <X className="w-4 h-4 text-destructive" />
            )}
          </div>
        )}
      </div>
    );
  }
);

RUTInput.displayName = 'RUTInput';
