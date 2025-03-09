"use client";

import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { createClient } from "../../../../../../supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  X,
  BarChart4,
  Trophy,
} from "lucide-react";
import Link from "next/link";

interface Question {
  id: string;
  question_text: string;
  answers: Answer[];
}

interface Answer {
  id: string;
  answer_text: string;
  is_correct: boolean;
}

interface StudySession {
  id?: string;
  start_time: string;
  end_time?: string;
  questions_answered: number;
  questions_correct: number;
}

export default function StudyDeck({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [deck, setDeck] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [studySession, setStudySession] = useState<StudySession>({
    start_time: new Date().toISOString(),
    questions_answered: 0,
    questions_correct: 0,
  });
  const [showResults, setShowResults] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{
    [key: string]: { answerId: string; isCorrect: boolean };
  }>({});

  useEffect(() => {
    const fetchDeckAndQuestions = async () => {
      setIsLoading(true);
      try {
        // Check if user is authenticated
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/sign-in");
          return;
        }

        // Fetch deck details
        const { data: deckData, error: deckError } = await supabase
          .from("decks")
          .select("*")
          .eq("id", params.id)
          .single();

        if (deckError) throw deckError;
        setDeck(deckData);

        // Fetch questions with answers
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*, answers(*)")
          .eq("deck_id", params.id);

        if (questionsError) throw questionsError;

        // Create a new study session
        const { data: sessionData, error: sessionError } = await supabase
          .from("study_sessions")
          .insert({
            user_id: user.id,
            deck_id: params.id,
            start_time: new Date().toISOString(),
            questions_answered: 0,
            questions_correct: 0,
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        setStudySession({ ...studySession, id: sessionData.id });

        // Shuffle questions for the study session
        const shuffledQuestions = [...questionsData].sort(
          () => Math.random() - 0.5,
        );
        setQuestions(shuffledQuestions);
      } catch (error) {
        console.error("Error fetching study data:", error);
        alert("Failed to load study session. Please try again.");
        router.push(`/dashboard/decks/${params.id}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeckAndQuestions();
  }, [params.id, router, supabase]);

  const handleAnswerSelect = (answerId: string) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswerId(answerId);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswerId || isAnswerSubmitted) return;

    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswer = currentQuestion.answers.find(
      (a) => a.id === selectedAnswerId,
    );
    const isCorrect = selectedAnswer?.is_correct || false;

    // Update user answers tracking
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        answerId: selectedAnswerId,
        isCorrect,
      },
    }));

    // Update study session stats
    const updatedSession = {
      ...studySession,
      questions_answered: studySession.questions_answered + 1,
      questions_correct: isCorrect
        ? studySession.questions_correct + 1
        : studySession.questions_correct,
    };
    setStudySession(updatedSession);

    // Update user progress for this question
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Check if progress record exists
      const { data: progressData, error: progressError } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("question_id", currentQuestion.id)
        .maybeSingle();

      if (progressError) throw progressError;

      if (progressData) {
        // Update existing progress
        await supabase
          .from("user_progress")
          .update({
            times_correct: isCorrect
              ? progressData.times_correct + 1
              : progressData.times_correct,
            times_incorrect: !isCorrect
              ? progressData.times_incorrect + 1
              : progressData.times_incorrect,
            last_answered_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", progressData.id);
      } else {
        // Create new progress record
        await supabase.from("user_progress").insert({
          user_id: user.id,
          question_id: currentQuestion.id,
          times_correct: isCorrect ? 1 : 0,
          times_incorrect: !isCorrect ? 1 : 0,
          last_answered_at: new Date().toISOString(),
        });
      }

      // Update study session in database
      await supabase
        .from("study_sessions")
        .update({
          questions_answered: updatedSession.questions_answered,
          questions_correct: updatedSession.questions_correct,
          updated_at: new Date().toISOString(),
        })
        .eq("id", studySession.id);
    } catch (error) {
      console.error("Error updating progress:", error);
    }

    setIsAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswerId(null);
      setIsAnswerSubmitted(false);
    } else {
      // End of quiz
      finishStudySession();
    }
  };

  const finishStudySession = async () => {
    try {
      // Update session with end time
      const endTime = new Date().toISOString();
      await supabase
        .from("study_sessions")
        .update({
          end_time: endTime,
          updated_at: endTime,
        })
        .eq("id", studySession.id);

      setStudySession({
        ...studySession,
        end_time: endTime,
      });

      setShowResults(true);
    } catch (error) {
      console.error("Error finishing study session:", error);
    }
  };

  const calculateScore = () => {
    if (studySession.questions_answered === 0) return 0;
    return Math.round(
      (studySession.questions_correct / studySession.questions_answered) * 100,
    );
  };

  const calculateStudyTime = () => {
    if (!studySession.end_time) return "--";

    const startTime = new Date(studySession.start_time).getTime();
    const endTime = new Date(studySession.end_time).getTime();
    const diffInMinutes = Math.round((endTime - startTime) / (1000 * 60));

    if (diffInMinutes < 1) return "Less than a minute";
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""}`;
  };

  if (isLoading) {
    return (
      <>
        <DashboardNavbar />
        <main className="w-full">
          <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 w-48 bg-gray-200 rounded mb-8"></div>
              <div className="h-64 w-full max-w-2xl bg-gray-100 rounded-xl"></div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (showResults) {
    return (
      <>
        <DashboardNavbar />
        <main className="w-full">
          <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <Link href={`/dashboard/decks/${params.id}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft size={18} />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Study Results</h1>
                <p className="text-muted-foreground mt-1">{deck.title}</p>
              </div>
            </div>

            {/* Results Summary */}
            <div className="bg-white rounded-xl p-8 border shadow-sm text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-full mb-4">
                  <Trophy className="h-10 w-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  Study Session Complete!
                </h2>
                <p className="text-gray-500">Great job studying {deck.title}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
                <div className="bg-gray-50 p-6 rounded-xl">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {calculateScore()}%
                  </div>
                  <div className="text-sm text-gray-500">Score</div>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {studySession.questions_correct}/
                    {studySession.questions_answered}
                  </div>
                  <div className="text-sm text-gray-500">Correct Answers</div>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {calculateStudyTime()}
                  </div>
                  <div className="text-sm text-gray-500">Study Time</div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Link href={`/dashboard/decks/${params.id}`}>
                  <Button variant="outline" className="w-full md:w-auto">
                    <ArrowLeft size={16} className="mr-2" /> Back to Deck
                  </Button>
                </Link>
                <Link href={`/dashboard/decks/${params.id}/study`}>
                  <Button className="w-full md:w-auto">
                    <ArrowRight size={16} className="mr-2" /> Study Again
                  </Button>
                </Link>
              </div>
            </div>

            {/* Question Review */}
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h2 className="text-xl font-semibold mb-6">Question Review</h2>
              <div className="space-y-6">
                {questions.map((question, index) => {
                  const userAnswer = userAnswers[question.id];
                  const isAnswered = !!userAnswer;
                  const isCorrect = userAnswer?.isCorrect;

                  return (
                    <div
                      key={question.id}
                      className={`border rounded-lg p-4 ${isAnswered ? (isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50") : "border-gray-200"}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Question {index + 1}</h3>
                        {isAnswered && (
                          <div
                            className={`flex items-center ${isCorrect ? "text-green-600" : "text-red-600"}`}
                          >
                            {isCorrect ? (
                              <>
                                <Check size={16} className="mr-1" />
                                <span>Correct</span>
                              </>
                            ) : (
                              <>
                                <X size={16} className="mr-1" />
                                <span>Incorrect</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="mb-4">{question.question_text}</p>

                      <div className="space-y-2">
                        {question.answers.map((answer) => {
                          const isSelected = userAnswer?.answerId === answer.id;
                          let className = "p-2 rounded-md ";

                          if (isAnswered) {
                            if (answer.is_correct) {
                              className +=
                                "bg-green-100 border border-green-200";
                            } else if (isSelected) {
                              className += "bg-red-100 border border-red-200";
                            } else {
                              className += "bg-gray-50";
                            }
                          } else {
                            className += "bg-gray-50";
                          }

                          return (
                            <div key={answer.id} className={className}>
                              <div className="flex items-center">
                                <div
                                  className={`w-4 h-4 rounded-full mr-2 ${isSelected ? (answer.is_correct ? "bg-green-500" : "bg-red-500") : answer.is_correct ? "bg-green-500" : "bg-gray-300"}`}
                                ></div>
                                <span
                                  className={
                                    answer.is_correct ? "font-medium" : ""
                                  }
                                >
                                  {answer.answer_text}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header with Progress */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href={`/dashboard/decks/${params.id}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft size={18} />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{deck.title}</h1>
                <p className="text-muted-foreground mt-1">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={16} />
              <span>
                Started{" "}
                {new Date(studySession.start_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{
                width: `${(currentQuestionIndex / questions.length) * 100}%`,
              }}
            ></div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">
                {currentQuestion.question_text}
              </h2>
            </div>

            {/* Answer Options */}
            <div className="space-y-4">
              {currentQuestion.answers.map((answer) => {
                let className =
                  "p-4 border rounded-lg flex items-center cursor-pointer transition-colors";

                if (isAnswerSubmitted) {
                  if (answer.is_correct) {
                    className += " border-green-500 bg-green-50";
                  } else if (selectedAnswerId === answer.id) {
                    className += " border-red-500 bg-red-50";
                  } else {
                    className += " border-gray-200 bg-gray-50";
                  }
                } else {
                  className +=
                    selectedAnswerId === answer.id
                      ? " border-blue-500 bg-blue-50"
                      : " border-gray-200 hover:border-blue-300 hover:bg-blue-50";
                }

                return (
                  <div
                    key={answer.id}
                    className={className}
                    onClick={() => handleAnswerSelect(answer.id)}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${selectedAnswerId === answer.id ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300"}`}
                    >
                      {selectedAnswerId === answer.id && <Check size={12} />}
                    </div>
                    <span>{answer.answer_text}</span>
                    {isAnswerSubmitted && (
                      <div className="ml-auto">
                        {answer.is_correct ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : selectedAnswerId === answer.id ? (
                          <X className="h-5 w-5 text-red-500" />
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-between">
              <div className="text-sm text-gray-500 flex items-center">
                <BarChart4 size={16} className="mr-2" />
                <span>
                  Score: {studySession.questions_correct}/
                  {studySession.questions_answered}
                </span>
              </div>
              <div className="space-x-4">
                {!isAnswerSubmitted ? (
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedAnswerId}
                  >
                    Check Answer
                  </Button>
                ) : (
                  <Button onClick={handleNextQuestion}>
                    {currentQuestionIndex < questions.length - 1
                      ? "Next Question"
                      : "Finish"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
