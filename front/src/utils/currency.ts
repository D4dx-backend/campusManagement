export const DEFAULT_CURRENCY_CODE = 'BHD';

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const TEENS = [
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const convertNumberToWords = (value: number): string => {
  if (value === 0) return '';
  if (value < 10) return ONES[value];
  if (value < 20) return TEENS[value - 10];
  if (value < 100) return `${TENS[Math.floor(value / 10)]} ${ONES[value % 10]}`.trim();
  if (value < 1000) {
    return `${ONES[Math.floor(value / 100)]} Hundred ${convertNumberToWords(value % 100)}`.trim();
  }
  if (value < 100000) {
    return `${convertNumberToWords(Math.floor(value / 1000))} Thousand ${convertNumberToWords(value % 1000)}`.trim();
  }
  if (value < 10000000) {
    return `${convertNumberToWords(Math.floor(value / 100000))} Lakh ${convertNumberToWords(value % 100000)}`.trim();
  }

  return `${convertNumberToWords(Math.floor(value / 10000000))} Crore ${convertNumberToWords(value % 10000000)}`.trim();
};

export const formatCurrencyAmount = (
  amount: number | string | undefined | null,
  currencyLabel: string = DEFAULT_CURRENCY_CODE
) => `${currencyLabel} ${Number(amount || 0).toFixed(3)}`;

export const amountToWords = (
  amount: number | string | undefined | null,
  currencyCode: string = DEFAULT_CURRENCY_CODE
) => {
  const numericAmount = Math.abs(Number(amount || 0));
  const wholePart = Math.floor(numericAmount);
  const fractionPart = Math.round((numericAmount - wholePart) * 1000);
  const wholeWords = wholePart === 0 ? 'Zero' : convertNumberToWords(wholePart);

  let words = `${wholeWords} ${currencyCode}`.trim();
  if (fractionPart > 0) {
    words += ` and ${fractionPart.toString().padStart(3, '0')}/1000`;
  }

  return `${Number(amount || 0) < 0 ? 'Minus ' : ''}${words} Only`;
};