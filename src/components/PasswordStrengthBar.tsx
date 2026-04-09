function getStrength(password: string): { label: string; percent: number; color: string } {
  if (!password) return { label: '', percent: 0, color: '' };
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const variety = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;

  if (password.length < 8 || variety < 2) {
    return { label: 'Weak', percent: 33, color: '#E24B4A' };
  }
  if (variety >= 4 && password.length >= 8) {
    return { label: 'Strong', percent: 100, color: '#1D9E75' };
  }
  return { label: 'Medium', percent: 66, color: '#EF9F27' };
}

export default function PasswordStrengthBar({ password }: { password: string }) {
  const { label, percent, color } = getStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <p className="font-body text-xs mt-1" style={{ color }}>{label}</p>
    </div>
  );
}
