import React from 'react';

interface InputFieldProps {
  id: string;
  label: string;
  extra?: string;
  placeholder: string;
  variant?: string;
  state?: string;
  disabled?: boolean;
  type?: string;
  value: string | number;  // Accept both string and number types for value
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // Ensuring onChange handles input change correctly
  required?: boolean; // Added required prop
  min?: string; // Added min prop for number fields
  step?: string; // Added step prop for number fields
}

function InputField({
  label,
  id,
  extra,
  type = 'text', // Default type is 'text' if not provided
  placeholder,
  variant,
  state,
  disabled,
  value,
  onChange,
  required,
  min,
  step,
}: InputFieldProps) {
  return (
    <div className={`${extra}`}>
      <label
        htmlFor={id}
        className={`text-sm text-navy-700 dark:text-white ${
          variant === 'auth' ? 'ml-1.5 font-medium' : 'ml-3 font-bold'
        }`}
      >
        {label}
      </label>
      <input
        onChange={onChange}
        disabled={disabled}
        type={type}
        id={id}
        placeholder={placeholder}
        value={value} // Bind the value prop
        required={required} // Pass the required prop to the input
        min={min} // Pass the min prop to the input
        step={step} // Pass the step prop to the input
        className={`mt-2 flex h-12 w-full items-center justify-center rounded-xl border bg-white/0 p-3 text-sm outline-none ${
          disabled
            ? '!border-none !bg-gray-100 dark:!bg-white/5 dark:placeholder:!text-[rgba(255,255,255,0.15)]'
            : state === 'error'
            ? 'border-red-500 text-red-500 placeholder:text-red-500 dark:!border-red-400 dark:!text-red-400 dark:placeholder:!text-red-400'
            : state === 'success'
            ? 'border-green-500 text-green-500 placeholder:text-green-500 dark:!border-green-400 dark:!text-green-400 dark:placeholder:!text-green-400'
            : 'border-gray-200 dark:!border-white/10 dark:text-white'
        }`}
      />
    </div>
  );
}

export default InputField;