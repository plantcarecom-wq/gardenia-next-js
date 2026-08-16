import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { PostModel } from '@/modules/content/infrastructure/post.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { z } from 'zod';

const postSchema = z.object({
  title: z.string().trim().min(3).max(150),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(150)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must be lowercase letters/numbers separated by hyphens'),
  excerpt: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1),
  coverImageMediaId: z.string().optional(),
  isPublished: z.boolean().default(false),
});

/**
 * GET /api/v1/blog — public: published posts only, newest first.
 * GET /api/v1/blog?all=true — Super Admin only: every post, for the admin list.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const all = req.nextUrl.searchParams.get('all') === 'true';

    if (all) {
      const auth = await requireRole([Roles.SUPER_ADMIN]);
      if (!auth.authorized) return auth.response;
      const posts = await PostModel.find().sort({ createdAt: -1 }).lean();
      return NextResponse.json({ success: true, data: posts });
    }

    const posts = await PostModel.find({ isPublished: true }).sort({ publishedAt: -1 }).lean();
    return NextResponse.json({ success: true, data: posts });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole([Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();
    const existing = await PostModel.findOne({ slug: parsed.data.slug });
    if (existing) {
      return NextResponse.json({ success: false, error: 'A post with this slug already exists' }, { status: 409 });
    }

    const post = await PostModel.create({
      ...parsed.data,
      authorId: auth.user?.id,
      publishedAt: parsed.data.isPublished ? new Date() : undefined,
    });

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
