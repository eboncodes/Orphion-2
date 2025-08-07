// Bengali Unicode range: 0980-09FF
const BENGALI_UNICODE_RANGE = /[\u0980-\u09FF]/

// Function to detect if text contains Bengali characters
export const containsBengali = (text: string): boolean => {
  const hasBengali = BENGALI_UNICODE_RANGE.test(text)
  if (hasBengali) {
    console.log('Bengali text detected:', text.substring(0, 50))
  }
  return hasBengali
}

// Function to get appropriate font class for text
export const getFontClass = (text: string): string => {
  if (containsBengali(text)) {
    console.log('Applying font-bangla class to text')
    return 'font-bangla'
  }
  return ''
}

// Function to wrap text with appropriate font styling
export const wrapWithFont = (text: string, className: string = ''): string => {
  if (containsBengali(text)) {
    return `<span class="font-bangla ${className}">${text}</span>`
  }
  return text
} 