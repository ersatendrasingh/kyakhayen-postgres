import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

function authErrorMessage(error?: string) {
  if (error === "OAuthAccountNotLinked") {
    return "We could not connect this Google sign-in to your existing account. Please try again or contact support.";
  }

  if (error === "AccountSuspended") {
    return "Your account is temporarily suspended. Please contact support.";
  }

  return "";
}

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const params = await searchParams;

  return (
    <LoginForm
      callbackUrl={params.callbackUrl}
      urlError={authErrorMessage(params.error)}
    />
  );
};

export default LoginPage;
