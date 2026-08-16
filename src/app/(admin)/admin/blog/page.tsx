'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Newspaper, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/shared/lib/date';
import { cn } from '@/lib/utils';

type Post = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
};

const emptyForm = { title: '', slug: '', excerpt: '', body: '', isPublished: false };

function slugify(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/blog?all=true');
      const data = await res.json();
      if (data.success) setPosts(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setSlugTouched(false);
    setError('');
    setIsDialogOpen(true);
  };

  const openEdit = (p: Post) => {
    setEditing(p);
    setFormData({ title: p.title, slug: p.slug, excerpt: p.excerpt, body: p.body, isPublished: p.isPublished });
    setSlugTouched(true);
    setError('');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const url = editing ? `/api/v1/blog/${editing._id}` : '/api/v1/blog';
    const method = editing ? 'PUT' : 'POST';
    const payload = editing
      ? { title: formData.title, excerpt: formData.excerpt, body: formData.body, isPublished: formData.isPublished }
      : formData;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) {
      setError(typeof data.error === 'string' ? data.error : 'Could not save post');
      return;
    }
    setIsDialogOpen(false);
    fetchData();
  };

  const togglePublished = async (p: Post) => {
    await fetch(`/api/v1/blog/${p._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !p.isPublished }),
    });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await fetch(`/api/v1/blog/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
          <p className="text-muted-foreground mt-1">Plant-care articles and guides.</p>
        </div>
        <Button onClick={openCreate} className="shadow-md">
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            All Posts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No posts yet.</TableCell>
                  </TableRow>
                ) : (
                  posts.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell><code className="bg-muted px-2 py-1 rounded text-xs">{p.slug}</code></TableCell>
                      <TableCell>
                        <Badge variant={p.isPublished ? 'default' : 'outline'}>{p.isPublished ? 'Published' : 'Draft'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.publishedAt ? formatDate(p.publishedAt) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch checked={p.isPublished} onCheckedChange={() => togglePublished(p)} className="data-[state=checked]:bg-green-500 mr-1 align-middle" />
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p._id)} className="hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg overflow-y-auto max-h-screen">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Post' : 'New Post'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setFormData((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
                  }}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => { setSlugTouched(true); setFormData({ ...formData, slug: e.target.value }); }}
                  disabled={!!editing}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={2}
                  className={cn(
                    'w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30 resize-y'
                  )}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="body">Body</Label>
                <textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows={8}
                  className={cn(
                    'w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30 resize-y'
                  )}
                  required
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <Label htmlFor="isPublished" className="cursor-pointer">Published</Label>
                <Switch id="isPublished" checked={formData.isPublished} onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? 'Save Changes' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
