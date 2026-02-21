'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Captcha } from '@/components/captcha';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CheckCircle2, Download, Loader2 } from 'lucide-react';

export default function EnrollPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generatedPin, setGeneratedPin] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    cnic: '',
    email: '',
    age: '',
    phone: '',
    skillsLevel: '',
    objective: '',
    education: '',
    city: '',
    github: '',
    passport: null as File | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, passport: e.target.files[0] });
    }
  };

  const generateCoursePin = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const downloadPDF = (data: typeof formData, pin: string) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 102, 204);
    doc.text('PRO DEV TRAINING PORTAL', 105, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Enrollment Application Details', 105, 30, { align: 'center' });

    doc.setDrawColor(0, 102, 204);
    doc.line(20, 35, 190, 35);

    // Form Data Table
    const tableData = [
      ['First Name', data.firstName],
      ['Last Name', data.lastName],
      ['Gender', data.gender],
      ['CNIC Number', data.cnic],
      ['Email Address', data.email],
      ['Age', data.age],
      ['Phone Number', data.phone],
      ['City', data.city],
      ['Education', data.education],
      ['Skill Level', data.skillsLevel],
      ['GitHub Profile', data.github || 'N/A'],
      ['Objective', data.objective],
    ];

    autoTable(doc, {
      startY: 45,
      head: [['Field', 'Information']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 102, 204] },
    });

    // Secret Pin Section
    const finalY = (doc as any).lastAutoTable.finalY + 20;

    doc.setFillColor(240, 240, 240);
    doc.rect(20, finalY, 170, 40, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SECRET COURSE PIN', 105, finalY + 15, { align: 'center' });

    doc.setFontSize(24);
    doc.setTextColor(255, 0, 0);
    doc.text(pin, 105, finalY + 30, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Keep this PIN safe. It will be required for your final certification.', 105, finalY + 50, { align: 'center' });

    doc.save(`Enrollment_${data.firstName}_${data.lastName}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const pin = generateCoursePin();
      setGeneratedPin(pin);

      // 1. Upload Passport Picture
      let passportUrl = '';
      if (formData.passport) {
        const fileExt = formData.passport.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('passports')
          .upload(fileName, formData.passport);

        if (uploadError) throw uploadError;
        passportUrl = fileName;
      }

      // 2. Create Application Entry
      const { error: appError } = await supabase.from('applications').insert({
        first_name: formData.firstName,
        last_name: formData.lastName,
        gender: formData.gender,
        cnic: formData.cnic,
        email: formData.email,
        age: parseInt(formData.age),
        phone_number: formData.phone,
        passport_url: passportUrl,
        skills_level: formData.skillsLevel,
        objective: formData.objective,
        education: formData.education,
        city: formData.city,
        github_link: formData.github,
        course_pin: pin,
        status: 'pending'
      });

      if (appError) throw appError;

      setSubmitted(true);
      downloadPDF(formData, pin);

    } catch (err: any) {
      console.error('Enrollment error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Application Submitted!</CardTitle>
            <CardDescription>
              Your registration is in process. We will reach out to you soon via email with your login credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg border border-dashed border-primary/50">
              <p className="text-sm font-medium mb-1 uppercase tracking-wider text-muted-foreground">Your Secret Course Pin</p>
              <p className="text-3xl font-mono font-bold text-primary tracking-widest">{generatedPin}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              A PDF containing your details and this PIN has been downloaded. Please keep it safe.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button variant="outline" className="w-full" onClick={() => downloadPDF(formData, generatedPin)}>
              <Download className="mr-2 h-4 w-4" /> Redownload PDF
            </Button>
            <Button className="w-full" onClick={() => router.push('/')}>
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader className="bg-black text-white rounded-t-lg">
          <CardTitle className="text-3xl font-extrabold uppercase tracking-tight">Join Pro Dev Training</CardTitle>
          <CardDescription className="text-gray-400">Complete the form below to apply for the 24-week intensive program.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8 pt-8">
            {error && <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">{error}</div>}

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select onValueChange={(val) => setFormData({ ...formData, gender: val })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    required
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnic">CNIC Number</Label>
                  <Input
                    id="cnic"
                    placeholder="e.g. 42101-1234567-1"
                    required
                    value={formData.cnic}
                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passport">Passport Size Picture</Label>
                  <Input
                    id="passport"
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold border-b pb-2">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Gmail / Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="yourname@gmail.com"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="e.g. +92 300 1234567"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github">GitHub Profile URL (Optional)</Label>
                  <Input
                    id="github"
                    placeholder="https://github.com/username"
                    value={formData.github}
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Background & Objectives */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold border-b pb-2">Background & Goals</h3>
              <div className="space-y-2">
                <Label htmlFor="education">Current Education</Label>
                <Input
                  id="education"
                  placeholder="e.g. Bachelor in Computer Science"
                  required
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Skills Level</Label>
                <Select onValueChange={(val) => setFormData({ ...formData, skillsLevel: val })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="How would you rate your skills?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner (No coding experience)</SelectItem>
                    <SelectItem value="Intermediate">Intermediate (Know basics of HTML/CSS/JS)</SelectItem>
                    <SelectItem value="Advanced">Advanced (Can build basic applications)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="objective">Learning Objective</Label>
                <Textarea
                  id="objective"
                  placeholder="What do you hope to achieve with this course?"
                  className="min-h-[100px]"
                  required
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label className="text-center block text-muted-foreground mb-2">Security Verification</Label>
              <div className="flex justify-center">
                <Captcha onVerify={setIsCaptchaVerified} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 p-6 rounded-b-lg">
            <Button
              type="submit"
              className="w-full text-lg h-12 font-bold uppercase tracking-wide"
              disabled={loading || !isCaptchaVerified}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing Application...
                </>
              ) : (
                'Submit Enrollment Form'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
