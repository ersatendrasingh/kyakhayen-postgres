import { NewPasswordForm } from "@/components/auth/new-password-form";

type NewPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

const NewPasswordPage = async ({ searchParams }: NewPasswordPageProps) => {
  const { token } = await searchParams;

  return <NewPasswordForm token={token} />;
};

export default NewPasswordPage;
