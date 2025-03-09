import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import { BarChart4, BookOpen, Calendar, Clock, Trophy } from "lucide-react";
import Link from "next/link";

export default async function StatsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch user's study sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from("study_sessions")
    .select("*, decks(title)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (sessionsError) {
    console.error("Error fetching study sessions:", sessionsError);
  }

  // Calculate stats
  const totalSessions = sessions?.length || 0;
  const totalQuestionsAnswered =
    sessions?.reduce((sum, session) => sum + session.questions_answered, 0) ||
    0;
  const totalCorrectAnswers =
    sessions?.reduce((sum, session) => sum + session.questions_correct, 0) || 0;
  const averageScore =
    totalQuestionsAnswered > 0
      ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100)
      : 0;

  // Calculate study time
  const totalStudyTimeMinutes =
    sessions?.reduce((sum, session) => {
      if (!session.end_time) return sum;
      const startTime = new Date(session.start_time).getTime();
      const endTime = new Date(session.end_time).getTime();
      return sum + Math.round((endTime - startTime) / (1000 * 60));
    }, 0) || 0;

  // Format study time
  const formatStudyTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header>
            <h1 className="text-3xl font-bold">My Progress</h1>
            <p className="text-muted-foreground mt-1">
              Track your learning journey and see your improvement over time
            </p>
          </header>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Trophy className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{averageScore}%</div>
                  <div className="text-sm text-gray-500">Average Score</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <BarChart4 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{totalSessions}</div>
                  <div className="text-sm text-gray-500">Study Sessions</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {totalQuestionsAnswered}
                  </div>
                  <div className="text-sm text-gray-500">
                    Questions Answered
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {formatStudyTime(totalStudyTimeMinutes)}
                  </div>
                  <div className="text-sm text-gray-500">Total Study Time</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Study Sessions */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-xl font-semibold mb-6">
              Recent Study Sessions
            </h2>

            {sessions && sessions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Deck
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Score
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Time
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sessions.map((session) => {
                      const score =
                        session.questions_answered > 0
                          ? Math.round(
                              (session.questions_correct /
                                session.questions_answered) *
                                100,
                            )
                          : 0;

                      const studyTime = session.end_time
                        ? Math.round(
                            (new Date(session.end_time).getTime() -
                              new Date(session.start_time).getTime()) /
                              (1000 * 60),
                          )
                        : 0;

                      return (
                        <tr key={session.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium">
                              {session.decks?.title || "Unknown Deck"}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-500">
                            {new Date(session.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div
                                className={`w-2 h-2 rounded-full mr-2 ${score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                              ></div>
                              <span>
                                {score}% ({session.questions_correct}/
                                {session.questions_answered})
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-500">
                            {studyTime < 1 ? "< 1 min" : `${studyTime} min`}
                          </td>
                          <td className="py-3 px-4">
                            <Link href={`/dashboard/decks/${session.deck_id}`}>
                              <Button variant="ghost" size="sm">
                                View Deck
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-gray-400 mb-4">
                  <BarChart4 size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  No Study Sessions Yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Start studying your decks to track your progress
                </p>
                <Link href="/dashboard">
                  <Button>Go to My Decks</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
