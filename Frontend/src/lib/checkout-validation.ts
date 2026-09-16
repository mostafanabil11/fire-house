export function validEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) && value.trim().length <= 200; }
export function validPhone(value: string) { return /^[+\d\s()\-\u0660-\u0669\u06f0-\u06f9]{6,30}$/.test(value.trim()); }
