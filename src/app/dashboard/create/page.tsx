"use client";

import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "../../../../supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Save, X } from "lucide-react";
import Link from "next/link";

interface Question {
  id: string;
  questionText: string;
  answers: Answer[];
}

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export default function CreateDeck() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(1); // 1: Deck Info, 2: Questions

  const addQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      questionText: "",
      answers: [
        { id: crypto.randomUUID(), text: "", isCorrect: false },
        { id: crypto.randomUUID(), text: "", isCorrect: false },
        { id: crypto.randomUUID(), text: "", isCorrect: false },
        { id: crypto.randomUUID(), text: "", isCorrect: false },
      ],
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestionText = (id: string, text: string) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, questionText: text } : q)),
    );
  };

  const updateAnswerText = (
    questionId: string,
    answerId: string,
    text: string,
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map((a) =>
                a.id === answerId ? { ...a, text } : a,
              ),
            }
          : q,
      ),
    );
  };

  const setCorrectAnswer = (questionId: string, answerId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map((a) => ({
                ...a,
                isCorrect: a.id === answerId,
              })),
            }
          : q,
      ),
    );
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("Please enter a deck title");
      return;
    }

    if (questions.length === 0) {
      alert("Please add at least one question");
      return;
    }

    // Validate questions
    for (const question of questions) {
      if (!question.questionText.trim()) {
        alert("All questions must have text");
        return;
      }

      const hasCorrectAnswer = question.answers.some((a) => a.isCorrect);
      if (!hasCorrectAnswer) {
        alert("Each question must have at least one correct answer");
        return;
      }

      const hasEmptyAnswers = question.answers.some(
        (a) => a.text.trim() === "",
      );
      if (hasEmptyAnswers) {
        alert("All answer options must have text");
        return;
      }
    }

    setIsLoading(true);

    try {
      // 1. Create the deck
      const { data: deck, error: deckError } = await supabase
        .from("decks")
        .insert({
          title,
          description,
        })
        .select()
        .single();

      if (deckError) throw deckError;

      // 2. Create questions and answers
      for (const question of questions) {
        // Create question
        const { data: questionData, error: questionError } = await supabase
          .from("questions")
          .insert({
            deck_id: deck.id,
            question_text: question.questionText,
          })
          .select()
          .single();

        if (questionError) throw questionError;

        // Create answers for this question
        const answersToInsert = question.answers.map((answer) => ({
          question_id: questionData.id,
          answer_text: answer.text,
          is_correct: answer.isCorrect,
        }));

        const { error: answersError } = await supabase
          .from("answers")
          .insert(answersToInsert);

        if (answersError) throw answersError;
      }

      // Redirect to the dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating deck:", error);
      alert("Failed to create deck. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Create New Quiz Deck</h1>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center w-full max-w-md">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                1
              </div>
              <div
                className={`flex-1 h-1 ${
                  currentStep >= 2 ? "bg-blue-600" : "bg-gray-200"
                }`}
              ></div>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= 2
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                2
              </div>
            </div>
          </div>

          {/* Step 1: Deck Info */}
          {currentStep === 1 && (
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h2 className="text-xl font-semibold mb-6">Deck Information</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Deck Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., JavaScript Fundamentals"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this deck covers..."
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      if (!title.trim()) {
                        alert("Please enter a deck title");
                        return;
                      }
                      setCurrentStep(2);
                    }}
                  >
                    Continue to Questions
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Questions */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Questions List */}
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="bg-white rounded-xl p-6 border shadow-sm relative"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4"
                    onClick={() => removeQuestion(question.id)}
                  >
                    <X size={18} />
                  </Button>

                  <h3 className="text-lg font-medium mb-4">
                    Question {index + 1}
                  </h3>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor={`question-${question.id}`}>
                        Question Text
                      </Label>
                      <Input
                        id={`question-${question.id}`}
                        placeholder="Enter your question here"
                        value={question.questionText}
                        onChange={(e) =>
                          updateQuestionText(question.id, e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-4">
                      <Label>Answer Options</Label>
                      <p className="text-sm text-gray-500">
                        Select the correct answer(s)
                      </p>

                      {question.answers.map((answer, answerIndex) => (
                        <div
                          key={answer.id}
                          className="flex items-center gap-3"
                        >
                          <div
                            className={`w-6 h-6 rounded-full border flex items-center justify-center cursor-pointer ${
                              answer.isCorrect
                                ? "bg-green-100 border-green-500 text-green-500"
                                : "border-gray-300"
                            }`}
                            onClick={() =>
                              setCorrectAnswer(question.id, answer.id)
                            }
                          >
                            {answer.isCorrect && "✓"}
                          </div>
                          <Input
                            placeholder={`Answer option ${answerIndex + 1}`}
                            value={answer.text}
                            onChange={(e) =>
                              updateAnswerText(
                                question.id,
                                answer.id,
                                e.target.value,
                              )
                            }
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Question Button */}
              <Button
                variant="outline"
                className="w-full py-8 border-dashed"
                onClick={addQuestion}
              >
                <Plus size={18} className="mr-2" />
                Add Question
              </Button>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back to Deck Info
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      Save Deck
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
