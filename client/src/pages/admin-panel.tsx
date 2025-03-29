import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, SavedArticle } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { Shield, Users, BookOpenText, ClipboardList, Trash2, ChevronRight } from 'lucide-react';

// Define a type for admin logs
type AdminLog = {
  id: number;
  admin_id: number;
  action: string;
  target_type: string;
  target_id: string;
  details: string | null;
  created_at: string;
};

// User type without password
type UserWithoutPassword = Omit<User, 'password'>;

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if current user is admin
  if (!user?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Shield className="h-16 w-16 text-gray-400 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-500">You don't have permission to access the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, content, and monitor admin activity</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <BookOpenText className="h-4 w-4" />
            <span>Content</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>Activity Logs</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <UsersTab currentUserId={user.id} />
        </TabsContent>
        
        <TabsContent value="content">
          <ContentTab />
        </TabsContent>
        
        <TabsContent value="logs">
          <LogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersTab({ currentUserId }: { currentUserId: number }) {
  const { toast } = useToast();
  
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<UserWithoutPassword[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/users');
      return await res.json();
    }
  });

  // Mutation for updating user admin status
  const updateAdminStatusMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number, isAdmin: boolean }) => {
      const res = await apiRequest('PUT', `/api/admin/users/${userId}/admin-status`, {
        isAdmin
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'Admin status updated',
        description: 'User admin status has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update admin status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation for deleting user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'User deleted',
        description: 'User has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete user',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoadingUsers) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span>User Management</span>
        </CardTitle>
        <CardDescription>
          Manage user accounts and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.id !== currentUserId ? (
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={user.is_admin || false} 
                        onCheckedChange={(checked) => {
                          updateAdminStatusMutation.mutate({ userId: user.id, isAdmin: checked });
                        }}
                        disabled={updateAdminStatusMutation.isPending}
                      />
                      <Label>{user.is_admin ? "Admin" : "User"}</Label>
                    </div>
                  ) : (
                    <Badge>Current User</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true }) : 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  {user.id !== currentUserId ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user account and all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteUserMutation.mutate(user.id)}
                            disabled={deleteUserMutation.isPending}
                          >
                            {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button variant="outline" size="sm" disabled>Current User</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ContentTab() {
  const { toast } = useToast();
  
  const { data: articles = [], isLoading: isLoadingArticles } = useQuery<SavedArticle[]>({
    queryKey: ['/api/admin/saved-articles'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/saved-articles');
      return await res.json();
    }
  });

  const [selectedArticle, setSelectedArticle] = useState<SavedArticle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoadingArticles) {
    return <div className="text-center py-8">Loading content...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpenText className="h-5 w-5" />
          <span>Content Management</span>
        </CardTitle>
        <CardDescription>
          Monitor and manage saved articles across all users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date Saved</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((article) => (
              <TableRow key={article.id}>
                <TableCell>{article.id}</TableCell>
                <TableCell className="max-w-[300px] truncate">{article.title}</TableCell>
                <TableCell>{article.user_id}</TableCell>
                <TableCell>{article.category || 'N/A'}</TableCell>
                <TableCell>
                  {article.saved_at ? formatDistanceToNow(new Date(article.saved_at), { addSuffix: true }) : 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedArticle(article);
                      setDialogOpen(true);
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl">
            {selectedArticle && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedArticle.title}</DialogTitle>
                  <DialogDescription>
                    Saved by User ID: {selectedArticle.user_id} • {selectedArticle.category || 'Uncategorized'}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-1 gap-4 py-4">
                  {selectedArticle.image_url && (
                    <div className="aspect-video overflow-hidden rounded-md">
                      <img 
                        src={selectedArticle.image_url} 
                        alt={selectedArticle.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Description</h3>
                    <p className="text-muted-foreground">{selectedArticle.description || 'No description available.'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium">Source</h3>
                      <p className="text-muted-foreground">{selectedArticle.source || 'Unknown'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Published</h3>
                      <p className="text-muted-foreground">{selectedArticle.published_at || 'Unknown'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">URL</h3>
                    <a 
                      href={selectedArticle.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-all"
                    >
                      {selectedArticle.url}
                    </a>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function LogsTab() {
  const { data: logs = [], isLoading: isLoadingLogs } = useQuery<AdminLog[]>({
    queryKey: ['/api/admin/logs'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/logs');
      return await res.json();
    }
  });

  if (isLoadingLogs) {
    return <div className="text-center py-8">Loading logs...</div>;
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'DELETE_USER':
        return 'bg-red-100 text-red-800';
      case 'GRANT_ADMIN':
        return 'bg-green-100 text-green-800';
      case 'REVOKE_ADMIN':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          <span>Admin Activity Logs</span>
        </CardTitle>
        <CardDescription>
          Monitor all administrative actions performed in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No admin activity logs found.
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getActionColor(log.action)}>
                        {log.action.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Admin ID: {log.admin_id}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Target Type:</span> {log.target_type}
                    </div>
                    <div>
                      <span className="font-medium">Target ID:</span> {log.target_id}
                    </div>
                  </div>
                  {log.details && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Details:</span> {log.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}