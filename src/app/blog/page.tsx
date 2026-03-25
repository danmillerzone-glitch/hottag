import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import type { Metadata } from 'next'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Dev Blog - Hot Tag',
  description: 'Updates and development notes from the Hot Tag team.',
}

export default async function BlogPage() {
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, content, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-display font-bold flex items-center gap-3 mb-2">
        <FileText className="w-8 h-8 text-accent" />
        Dev Blog
      </h1>
      <p className="text-foreground-muted mb-10">Updates and development notes from the Hot Tag team.</p>

      {(!posts || posts.length === 0) ? (
        <p className="text-foreground-muted text-center py-16">No posts yet. Check back soon!</p>
      ) : (
        <div className="space-y-8">
          {posts.map(post => (
            <article key={post.id} className="group">
              <Link href={`/blog/${post.slug}`} className="block">
                <time className="text-xs text-foreground-muted">
                  {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
                <h2 className="text-xl font-display font-bold mt-1 group-hover:text-accent transition-colors">
                  {post.title}
                </h2>
                <p className="text-foreground-muted mt-2 line-clamp-3">
                  {post.content.slice(0, 200).replace(/[#*_\[\]]/g, '')}
                  {post.content.length > 200 ? '...' : ''}
                </p>
              </Link>
              <div className="border-b border-border/50 mt-8" />
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
