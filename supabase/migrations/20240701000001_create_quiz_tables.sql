-- Create decks table
CREATE TABLE IF NOT EXISTS decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_progress table to track study progress
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  times_correct INTEGER DEFAULT 0,
  times_incorrect INTEGER DEFAULT 0,
  last_answered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Create study_sessions table to track study sessions
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Deck policies
CREATE POLICY "Users can view their own decks" 
  ON decks FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own decks" 
  ON decks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks" 
  ON decks FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks" 
  ON decks FOR DELETE 
  USING (auth.uid() = user_id);

-- Question policies
CREATE POLICY "Users can view questions in their decks" 
  ON questions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM decks WHERE decks.id = questions.deck_id AND decks.user_id = auth.uid()));

CREATE POLICY "Users can insert questions in their decks" 
  ON questions FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM decks WHERE decks.id = questions.deck_id AND decks.user_id = auth.uid()));

CREATE POLICY "Users can update questions in their decks" 
  ON questions FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM decks WHERE decks.id = questions.deck_id AND decks.user_id = auth.uid()));

CREATE POLICY "Users can delete questions in their decks" 
  ON questions FOR DELETE 
  USING (EXISTS (SELECT 1 FROM decks WHERE decks.id = questions.deck_id AND decks.user_id = auth.uid()));

-- Answer policies
CREATE POLICY "Users can view answers to questions in their decks" 
  ON answers FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM questions 
    JOIN decks ON questions.deck_id = decks.id 
    WHERE questions.id = answers.question_id AND decks.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert answers to questions in their decks" 
  ON answers FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM questions 
    JOIN decks ON questions.deck_id = decks.id 
    WHERE questions.id = answers.question_id AND decks.user_id = auth.uid()
  ));

CREATE POLICY "Users can update answers to questions in their decks" 
  ON answers FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM questions 
    JOIN decks ON questions.deck_id = decks.id 
    WHERE questions.id = answers.question_id AND decks.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete answers to questions in their decks" 
  ON answers FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM questions 
    JOIN decks ON questions.deck_id = decks.id 
    WHERE questions.id = answers.question_id AND decks.user_id = auth.uid()
  ));

-- User progress policies
CREATE POLICY "Users can view their own progress" 
  ON user_progress FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
  ON user_progress FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
  ON user_progress FOR UPDATE 
  USING (auth.uid() = user_id);

-- Study session policies
CREATE POLICY "Users can view their own study sessions" 
  ON study_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions" 
  ON study_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions" 
  ON study_sessions FOR UPDATE 
  USING (auth.uid() = user_id);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE decks;
ALTER PUBLICATION supabase_realtime ADD TABLE questions;
ALTER PUBLICATION supabase_realtime ADD TABLE answers;
ALTER PUBLICATION supabase_realtime ADD TABLE user_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE study_sessions;