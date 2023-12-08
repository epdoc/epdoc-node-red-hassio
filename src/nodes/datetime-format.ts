/**
 * Better DateTimeFormatOptions types
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat for representation details
 */
export interface DateTimeFormatOptions extends Intl.DateTimeFormatOptions {
  fractionalSecondDigits?: 0 | 1 | 2 | 3;
}

const fallbackLocale = 'en-US';
const defaultLocale = Intl?.DateTimeFormat()?.resolvedOptions()?.locale;
const defaultOptions: DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric'
};

export function formatDate({
  date = new Date(),
  locale = defaultLocale ?? fallbackLocale,
  options = defaultOptions
}): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}
