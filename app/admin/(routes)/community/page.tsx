import { CommunityDashboard } from "@/components/admin/community/community-dashboard";
import { db } from "@/lib/db";

const CommunityPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) => {
  const { tab } = await searchParams;
  const [comments, reviews] = await Promise.all([
    db.comment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        recipe: { select: { id: true, title: true } },
        Post: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.review.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        recipe: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <CommunityDashboard
        comments={comments}
        reviews={reviews}
        initialType={tab === "comments" ? "comment" : tab === "reviews" ? "review" : "all"}
      />
    </div>
  );
};

export default CommunityPage;
