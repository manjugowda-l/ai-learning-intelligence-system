import { Calendar, Clock, Tag, BookOpen } from "lucide-react";

export default function Header({ topicName = "Activity", date, readTime = "5 min read", title }) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently";

  const displayHeading = title || (topicName ? `${topicName} Summary` : "Activity Summary");

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-10 mb-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
          <BookOpen size={20} className="text-red-600" />
        </div>

        <div>
          <h1 className="text-[26px] font-bold text-gray-900">
            {displayHeading}
          </h1>

          <p className="text-sm text-gray-500">
            AI Generated Summary
          </p>
        </div>
      </div>

      <div className="flex gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-gray-400" />
          <span className="text-sm text-gray-500">
            {formattedDate}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Clock size={13} className="text-gray-400" />
          <span className="text-sm text-gray-500">
            {readTime}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Tag size={13} className="text-gray-400" />
          <span className="text-sm text-gray-500">
            {topicName}
          </span>
        </div>
      </div>
    </div>
  );
}