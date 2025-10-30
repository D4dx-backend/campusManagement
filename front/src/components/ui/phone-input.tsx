import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

const countryCodes = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
];

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = "Enter phone number",
  required = false,
  id
}) => {
  // Parse existing value to extract country code and number
  const parsePhoneValue = (phoneValue: string) => {
    if (!phoneValue) return { countryCode: '+91', number: '' };
    
    // Find matching country code
    const matchedCode = countryCodes.find(cc => phoneValue.startsWith(cc.code));
    if (matchedCode) {
      return {
        countryCode: matchedCode.code,
        number: phoneValue.substring(matchedCode.code.length).trim()
      };
    }
    
    // Default to +91 if no match found
    return { countryCode: '+91', number: phoneValue };
  };

  const { countryCode: initialCountryCode, number: initialNumber } = parsePhoneValue(value);
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [number, setNumber] = useState(initialNumber);

  const handleCountryCodeChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode);
    onChange(`${newCountryCode}${number}`);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.replace(/[^\d]/g, ''); // Only allow digits
    setNumber(newNumber);
    onChange(`${countryCode}${newNumber}`);
  };

  return (
    <div className="flex gap-2">
      <Select value={countryCode} onValueChange={handleCountryCodeChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {countryCodes.map((cc) => (
            <SelectItem key={cc.code} value={cc.code}>
              <span className="flex items-center gap-2">
                <span>{cc.flag}</span>
                <span>{cc.code}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        type="tel"
        value={number}
        onChange={handleNumberChange}
        placeholder={placeholder}
        required={required}
        className="flex-1"
      />
    </div>
  );
};