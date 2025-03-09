import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import {
  UserCircle,
  Mail,
  User,
  Calendar,
  BookOpen,
  BarChart4,
} from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch user profile data
  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
  }

  // Fetch user's decks count
  const { count: decksCount, error: decksError } = await supabase
    .from("decks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (decksError) {
    console.error("Error fetching decks count:", decksError);
  }

  // Fetch user's study sessions count
  const { count: sessionsCount, error: sessionsError } = await supabase
    .from("study_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (sessionsError) {
    console.error("Error fetching study sessions count:", sessionsError);
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account information and preferences
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl p-6 border shadow-sm flex flex-col items-center">
                <div className="bg-blue-100 rounded-full p-6 mb-4">
                  <UserCircle className="h-16 w-16 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold">
                  {profile?.full_name || user.email?.split("@")[0]}
                </h2>
                <p className="text-gray-500 mb-4">{user.email}</p>
                <div className="w-full border-t pt-4 mt-2">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-500 flex items-center gap-2">
                      <BookOpen size={16} /> Decks
                    </span>
                    <span className="font-medium">{decksCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-500 flex items-center gap-2">
                      <BarChart4 size={16} /> Study Sessions
                    </span>
                    <span className="font-medium">{sessionsCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Calendar size={16} /> Joined
                    </span>
                    <span className="font-medium">
                      {profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Edit Profile
                </Button>
              </div>
            </div>

            {/* Profile Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-xl p-6 border shadow-sm">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <User size={20} className="text-blue-600" />
                  Personal Information
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={profile?.full_name || ""}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        value={user.email || ""}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button>Update Information</Button>
                </div>
              </div>

              {/* Account Security */}
              <div className="bg-white rounded-xl p-6 border shadow-sm">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Mail size={20} className="text-blue-600" />
                  Account Security
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium">Email Verification</h3>
                      <p className="text-sm text-gray-500">
                        {user.email_confirmed_at
                          ? "Your email has been verified"
                          : "Please verify your email address"}
                      </p>
                    </div>
                    <div>
                      {user.email_confirmed_at ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Verified
                        </span>
                      ) : (
                        <Button size="sm" variant="outline">
                          Verify Email
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium">Password</h3>
                      <p className="text-sm text-gray-500">
                        Change your password regularly to keep your account
                        secure
                      </p>
                    </div>
                    <Link href="/dashboard/reset-password">
                      <Button size="sm" variant="outline">
                        Change Password
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Study Preferences */}
              <div className="bg-white rounded-xl p-6 border shadow-sm">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <BookOpen size={20} className="text-blue-600" />
                  Study Preferences
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium">Study Reminders</h3>
                      <p className="text-sm text-gray-500">
                        Get notifications to remind you to study
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      Set Up Reminders
                    </Button>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium">Default Study Mode</h3>
                      <p className="text-sm text-gray-500">
                        Choose how you want to study by default
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      Configure
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
