export type AuthUser = {
  id: string;
  email: string;
  name: string;
  labels: string[];
  isAdmin: boolean;
  emailVerification: boolean;
};

export type AuthResult = {
  ok: boolean;
  message?: string;
  user?: AuthUser;
};
