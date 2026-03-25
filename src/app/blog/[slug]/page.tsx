import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, content')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) return { title: 'Post Not Found - Hot Tag' }

  return {
    title: `${post.title} - Hot Tag Dev Blog`,
    description: post.content.slice(0, 160).replace(/[#*_\[\]]/g, ''),
  }
}

function renderMarkdown(text: string): string {
  return text
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-accent hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-background-tertiary px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-border my-6" />')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p class="mb-4">')
    // Single newlines within paragraphs
    .replace(/\n/g, '<br />')
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-accent transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to blog
      </Link>

      <article>
        <time className="text-sm text-foreground-muted">
          {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </time>
        <h1 className="text-3xl font-display font-bold mt-2 mb-8">{post.title}</h1>

        <div
          className="prose prose-invert max-w-none text-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: `<p class="mb-4">${renderMarkdown(post.content)}</p>` }}
        />
      </article>
    </div>
  )
}
