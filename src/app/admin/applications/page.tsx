'use client';

import { useEffect, useState } from 'react';
import { getApplications, approveApplication, rejectApplication } from '../application-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { useToast } from '@/components/ui/toast-provider';
import { useConfirmation } from '@/components/ui/confirmation-provider';
import { cn } from '@/lib/utils';

export default function AdminApplicationsPage() {
  const { success, error: toastError } = useToast();
  const { confirm: customConfirm } = useConfirmation();
  const [applications, setApplications] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Record<string, unknown> | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string; loginPin: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await getApplications();
      setApplications(data);
      setSelectedIds([]);
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
      success('Application approved!');
      setCredentials(result.credentials || null);
      loadApplications();
    } else {
      toastError('Error: ' + result.error);
    }
    setProcessingId(null);
  };

  const handleReject = async (id: string) => {
    if (!await customConfirm({
      title: 'Reject Application',
      description: 'Are you sure you want to reject this application?',
      variant: 'destructive',
      confirmText: 'Reject'
    })) return;
    setProcessingId(id);
    const result = await rejectApplication(id);
    if (result.success) {
      loadApplications();
    }
    setProcessingId(null);
  };

  const handleBulkApprove = async () => {
    if (!await customConfirm(`Are you sure you want to approve ${selectedIds.length} applications?`)) return;
    setIsBulkProcessing(true);
    let successCount = 0;
    for (const id of selectedIds) {
        const res = await approveApplication(id);
        if (res.success) successCount++;
    }
    success(`Successfully approved ${successCount} applications.`);
    setIsBulkProcessing(false);
    loadApplications();
  };

  const handleBulkReject = async () => {
    if (!await customConfirm({
      title: 'Bulk Reject',
      description: `Are you sure you want to reject ${selectedIds.length} applications?`,
      variant: 'destructive',
      confirmText: 'Reject All'
    })) return;
    setIsBulkProcessing(true);
    let successCount = 0;
    for (const id of selectedIds) {
        const res = await rejectApplication(id);
        if (res.success) successCount++;
    }
    success(`Successfully rejected ${successCount} applications.`);
    setIsBulkProcessing(false);
    loadApplications();
  };

  const handleBulkEmail = () => {
    const emails = applications
        .filter(app => selectedIds.includes(app.id as string))
        .map(app => app.email as string)
        .join(',');

    if (emails) {
        window.location.href = `mailto:${emails}?subject=Pro Dev Training Update`;
        success('Opening your email client...');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === applications.length) {
        setSelectedIds([]);
    } else {
        setSelectedIds(applications.map(app => app.id as string));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold uppercase tracking-tight">Student Applications</h1>
           <p className="text-muted-foreground">Manage incoming enrollments and student onboarding.</p>
        </div>
        <div className="flex gap-2">
            <Badge variant="outline" className="px-4 py-2 text-sm">
              {applications.length} Total
            </Badge>
            {selectedIds.length > 0 && (
                <div className="flex gap-2 animate-in fade-in slide-in-from-right-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(applications.filter(app => selectedIds.includes(app.id as string)).map(app => app.email as string).join(', '))}>
                      Copy Emails
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleBulkEmail}>Email ({selectedIds.length})</Button>
                    <Button variant="destructive" size="sm" onClick={handleBulkReject} disabled={isBulkProcessing}>Reject All</Button>
                    <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleBulkApprove} disabled={isBulkProcessing}>
                        {isBulkProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : `Approve All (${selectedIds.length})`}
                    </Button>
                </div>
            )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                   <input
                     type="checkbox"
                     className="h-4 w-4 rounded border-gray-300"
                     checked={selectedIds.length === applications.length && applications.length > 0}
                     onChange={toggleSelectAll}
                   />
                </TableHead>
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
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No applications found.
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id as string} className={cn(selectedIds.includes(app.id as string) && "bg-muted/50")}>
                    <TableCell>
                       <input
                         type="checkbox"
                         className="h-4 w-4 rounded border-gray-300"
                         checked={selectedIds.includes(app.id as string)}
                         onChange={() => toggleSelect(app.id as string)}
                       />
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(app.created_at as string).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {app.first_name as string} {app.last_name as string}
                    </TableCell>
                    <TableCell>{app.email as string}</TableCell>
                    <TableCell>{app.city as string}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          app.status === 'approved' ? 'default' :
                          app.status === 'rejected' ? 'destructive' :
                          'secondary'
                        }
                        className="capitalize"
                      >
                        {app.status as string}
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
                            onClick={() => handleApprove(app.id as string)}
                          >
                            {processingId === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={processingId === app.id}
                            onClick={() => handleReject(app.id as string)}
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
              Submitted on {selectedApp && new Date(selectedApp.created_at as string).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="grid grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">Personal Info</label>
                  <p className="font-medium">{selectedApp.first_name as string} {selectedApp.last_name as string} ({selectedApp.gender as string}, {selectedApp.age as string}y)</p>
                  <p className="text-sm">CNIC: {selectedApp.cnic as string}</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">Contact</label>
                  <p className="text-sm">{selectedApp.email as string}</p>
                  <p className="text-sm">{selectedApp.phone_number as string}</p>
                  <p className="text-sm">{selectedApp.city as string}</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">GitHub</label>
                  <p className="text-sm">
                    {selectedApp.github_link ? (
                      <a href={selectedApp.github_link as string} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center">
                        {selectedApp.github_link as string} <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    ) : 'Not provided'}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">Education &amp; Skills</label>
                  <p className="text-sm font-medium">{selectedApp.education as string}</p>
                  <p className="text-sm italic">Level: {selectedApp.skills_level as string}</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">Objective</label>
                  <p className="text-sm">{selectedApp.objective as string}</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground">Course Pin (Secret)</label>
                  <p className="text-lg font-mono font-bold text-primary">{selectedApp.course_pin as string}</p>
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
