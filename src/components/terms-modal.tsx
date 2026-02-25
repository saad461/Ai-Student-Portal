'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface TermsModalProps {
  isOpen: boolean;
  onAgree: () => void;
}

export function TermsModal({ isOpen, onAgree }: TermsModalProps) {
  const [loading, setLoading] = useState(false);

  const handleAgree = async () => {
    setLoading(true);
    await onAgree();
    setLoading(false);
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Terms & Conditions</DialogTitle>
          <DialogDescription>
            Please read and agree to the terms to unlock your first lecture.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-4 text-sm space-y-4">
          <h3 className="font-bold text-lg">1. Introduction</h3>
          <p>
            Welcome to our Student Training Portal. By accessing this course, you agree to be bound by these Terms and Conditions.
          </p>
          <h3 className="font-bold text-lg">2. Academic Integrity</h3>
          <p>
            Students are expected to maintain the highest standards of academic integrity. Plagiarism, cheating, or any form of unauthorized collaboration will not be tolerated and may lead to dismissal from the program.
          </p>
          <h3 className="font-bold text-lg">3. Professionalism</h3>
          <p>
            Late submissions should be avoided. The automated accountability system is in place to ensure consistency. Respectful communication with mentors and peers is mandatory.
          </p>
          <h3 className="font-bold text-lg">4. Intellectual Property</h3>
          <p>
            All course materials, including lectures, assignments, and curriculum content, are the intellectual property of the institution. Redistribution or commercial use of these materials is strictly prohibited.
          </p>
          <h3 className="font-bold text-lg">5. Progress and Completion</h3>
          <p>
            Students must complete lectures sequentially. Certification is contingent upon successful completion and review of all mandatory tasks and projects.
          </p>
        </div>
        <DialogFooter className="pt-4 border-t">
          <Button onClick={handleAgree} disabled={loading} className="w-full">
            {loading ? 'Processing...' : 'I Agree to the Terms & Conditions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
