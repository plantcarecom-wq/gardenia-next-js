import Link from 'next/link';
import { Newspaper, ChevronRight } from 'lucide-react';
import { connectDB } from '@/shared/lib/db';
import { PostModel } from '@/modules/content/infrastructure/post.model';
import { formatDate } from '@/shared/lib/date';

export const dynamic = 'force-dynamic';

async function getPosts() {
  await connectDB();
  const posts = await PostModel.find({ isPublished: true }).sort({ publishedAt: -1 }).lean();
  return JSON.parse(JSON.stringify(posts));
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20">
      <div className="bg-emerald-900 text-white py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Plant Care Guides</h1>
          <p className="text-emerald-100 max-w-2xl text-lg">Practical tips and guides to help your plants thrive, from watering basics to seasonal care.</p>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border">
            <Newspaper className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No articles yet</h3>
            <p className="text-muted-foreground">Check back soon for plant care guides.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: { _id: string; title: string; slug: string; excerpt: string; publishedAt: string }) => (
              <Link key={post._id} href={`/blog/${post.slug}`}>
                <article className="h-full bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex flex-col">
                  <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">
                    {formatDate(post.publishedAt)}
                  </span>
                  <h2 className="font-bold text-lg mb-2 line-clamp-2">{post.title}</h2>
                  <p className="text-muted-foreground text-sm line-clamp-3 flex-1">{post.excerpt}</p>
                  <span className="text-sm font-medium text-emerald-600 flex items-center mt-4">
                    Read more <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
