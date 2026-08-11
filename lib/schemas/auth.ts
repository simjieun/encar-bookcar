import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상 입력해 주세요.")
  .max(128, "비밀번호는 128자 이하로 입력해 주세요.")
  .regex(/[A-Za-z]/, "영문을 하나 이상 포함해 주세요.")
  .regex(/[0-9]/, "숫자를 하나 이상 포함해 주세요.");

export const loginSchema = z.object({
  email: z.email("이메일 형식을 확인해 주세요."),
  password: z.string().min(1, "비밀번호를 입력해 주세요."),
});

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "이름은 2자 이상 입력해 주세요.")
      .max(30, "이름은 30자 이하로 입력해 주세요."),
    email: z.email("이메일 형식을 확인해 주세요."),
    password: passwordSchema,
    passwordConfirm: z.string().min(1, "비밀번호를 한 번 더 입력해 주세요."),
  })
  .refine((values) => values.password === values.passwordConfirm, {
    message: "비밀번호가 서로 달라요.",
    path: ["passwordConfirm"],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;

export function isAllowedEmailDomain(email: string) {
  const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);

  if (allowedDomains.length === 0) {
    return true;
  }

  const domain = email.split("@").at(-1)?.toLowerCase();
  return Boolean(domain && allowedDomains.includes(domain));
}

export function getSafeReturnTo(value: string | null, fallback = "/profile") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}
