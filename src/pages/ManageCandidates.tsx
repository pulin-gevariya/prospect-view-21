import React, { useMemo, useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { useCandidateData } from "@/hooks/useCandidateData";
import { createCandidate, updateCandidate, deleteCandidate } from "@/lib/sheetsApi";
import { Pencil, Trash2, Plus, RefreshCcw, Loader2 } from "lucide-react";

const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const phoneRegex = /^\d{8,15}$/; // numeric only, no spaces, 8-15 digits

const formSchema = z.object({
  Name: z.string().trim().min(1, "Name is required"),
  Email: z.string().trim().toLowerCase().refine(v => !/\s/.test(v), "Email must not contain spaces").refine(v => v.includes("@"), "Email must include '@'").refine(v => emailRegex.test(v), "Enter a valid email address"),
  "Phone Number": z.string().trim().refine(v => /^\d+$/.test(v), "Phone must be numeric only").refine(v => phoneRegex.test(v), "Phone must be 8-15 digits (with country code)"),
  "Job Role Admin": z.string().trim().min(1, "Job Role Admin is required")
});
type FormValues = z.infer<typeof formSchema>;

const formatDateTime = () => {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');
  return `${day}/${month}/${year}, ${hours}:${formattedMinutes}:${formattedSeconds} ${ampm}`;
};

const toLite = (v: FormValues) => ({
  Name: v.Name,
  Email: v.Email,
  "Phone Number": v["Phone Number"],
  "Job Role Admin": v["Job Role Admin"],
  Datetime: formatDateTime()
});
const ManageCandidates: React.FC = () => {
  const {
    candidates,
    loading,
    error,
    refetch
  } = useCandidateData();
  const [editing, setEditing] = useState<FormValues | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [deleting, setDeleting] = useState<{
    Name: string;
    Email: string;
  } | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingPending, setDeletingPending] = useState(false);

  // SEO
  useEffect(() => {
    document.title = "Manage Candidates | Candidate Suite";
    const ensure = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };
    ensure("description", "Manage candidates: add, edit, delete records in the live Google Sheet.");
    // canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.href;
  }, []);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Name: "",
      Email: "",
      "Phone Number": "",
      "Job Role Admin": ""
    },
    mode: "onBlur"
  });
  const onSubmit = async (values: FormValues) => {
    setCreating(true);
    try {
      // Check for duplicate name and email combination
      const isDuplicate = candidates.some(candidate => 
        candidate.Name?.toLowerCase().trim() === values.Name.toLowerCase().trim() &&
        candidate.Email?.toLowerCase().trim() === values.Email.toLowerCase().trim()
      );

      if (isDuplicate) {
        toast({
          title: "Duplicate candidate",
          description: "A candidate with this name and email combination already exists.",
          variant: "destructive"
        });
        return;
      }

      console.log('Sending candidate data:', toLite(values));
      const res = await createCandidate(toLite(values));
      console.log('Create response:', res);
      if ((res as any).success === false) throw new Error((res as any).message || "Failed");
      toast({
        title: "Candidate added",
        description: "The candidate was saved successfully."
      });
      form.reset();
      refetch();
    } catch (e: any) {
      toast({
        title: "Failed to add candidate",
        description: e.message || String(e)
      });
    } finally {
      setCreating(false);
    }
  };
  const startEdit = (row: any) => {
    const v: FormValues = {
      Name: row.Name || "",
      Email: (row.Email || "").toLowerCase(),
      "Phone Number": row["Phone Number"] || "",
      "Job Role Admin": row["Job Role Admin"] || ""
    };
    setEditing(v);
    setOpenEdit(true);
  };
  const saveEdit = async (values: FormValues, original: FormValues) => {
    setSavingEdit(true);
    try {
      console.log('Updating candidate data:', toLite(values));
      const res = await updateCandidate({
        keyName: original.Name,
        keyEmail: original.Email
      }, toLite(values));
      console.log('Update response:', res);
      if ((res as any).success === false) throw new Error((res as any).message || "Failed");

      toast({
        title: "Candidate updated",
        description: "Changes were saved."
      });
      setOpenEdit(false);
      setEditing(null);
      refetch();
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e.message || String(e)
      });
    } finally {
      setSavingEdit(false);
    }
  };
  const confirmDelete = async (row: any) => {
    setDeletingPending(true);
    try {
      const res = await deleteCandidate({
        keyName: row.Name,
        keyEmail: row.Email
      });
      if ((res as any).success === false) throw new Error((res as any).message || "Failed");
      
      toast({
        title: "Candidate deleted",
        description: "The record was removed."
      });
      setDeleting(null);
      refetch();
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e.message || String(e)
      });
    } finally {
      setDeletingPending(false);
    }
  };
  return <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto max-w-7xl px-4 py-6 space-y-8">
        {/* Form Section */}
        <Card className="p-6 bg-surface border-card-border shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">Manage Candidates</h1>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => refetch()}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4" /> Refresh
                </>
              )}
            </Button>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <FormField control={form.control} name="Name" render={({
              field
            }) => <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="Email" render={({
              field
            }) => <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="example@gmail.com" {...field} />
                    </FormControl>
                    
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="Phone Number" render={({
              field
            }) => <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="919876543210" {...field} />
                    </FormControl>
                    
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="Job Role Admin" render={({
              field
            }) => <FormItem>
                    <FormLabel>Job Role Admin</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. BDE" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <div className="md:col-span-2 lg:col-span-4 flex justify-end pt-2">
                <Button type="submit" className="gap-2" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" /> Submit
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Card>

        {/* Table Section */}
        <Card className="p-0 bg-surface border-card-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-card-border">
            <h2 className="text-lg font-medium text-foreground">Candidate Details</h2>
          </div>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Job Role Admin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-52" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-8 w-24 ml-auto" />
                        </TableCell>
                    </TableRow>
                  ))
                }
                {!loading && candidates.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{row.Name}</TableCell>
                    <TableCell className="truncate max-w-[240px]">{row.Email}</TableCell>
                    <TableCell>{row["Phone Number"]}</TableCell>
                    <TableCell>{row["Job Role Admin"]}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row["Interview Status"] || row["Interview Scheduled"] || row["Interview Date"] ? 
                        'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {row["Interview Status"] || row["Interview Scheduled"] || row["Interview Date"] ? 'Completed' : 'Pending'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog open={openEdit && editing?.Email === row.Email && editing?.Name === row.Name} onOpenChange={o => !o && setOpenEdit(false)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => startEdit(row)}>
                              <Pencil className="h-4 w-4" /> Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Candidate</DialogTitle>
                              <DialogDescription>Update details and save changes.</DialogDescription>
                            </DialogHeader>
                            {editing && <EditForm initial={editing} saving={savingEdit} onCancel={() => setOpenEdit(false)} onSave={vals => saveEdit(vals, editing)} />}
                            <DialogFooter />
                          </DialogContent>
                        </Dialog>

                        <AlertDialog open={deleting?.Email === row.Email && deleting?.Name === row.Name} onOpenChange={(o) => { if (!o && !deletingPending) setDeleting(null); }}>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="gap-2" onClick={() => setDeleting({
                          Name: row.Name,
                          Email: row.Email
                        })}>
                              <Trash2 className="h-4 w-4" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete candidate?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently remove the candidate from the sheet.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={deletingPending}>Cancel</AlertDialogCancel>
                                <Button
                                  variant="destructive"
                                  onClick={() => deleting && confirmDelete(deleting)}
                                  disabled={deletingPending}
                                  className="gap-2"
                                >
                                  {deletingPending ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                                    </>
                                  ) : (
                                    <>Delete</>
                                  )}
                                </Button>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && candidates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No candidates found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
    </div>;
};
const EditForm: React.FC<{
  initial: FormValues;
  saving?: boolean;
  onSave: (v: FormValues) => void;
  onCancel: () => void;
}> = ({
  initial,
  saving,
  onSave,
  onCancel
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
  });
  return <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField control={form.control} name="Name" render={({
        field
      }) => <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>} />
        <FormField control={form.control} name="Email" render={({
        field
      }) => <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>} />
        <FormField control={form.control} name="Phone Number" render={({
        field
      }) => <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>} />
        <FormField control={form.control} name="Job Role Admin" render={({
        field
      }) => <FormItem>
              <FormLabel>Job Role Admin</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>} />
        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </form>
    </Form>;
};
export default ManageCandidates;