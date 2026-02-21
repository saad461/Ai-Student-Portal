'use client';

import { useEffect, useState } from 'react';
import { getApplications, approveApplication, rejectApplication } from '../application-actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Loader2, Check, X, Eye, Copy, ExternalLink } from 'lucide-react';

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [credentials, setCredentials] = useState<any>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await getApplications();
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    const result = await approveApplication(id);
    if (result.success) {
      setCredentials(result.credentials);
      loadApplications();
    } else {
      alert('Error: ' + result.error);
    }
    setProcessingId(null);
  };

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to reject this application?')) return;
    setProcessingId(id);
    const result = await rejectApplication(id);
    if (result.success) {
      loadApplications();
    }
    setProcessingId(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-tight">Student Applications</h1>
        <Badge variant="outline" className="px-4 py-1 text-sm">
          {applications.length} Total Applications
        </Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No applications found.
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="text-sm">
                      {new Date(app.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {app.first_name} {app.last_name}
                    </TableCell>
                    <TableCell>{app.email}</TableCell>
                    <TableCell>{app.city}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          app.status === 'approved' ? 'default' :
                          app.status === 'rejected' ? 'destructive' :
                          'secondary'
                        }
                        className="capitalize"
                      >
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedApp(app)}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      {app.status === 'pending' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            disabled={processingId === app.id}
                            onClick={() => handleApprove(app.id)}
                          >
                            {processingId === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={processingId === app.id}
                            onClick={() => handleReject(app.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Application Details Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Submitted on {selectedApp && new Date(selectedApp.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="grid grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">Personal Info</label>
                  <p className="font-medium">{selectedApp.first_name} {selectedApp.last_name} ({selectedApp.gender}, {selectedApp.age}y)</p>
                  <p className="text-sm">CNIC: {selectedApp.cnic}</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">Contact</label>
                  <p className="text-sm">{selectedApp.email}</p>
                  <p className="text-sm">{selectedApp.phone_number}</p>
                  <p className="text-sm">{selectedApp.city}</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">GitHub</label>
                  <p className="text-sm">
                    {selectedApp.github_link ? (
                      <a href={selectedApp.github_link} target="_blank" className="text-primary hover:underline flex items-center">
                        {selectedApp.github_link} <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    ) : 'Not provided'}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">Education & Skills</label>
                  <p className="text-sm font-medium">{selectedApp.education}</p>
                  <p className="text-sm italic">Level: {selectedApp.skills_level}</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">Objective</label>
                  <p className="text-sm">{selectedApp.objective}</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">Course Pin (Secret)</label>
                  <p className="text-lg font-mono font-bold text-primary">{selectedApp.course_pin}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={!!credentials} onOpenChange={() => setCredentials(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-green-600 flex items-center">
              <Check className="mr-2" /> Application Approved!
            </DialogTitle>
            <DialogDescription>
              The account has been created. Please send these credentials to the student manually.
            </DialogDescription>
          </DialogHeader>
          {credentials && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Email</label>
                    <p className="font-mono">{credentials.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(credentials.email)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Generated Password</label>
                    <p className="font-mono">{credentials.password}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(credentials.password)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Login Pin</label>
                    <p className="font-mono text-xl font-bold tracking-widest">{credentials.loginPin}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(credentials.loginPin)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
                <strong>Important:</strong> These credentials are only shown once. Make sure to copy them before closing this window.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCredentials(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
