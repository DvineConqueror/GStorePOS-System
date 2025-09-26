export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  if (!password) {
    return {
      isValid: false,
      errors: ['Password is required'],
      strength: 'weak'
    };
  }

  if (password.length < 8) {
    errors.push('At least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Contains uppercase letter (A-Z)');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Contains lowercase letter (a-z)');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Contains number (0-9)');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Contains special character (!@#$%^&*)');
  }

  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  const criteriaMet = 5 - errors.length;
  
  if (criteriaMet >= 4) {
    strength = 'strong';
  } else if (criteriaMet >= 2) {
    strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'text-red-500';
    case 'medium':
      return 'text-yellow-500';
    case 'strong':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
}
