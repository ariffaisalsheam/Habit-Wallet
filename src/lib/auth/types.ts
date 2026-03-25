export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthResult = {
  ok: boolean;
  message?: string;
  user?: AuthUser;
};
