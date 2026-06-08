export function toClickHouseDateTime64(date: Date) {
  return date.toISOString().replace('T', ' ').replace('Z', '');
}

export function clickHouseDateTimeToISO(value: string) {
  return value.replace(' ', 'T') + 'Z';
}
