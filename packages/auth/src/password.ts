export const PASSWORD_MIN_LENGTH = 8;

export type PasswordChecks = {
  letter: boolean;
  number: boolean;
  symbol: boolean;
  length: boolean;
};

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    letter: /\p{L}/u.test(password),
    number: /\p{N}/u.test(password),
    symbol: /[^\p{L}\p{N}\s]/u.test(password),
    length: password.length >= PASSWORD_MIN_LENGTH,
  };
}

export function isPasswordStrong(password: string) {
  const checks = getPasswordChecks(password);
  return checks.letter && checks.number && checks.symbol && checks.length;
}

export const PASSWORD_WEAK_MESSAGE =
  "A senha precisa ter letra, número e símbolo, com pelo menos 8 caracteres.";
