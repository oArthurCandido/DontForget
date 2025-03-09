import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import {
  ArrowUpRight,
  BrainCircuit,
  Lightbulb,
  Trophy,
  BarChart4,
} from "lucide-react";
import { createClient } from "../../supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Features That Make Learning Easier
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our quiz platform is designed to help you learn more effectively
              with tools that adapt to your learning style.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Lightbulb className="w-6 h-6" />,
                title: "Create Custom Decks",
                description:
                  "Build question decks tailored to your learning needs",
              },
              {
                icon: <BrainCircuit className="w-6 h-6" />,
                title: "Smart Study Mode",
                description: "Get immediate feedback on your answers",
              },
              {
                icon: <BarChart4 className="w-6 h-6" />,
                title: "Progress Tracking",
                description: "Monitor your improvement over time",
              },
              {
                icon: <Trophy className="w-6 h-6" />,
                title: "Mastery System",
                description: "Track your proficiency in different subjects",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-blue-100">Questions Created</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5,000+</div>
              <div className="text-blue-100">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-blue-100">Improved Test Scores</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our simple process helps you create effective study materials in
              minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-blue-600 text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Create a Deck</h3>
              <p className="text-gray-600">
                Build a new deck with a title and description for your study
                topic.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-blue-600 text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Add Questions</h3>
              <p className="text-gray-600">
                Create multiple-choice questions and mark the correct answers.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-blue-600 text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Study & Track Progress
              </h3>
              <p className="text-gray-600">
                Test your knowledge and see your improvement over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Boost Your Learning?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of students who have improved their knowledge with
            our quiz platform.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Creating Quizzes
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
