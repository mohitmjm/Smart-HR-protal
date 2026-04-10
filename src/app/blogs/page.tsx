
import { Metadata } from 'next';
import { getBlogPosts } from '@/lib/blogUtils';
import BlogFilters from '@/components/BlogFilters';

export const metadata: Metadata = {
  title: 'Blogs - Tielo',
  description: 'Insights, guides, and thoughts on technology, business, and development',
};

export default function BlogsPage() {
  const blogs = getBlogPosts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Our Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Insights, guides, and practical advice for founders, developers, and business leaders
          </p>
        </div>

        {/* Category Filter Tags */}
        <BlogFilters blogs={blogs} />
      </div>
    </div>
  );
}
