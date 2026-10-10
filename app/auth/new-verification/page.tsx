import { NewVerificationForm } from "@/components/auth/new-verification-form";

type NewVerificationPageProps = {
  searchParams: Promise<{ token?: string }>;
};

const NewVerificationPage = async ({
  searchParams,
}: NewVerificationPageProps) => {
  const { token } = await searchParams;

  return <NewVerificationForm token={token} />;
};

export default NewVerificationPage;
