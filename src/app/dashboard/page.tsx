import DashboardNavbar from "@/components/dashboard-navbar";
import { InfoIcon, Plus, BookOpen, Search } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch user's decks
  const { data: decks, error } = await supabase
    .from("decks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching decks:", error);
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">My Quiz Decks</h1>
              <p className="text-muted-foreground mt-1">
                Create and manage your study materials
              </p>
            </div>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              <span>Create New Deck</span>
            </Button>
          </header>

          {/* Search Section */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              placeholder="Search your decks..."
              className="pl-10 w-full md:w-1/2 lg:w-1/3"
            />
          </div>

          {/* Decks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Deck Card */}
            <div className="border border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center h-64 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
              <div className="bg-blue-100 rounded-full p-3 mb-4">
                <Plus size={24} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Create New Deck</h3>
              <p className="text-sm text-gray-500 mb-4">
                Start building a new set of quiz questions
              </p>
              <Button variant="outline" size="sm">
                Get Started
              </Button>
            </div>

            {/* Sample Deck Cards (or actual decks if available) */}
            {decks && decks.length > 0 ? (
              decks.map((deck) => (
                <Link href={`/dashboard/decks/${deck.id}`} key={deck.id}>
                  <div className="border rounded-xl p-6 h-64 hover:shadow-md transition-all cursor-pointer bg-white">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-blue-100 rounded-full p-2">
                        <BookOpen size={20} className="text-blue-600" />
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(deck.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{deck.title}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                      {deck.description || "No description provided"}
                    </p>
                    <div className="mt-auto pt-4 border-t flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        {/* This would need a count query in a real implementation */}
                        0 questions
                      </div>
                      <Button variant="ghost" size="sm">
                        Study
                      </Button>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              // Sample decks if no decks exist yet
              <>
                <div className="border rounded-xl p-6 h-64 hover:shadow-md transition-all cursor-pointer bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-100 rounded-full p-2">
                      <BookOpen size={20} className="text-blue-600" />
                    </div>
                    <div className="text-xs text-gray-500">Just now</div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Sample: JavaScript Basics
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                    Test your knowledge of JavaScript fundamentals including
                    variables, functions, and objects.
                  </p>
                  <div className="mt-auto pt-4 border-t flex justify-between items-center">
                    <div className="text-sm text-gray-500">15 questions</div>
                    <Button variant="ghost" size="sm">
                      Study
                    </Button>
                  </div>
                </div>

                <div className="border rounded-xl p-6 h-64 hover:shadow-md transition-all cursor-pointer bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-100 rounded-full p-2">
                      <BookOpen size={20} className="text-blue-600" />
                    </div>
                    <div className="text-xs text-gray-500">Just now</div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Sample: React Hooks
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                    Learn about React's useState, useEffect, useContext and
                    other important hooks.
                  </p>
                  <div className="mt-auto pt-4 border-t flex justify-between items-center">
                    <div className="text-sm text-gray-500">12 questions</div>
                    <Button variant="ghost" size="sm">
                      Study
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Empty State - Show only if no decks */}
          {(!decks || decks.length === 0) && (
            <div className="bg-gray-50 rounded-xl p-8 text-center mt-4">
              <div className="bg-blue-100 rounded-full p-3 inline-flex mb-4">
                <BookOpen size={24} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Quiz Decks Yet</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Create your first quiz deck to start studying. Add questions,
                track your progress, and master any subject.
              </p>
              <Button>
                <Plus size={16} className="mr-2" />
                Create Your First Deck
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
