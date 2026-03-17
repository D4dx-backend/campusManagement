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
  // Middle East (prioritized)
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+962', country: 'Jordan', flag: '🇯🇴' },
  { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
  { code: '+963', country: 'Syria', flag: '🇸🇾' },
  { code: '+964', country: 'Iraq', flag: '🇮🇶' },
  { code: '+967', country: 'Yemen', flag: '🇾🇪' },
  { code: '+970', country: 'Palestine', flag: '🇵🇸' },
  { code: '+972', country: 'Israel', flag: '🇮🇱' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+98', country: 'Iran', flag: '🇮🇷' },
  // South Asia
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+95', country: 'Myanmar', flag: '🇲🇲' },
  // East & Southeast Asia
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  // North America
  { code: '+1', country: 'US/Canada', flag: '🇺🇸' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  // Europe
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+47', country: 'Norway', flag: '🇳🇴' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰' },
  { code: '+358', country: 'Finland', flag: '🇫🇮' },
  { code: '+48', country: 'Poland', flag: '🇵🇱' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+30', country: 'Greece', flag: '🇬🇷' },
  { code: '+380', country: 'Ukraine', flag: '🇺🇦' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  // Africa
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+212', country: 'Morocco', flag: '🇲🇦' },
  { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
  { code: '+213', country: 'Algeria', flag: '🇩🇿' },
  { code: '+249', country: 'Sudan', flag: '🇸🇩' },
  { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
  // Oceania
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  // South America
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
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