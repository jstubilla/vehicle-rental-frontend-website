/** Philippine mobile number: 09XXXXXXXXX or +639XXXXXXXXX. Spaces and dashes are ignored. */
export function isPhMobile(value: string): boolean {
  return /^(?:\+63|0)9\d{9}$/.test(value.replace(/[\s-]/g, ""));
}
