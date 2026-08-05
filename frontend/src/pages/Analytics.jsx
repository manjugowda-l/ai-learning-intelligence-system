import { Clock, BookOpen, Brain, Flame } from "lucide-react";
import { useEffect } from "react";
import Heading from "../components/Analytics/Heading";
import Insights from "../components/Analytics/Insights";
import Graph from "../components/Analytics/Graph";
import QuizInsights from "../components/Analytics/QuizInsights";
import { useAnalytics } from "../context/AnalyticsContext.jsx";

const CHART_COLORS = ["#DC2626", "#06B6D4", "#FCA5A5", "#A5F3FC", "#818CF8", "#F59E0B"];

export default function Analytics() {
  const { overview, loading, error, fetchAnalytics } = useAnalytics();
  

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);
  console.log(overview);

  const totalStudyTime = overview?.totalStudyTime !== undefined ? `${overview.totalStudyTime} hrs`:"0";
  const topicsCount = overview?.topicsStudied !== undefined ? `${overview.topicsStudied}` : "0";
  const quizAccuracy = overview?.quizAccuracy !== undefined ? `${overview.quizAccuracy}%` : "0%";
  const studyStreak = overview?.studyStreak !== undefined ? `${overview.studyStreak} Days` : "0 Days";

  const insights = [
    {
      icon: Clock,
      title: "Total Study Time",
      value: totalStudyTime,
      description: "Recorded learning time",
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
    },
    {
      icon: BookOpen,
      title: "Topics Studied",
      value: topicsCount,
      description: "Across all tracks",
      iconBg: "bg-gray-100",
      iconColor: "text-gray-700",
    },
    {
      icon: Brain,
      title: "Quiz Accuracy",
      value: quizAccuracy,
      description: "Average score",
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-500",
      accentBar: "bg-cyan-500",
    },
    {
      icon: Flame,
      title: "Study Streak",
      value: studyStreak,
      description: "Current streak",
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      accentBar: "bg-red-600",
    },
  ];

 const graphData =
  Array.isArray(overview?.studyDistribution) &&
  overview.studyDistribution.length > 0
    ? overview.studyDistribution.map((item, idx) => ({
        name: item.track,
        value: item.studyTime, // or item.percentage depending on what the graph should display
        color: CHART_COLORS[idx % CHART_COLORS.length],
      }))
    : [
        { name: "DSA", value: 0, color: "#DC2626" },
        { name: "Web Development", value: 0, color: "#06B6D4" },
      ];

  const quizInsights = [
    {
      label: "Most Studied Track",
      value: overview?.mostStudiedTrack || "N/A",
      icon: "TrendingUp",
      color: "text-red-600",
    },
    {
      label: "Highest Quiz Accuracy",
      value: overview?.highestQuizAccuracyTopic || "N/A",
      icon: "Brain",
      color: "text-cyan-500",
    },
    {
      label: "Active Days This Month",
      value: overview?.activeDaysThisMonth ? `${overview.activeDaysThisMonth} Days` : "N/A",
      icon: "CheckCircle2",
      color: "text-green-500",
    },
    {
      label: "Last Study Session",
      value: overview?.lastStudySession || "Recently",
      icon: "Clock",
      color: "text-gray-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 px-10 py-10">
      <Heading
        title="Analytics"
        subtitle="Track your learning progress and performance."
      />

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
        </div>
      )}

      {error && !loading && (
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      )}

      {!loading && (
        <>
          <div className="mt-8">
            <Insights insights={insights} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
            <Graph
              title="Study Distribution"
              subtitle="Hours spent across learning tracks."
              data={graphData}
            />

            <QuizInsights
              title="Quick Insights"
              subtitle="Highlights from your learning journey."
              insights={quizInsights}
            />
          </div>
        </>
      )}
    </div>
  );
}
