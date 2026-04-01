'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { QuizQuestion } from '@/lib/curriculum';
import { CheckCircle2, XCircle } from 'lucide-react';

interface QuizModuleProps {
  questions: QuizQuestion[];
  onComplete: (score: number, answers: number[]) => void;
  canRetake?: boolean;
  onRetake?: () => void;
}

export function QuizModule({ questions, onComplete, canRetake, onRetake }: QuizModuleProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleNext = () => {
    if (selectedOption === null) return;

    const newAnswers = [...answers, selectedOption];
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const score = newAnswers.reduce((acc, curr, idx) => {
        return curr === questions[idx].correctAnswer ? acc + 1 : acc;
      }, 0);
      setShowResult(true);
      onComplete(score, newAnswers);
    }
  };

  if (showResult) {
    const score = answers.reduce((acc, curr, idx) => {
      return curr === questions[idx].correctAnswer ? acc + 1 : acc;
    }, 0);
    const percentage = (score / questions.length) * 100;

    return (
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Quiz Result</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-5xl font-bold">{percentage}%</div>
          <p className="text-muted-foreground text-lg">
            You got {score} out of {questions.length} questions correct.
          </p>

          {canRetake && percentage < 80 && (
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-3">
               <p className="text-xs font-bold text-primary uppercase tracking-widest">Retake Available!</p>
               <Button onClick={onRetake} className="w-full font-black uppercase">
                  Use Quiz Retake Perk
               </Button>
            </div>
          )}

          <div className="space-y-4 mt-6 text-left">
            {questions.map((q, idx) => (
              <div key={idx} className="p-3 border rounded-md">
                <div className="font-medium flex items-center gap-2">
                  {answers[idx] === q.correctAnswer ? <CheckCircle2 className="text-green-500 h-4 w-4" /> : <XCircle className="text-red-500 h-4 w-4" />}
                  {q.question}
                </div>
                <div className="text-sm text-muted-foreground mt-1 ml-6">
                  Correct: {q.options[q.correctAnswer]}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentStep];

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">Question {currentStep + 1} of {questions.length}</span>
          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Weekly Quiz</span>
        </div>
        <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedOption?.toString()} onValueChange={(v) => setSelectedOption(parseInt(v))}>
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">{option}</Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleNext}
          className="w-full"
          disabled={selectedOption === null}
        >
          {currentStep === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
        </Button>
      </CardFooter>
    </Card>
  );
}
