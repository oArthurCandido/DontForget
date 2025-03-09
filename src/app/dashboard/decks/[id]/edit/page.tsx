"use client";

import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "../../../../../../supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Save, X } from "lucide-react";
import Link from "next/link";

interface Question {
  id: string;
  questionText: string;
  answers: Answer[];
  dbId?: string; // Database ID if it exists
}

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
  dbId?: string; // Database ID if it exists
}

interface Deck {
  id: string;
  title: string;
  description: string;
}

export default function EditDeck({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const fetchDeckAndQuestions = async () => {
      setIsLoading(true);
      try {
        // Fetch deck details
        const { data: deckData, error: deckError } = await supabase
          .from("decks")
          .select("*")
          .eq("id", params.id)
          .single();

        if (deckError) throw deckError;

        setDeck({
          id: deckData.id,
          title: deckData.title,
          description: deckData.description || "",
        });

        // Fetch questions and answers
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*, answers(*)")
          .eq("deck_id", params.id);

        if (questionsError) throw questionsError;

        // Transform to our format
        const formattedQuestions = questionsData.map((q) => ({
          id: crypto.randomUUID(),
          dbId: q.id,
          questionText: q.question_text,
          answers: q.answers.map((a: any) => ({
            id: crypto.randomUUID(),
            dbId: a.id,
            text: a.answer_text,
            isCorrect: a.is_correct,
          })),
        }));

        setQuestions(formattedQuestions);
      } catch (error) {
        console.error("Error fetching deck data:", error);
        alert("Failed to load deck data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeckAndQuestions();
  }, [params.id, supabase]);

  const updateDeckTitle = (title: string) => {
    if (deck) setDeck({ ...deck, title });
  };

  const updateDeckDescription = (description: string) => {
    if (deck) setDeck({ ...deck, description });
  };

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
      questions.map((q) => (q.id === id ? { ...q, questionText: text } : q))
    );
  };

  const updateAnswerText = (questionId: string, answerId: string, text: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map((a) =>
                a.id === answerId ? { ...a, text } : a
              ),
            }
          : q
      )
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
          : q
      )
    );
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSubmit = async () => {
    if (!deck) return;
    
    if (!deck.title.trim()) {
      alert("Please enter a deck title");
      return;
    }

    // Validate questions with content
    const questionsWithContent = questions.filter(
      (q) => q.questionText.trim() !== ""
    );

    if (questionsWithContent.length === 0) {
      alert("Please add at least one question with content");
      return;
    }

    // Validate questions
    for (const question of questionsWithContent) {
      const hasCorrectAnswer = question.answers.some((a) => a.isCorrect);
      if (!hasCorrectAnswer) {
        alert("Each question must have at least one correct answer");
        return;
      }

      // Only check answers with content
      const answersWithContent = question.answers.filter(
        (a) => a.text.trim() !== ""
      );
      if (answersWithContent.length < 2) {
        alert("Each question must have at least two answer options");
        return;
      }

      // Make sure at least one answer with content is marked correct
      const hasCorrectAnswerWithContent = answersWithContent.some(
        (a) => a.isCorrect
      );
      if (!hasCorrectAnswerWithContent) {
        alert("Each question must have at least one correct answer with content");
        return;
      }
    }

    setIsSaving(true);

    try {
      // 1. Update the deck
      const { error: deckError } = await supabase
        .from("decks")
        .update({
          title: deck.title,
          description: deck.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deck.id);

      if (deckError) throw deckError;

      // 2. Handle questions - create new ones, update existing ones
      for (const question of questionsWithContent) {
        let questionId = question.dbId;

        // If it's a new question, create it
        if (!questionId) {
          const { data: newQuestion, error: questionError } = await supabase
            .from("questions")
            .insert({
              deck_id: deck.id,
              question_text: question.questionText,
            })
            .select()
            .single();

          if (questionError) throw questionError;
          questionId = newQuestion.id;
        } else {
          // Update existing question
          const { error: updateError } = await supabase
            .from("questions")
            .update({
              question_text: question.questionText,
              updated_at: new Date().toISOString(),
            })
            .eq("id", questionId);

          if (updateError) throw updateError;
        }

        // Filter out empty answers
        const validAnswers = question.answers.filter(
          (a) => a.text.trim() !== ""
        );

        // Handle answers for this question
        for (const answer of validAnswers) {
          if (answer.dbId) {
            // Update existing answer
            const { error: answerError } = await supabase
              .from("answers")
              .update({
                answer_text: answer.text,
                is_correct: answer.isCorrect,
                updated_at: new Date().toISOString(),
              })
              .eq("id", answer.dbId);

            if (answerError) throw answerError;
          } else {
            // Create new answer
            const { error: answerError } = await supabase
              .from("answers")
              .insert({
                question_id: questionId,
                answer_text: answer.text,
                is_correct: answer.isCorrect,
              });

            if (answerError) throw answerError;
          }
        }
      }

      // Redirect to the deck details page
      router.push(`/dashboard/decks/${deck.id}`);
    } catch (error) {
      console.error("Error updating deck:", error);
      alert("Failed to update deck. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !deck) {
    return (
      <>
        <DashboardNavbar />
        <main className="w-full">
          <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
            <p>Loading deck data...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/decks/${deck.id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Edit Quiz Deck</h1>
          </div>

          {/* Deck Info */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Deck Information</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Deck Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., JavaScript Fundamentals"
                  value={deck.title}
                  onChange={(e) => updateDeckTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this deck covers..."
                  rows={4}
                  value={deck.description}
                  onChange={(e) => updateDeckDescription(e.target.value)}
                />
              </div>
            </div>
