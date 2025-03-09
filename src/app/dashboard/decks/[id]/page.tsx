import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { createClient } from "../../../../../supabase/server";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BookOpen, Edit, Play, Plus, Trash } from "lucide-react";
import Link from "next/link";

export default async function DeckDetails({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch deck details
  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .select("*")
    .eq("id", params.id)
    .single();

  if (deckError) {
    console.error("Error fetching deck:", deckError);
    return notFound();
  }

  // Fetch questions for this deck
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("*, answers(*)")
    .eq("deck_id", params.id)
    .order("created_at", { ascending: true });

  if (questionsError) {
    console.error("Error fetching questions:", questionsError);
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{deck.title}</h1>
              <p className="text-muted-foreground mt-1">
                Created on {new Date(deck.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Deck Description and Actions */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">About this deck</h2>
                  <p className="text-gray-500 mt-1">
                    {deck.description || "No description provided"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit size={16} className="mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-500">
                  <Trash size={16} className="mr-1" /> Delete
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {questions?.length || 0}
                </div>
                <div className="text-sm text-gray-500">Questions</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-500">Times Studied</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">0%</div>
                <div className="text-sm text-gray-500">Mastery Level</div>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <Link
                href={`/dashboard/decks/${params.id}/study`}
                className="flex-1"
              >
                <Button className="w-full" disabled={!questions?.length}>
                  <Play size={16} className="mr-2" /> Start Studying
                </Button>
              </Link>
              <Link
                href={`/dashboard/decks/${params.id}/edit`}
                className="flex-1"
              >
                <Button variant="outline" className="w-full">
                  <Plus size={16} className="mr-2" /> Add Questions
                </Button>
              </Link>
            </div>
          </div>

          {/* Questions List */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Questions</h2>

            {questions && questions.length > 0 ? (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Question {index + 1}</h3>
                      <Button variant="ghost" size="sm">
                        <Edit size={14} className="mr-1" /> Edit
                      </Button>
                    </div>
                    <p className="mb-4">{question.question_text}</p>

                    <div className="space-y-2">
                      {question.answers.map((answer: any) => (
                        <div
                          key={answer.id}
                          className={`p-2 rounded-md ${answer.is_correct ? "bg-green-50 border border-green-200" : "bg-gray-50"}`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 rounded-full mr-2 ${answer.is_correct ? "bg-green-500" : "bg-gray-300"}`}
                            ></div>
                            <span
                              className={answer.is_correct ? "font-medium" : ""}
                            >
                              {answer.answer_text}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-gray-400 mb-4">
                  <BookOpen size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  No questions in this deck yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Start adding questions to build your quiz deck
                </p>
                <Link href={`/dashboard/decks/${params.id}/edit`}>
                  <Button>
                    <Plus size={16} className="mr-2" /> Add Your First Question
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
