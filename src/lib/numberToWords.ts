// Number to Words converter for Nepal Rupee (NPR) Bills

const units = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function convertTwoDigits(num: number): string {
  if (num === 0) return '';
  if (num < 20) return units[num];
  const ten = Math.floor(num / 10);
  const unit = num % 10;
  return `${tens[ten]}${unit !== 0 ? ' ' + units[unit] : ''}`;
}

function convertThreeDigits(num: number): string {
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;
  let result = '';
  if (hundred > 0) {
    result += `${units[hundred]} Hundred`;
    if (remainder > 0) result += ' ';
  }
  if (remainder > 0) {
    result += convertTwoDigits(remainder);
  }
  return result;
}

/**
 * Converts a numeric amount to words in South Asian numbering format (Lakhs, Crores)
 * Example: 14916 -> "Fourteen Thousand Nine Hundred Sixteen Rupees Only"
 */
export function numberToWords(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Zero Rupees Only';

  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));

  const crore = Math.floor(absAmount / 10000000);
  const lakh = Math.floor((absAmount % 10000000) / 100000);
  const thousand = Math.floor((absAmount % 100000) / 1000);
  const remainder = absAmount % 1000;

  const parts: string[] = [];

  if (crore > 0) {
    parts.push(`${convertTwoDigits(crore)} Crore`);
  }
  if (lakh > 0) {
    parts.push(`${convertTwoDigits(lakh)} Lakh`);
  }
  if (thousand > 0) {
    parts.push(`${convertTwoDigits(thousand)} Thousand`);
  }
  if (remainder > 0) {
    parts.push(convertThreeDigits(remainder));
  }

  const words = parts.join(' ');
  return `${isNegative ? 'Minus ' : ''}${words} Rupees Only`;
}
