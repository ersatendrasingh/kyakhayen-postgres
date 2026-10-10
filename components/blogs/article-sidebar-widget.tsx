import Link from "next/link";

interface ArticleSidebarWidgetProps {
  title: string;
  type: string | "category";
  widgetItems?: {
    id: string;
    name?: string;
    title?: string;
    slug: string;
    imageUrl: string | null;
  }[];
}

const ArticleSidebarWidget = ({
  title,
  type,
  widgetItems,
}: ArticleSidebarWidgetProps) => {
  return (
    <div className="bg-white p-4 right-0 border-2 rounded-md transition shadow-md mb-6">
      <h3 className="text-lg text-websecondary font-semibold mb-2">{title}</h3>
      <div className="flex flex-col">
        {widgetItems &&
          widgetItems.map((widget) => (
            <Link
              key={widget.id}
              href={`/blog?k=${widget.slug}&type=${type}`}
              className="rounded-full p-2  text-gray-700 text-center hover:text-websecondary hover:border-300 transition duration-300 text-sm font-semibold"
            >
              <div className="flex flex-row">
                <span>{widget.name || widget.title}</span>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
};

export default ArticleSidebarWidget;
