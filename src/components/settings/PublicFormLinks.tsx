import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Copy, Trash2, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';
import { useFormLinks, useUpdateFormLink, useDeleteFormLink } from '@/hooks/usePublicRequest';
import { useSystemSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { CreateFormLinkDialog } from './CreateFormLinkDialog';

const DEFAULT_DOMAIN = 'https://ride-buddy-lgh.lovable.app';

type FormLinkWithDepartment = {
  id: string;
  token: string;
  name: string;
  description: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string | null;
  department?: { id: string; name: string; code: string } | null;
  [key: string]: unknown;
};

export function PublicFormLinks() {
  const { data: links, isLoading } = useFormLinks();
  const { data: settings } = useSystemSettings();
  const updateMutation = useUpdateFormLink();
  const deleteMutation = useDeleteFormLink();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);

  const publishedDomain = useMemo(() => {
    const generalSettings = settings?.find(s => s.key === 'general');
    const domain = (generalSettings?.value as Record<string, string>)?.published_domain;
    return domain || DEFAULT_DOMAIN;
  }, [settings]);

  const getPublicUrl = (token: string) => {
    return `${publishedDomain}/#/request/${token}`;
  };

  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(getPublicUrl(token));
    toast.success('Link copied to clipboard');
  };

  const toggleActive = async (id: string, currentlyActive: boolean) => {
    await updateMutation.mutateAsync({ id, is_active: !currentlyActive });
    queryClient.invalidateQueries({ queryKey: ['form-links'] });
  };

  const handleDelete = async () => {
    if (!linkToDelete) return;
    await deleteMutation.mutateAsync(linkToDelete);
    queryClient.invalidateQueries({ queryKey: ['form-links'] });
    setDeleteDialogOpen(false);
    setLinkToDelete(null);
  };

  const confirmDelete = (id: string) => {
    setLinkToDelete(id);
    setDeleteDialogOpen(true);
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getExpiryBadge = (expiresAt: string | null) => {
    if (!expiresAt) return <Badge variant="secondary">No Expiry</Badge>;
    if (isExpired(expiresAt)) return <Badge variant="destructive">Expired</Badge>;
    return <Badge variant="outline">{format(new Date(expiresAt), 'MMM d, yyyy')}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Public Form Links</CardTitle>
            <CardDescription>
              Create shareable links that allow external users to submit travel requests without logging in.
            </CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Link
          </Button>
        </CardHeader>
        <CardContent>
          {links && links.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead className="text-center">Submissions</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(links as FormLinkWithDepartment[]).map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{link.name}</p>
                        {link.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {link.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {link.department ? (
                        <Badge variant="outline">
                          {link.department.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(link.token)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={getPublicUrl(link.token)} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{link.submission_count}</Badge>
                    </TableCell>
                    <TableCell>{getExpiryBadge(link.expires_at)}</TableCell>
                    <TableCell className="text-center">
                      {link.is_active && !isExpired(link.expires_at) ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(link.id, link.is_active)}
                          disabled={updateMutation.isPending}
                        >
                        {link.is_active ? (
                            <ToggleRight className="h-4 w-4 text-primary" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDelete(link.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No form links created yet.</p>
              <p className="text-sm">Create your first link to allow external users to submit requests.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateFormLinkDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this form link? This action cannot be undone.
              Existing submissions will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
