export type ClientSignupPayload = {
  email: string;
  password: string;
  phone?: string | null;
  preferred_language?: "nl" | "fr" | "en";
  two_factor_enabled?: boolean;
};

export type ClientSignupResponse = {
  message: string;
  user: {
    id: number;
    email: string;
    role: string;
    phone: string | null;
    preferred_language: string;
    two_factor_enabled: boolean;
    created_at: string;
  };
};
