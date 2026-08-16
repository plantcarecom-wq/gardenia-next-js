import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { connectDB } from '@/shared/lib/db';
import { PostModel } from '@/modules/content/infrastructure/post.model';
import { formatDate } from '@/shared/lib/date';

export const dynamic = 'force-dynamic';

async function getPost(slug: string) {
  await connectDB();
  const post = await PostModel.findOne({ slug, isPublished: true }).lean();
  return post ? JSON.parse(JSON.stringify(post)) : null;
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-3xl">
        <Link href="/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-emerald-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Guides
        </Link>

        <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
          {formatDate(post.publishedAt)}
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2 mb-6">{post.title}</h1>

        <div className="prose prose-emerald dark:prose-invert max-w-none">
          {post.body.split('\n').filter((p: string) => p.trim()).map((paragraph: string, i: number) => (
            <p key={i} className="text-muted-foreground leading-relaxed mb-4">{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
