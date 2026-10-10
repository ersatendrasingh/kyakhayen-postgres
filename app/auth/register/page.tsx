import { RegisterForm } from "@/components/auth/register-form";

type RegisterPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

const RegisterPage = async ({ searchParams }: RegisterPageProps) => {
  const { callbackUrl } = await searchParams;

  return <RegisterForm callbackUrl={callbackUrl} />;
};

export default RegisterPage;
