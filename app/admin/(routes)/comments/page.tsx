import { redirect } from "next/navigation";

const CommentsPage = () => redirect("/admin/community?tab=comments");

export default CommentsPage;
