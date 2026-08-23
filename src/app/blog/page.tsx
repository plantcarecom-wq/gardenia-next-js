import Link from 'next/link';
import { Newspaper, ArrowRight } from 'lucide-react';
import { connectDB } from '@/shared/lib/db';
import { PostModel } from '@/modules/content/infrastructure/post.model';
import { formatDate } from '@/shared/lib/date';
import { resolveProductImages } from '@/shared/lib/resolve-product-images';
import { Container } from '@/shared/components/Container';

export const dynamic = 'force-dynamic';

async function getPosts() {
  await connectDB();
  const posts = await PostModel.find({ isPublished: true }).sort({ publishedAt: -1 }).lean();
  // Reuses the product-image resolver: a post's coverImageMediaId maps onto
  // the same shape (imageMediaIds[]) that resolver already knows how to turn
  // into a real URL, so no separate resolver is needed for one field.
  const withCoverIds = posts.map((p: any) => ({
    ...p,
    imageMediaIds: p.coverImageMediaId ? [p.coverImageMediaId] : [],
  }));
  const resolved = await resolveProductImages(JSON.parse(JSON.stringify(withCoverIds)));
  return resolved.map((p: any) => ({ ...p, coverImageUrl: p.images[0] }));
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background pb-20">
      <div className="bg-background border-b border-border py-16 md:py-24 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black dark:bg-[#0a0a0a] z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[120px] animate-float" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20" />
        </div>
        <Container size="wide" className="relative z-10 flex flex-col items-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 text-white bg-clip-text text-transparent bg-gradient-to-br from-white to-white/70">Plant Care Guides</h1>
          <p className="text-gray-400 max-w-2xl text-lg md:text-xl">Practical tips and guides to help your plants thrive, from watering basics to seasonal care.</p>
        </Container>
      </div>

      <Container size="wide" className="py-12">
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border">
            <Newspaper className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No articles yet</h3>
            <p className="text-muted-foreground">Check back soon for plant care guides.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: { _id: string; title: string; slug: string; excerpt: string; publishedAt: string; coverImageUrl?: string }) => (
              <Link
                key={post._id}
                href={`/blog/${post.slug}`}
                className="group/card flex flex-col h-full bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-emerald-500/30 shadow-md hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-500"
              >
                <div className="relative w-full aspect-[16/9] shrink-0 overflow-hidden bg-muted/30">
                  {post.coverImageUrl ? (
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="object-cover w-full h-full group-hover/card:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent">
                      <Newspaper className="w-10 h-10 text-emerald-500/40" />
                    </div>
                  )}
                  {/* Overlay Action */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="translate-y-4 group-hover/card:translate-y-0 transition-transform duration-300 flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 text-xs font-semibold tracking-wide">
                      Read More <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-2 p-5">
                  <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                    {formatDate(post.publishedAt)}
                  </span>
                  <h2 className="font-bold text-lg leading-snug line-clamp-2 group-hover/card:text-emerald-500 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground text-sm line-clamp-2 flex-1">{post.excerpt}</p>
                  <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1 mt-auto pt-1">
                    Read more <ArrowRight className="w-4 h-4 group-hover/card:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
