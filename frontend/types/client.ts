export type ClientSignupPayload = {
  full_name: string;
  email: string;
  password: string;
};

export type ClientSignupResponse = {
  id: number;
  email: string;
};