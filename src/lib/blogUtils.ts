import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { TimezoneService } from './timezoneService';

export interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  readTime: string;
  category: string;
  content: string;
  excerpt: string;
}

export function getBlogPosts(): BlogPost[] {
  const blogsDirectory = path.join(process.cwd(), 'docs/blogs');
  
  try {
    // Check if directory exists
    if (!fs.existsSync(blogsDirectory)) {
      console.warn('Blogs directory not found:', blogsDirectory);
      return [];
    }

    const fileNames = fs.readdirSync(blogsDirectory);
    const markdownFiles = fileNames.filter(fileName => fileName.endsWith('.md'));

    const blogPosts: BlogPost[] = [];

    for (const fileName of markdownFiles) {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(blogsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');

      // Parse frontmatter if it exists, otherwise parse the content directly
      let parsedContent: any;
      let content: string;
      let title: string;
      let subtitle: string;
      let date: string;
      let readTime: string;
      let category: string;

      try {
        // Try to parse as frontmatter first
        parsedContent = matter(fileContents);
        content = parsedContent.content;
        
        // Extract title from first H1 header
        const titleMatch = content.match(/^#\s+(.+)$/m);
        title = titleMatch ? titleMatch[1].trim() : slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Extract subtitle from first paragraph after title
        const lines = content.split('\n');
        let subtitleFound = false;
        subtitle = '';
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('#') && !subtitleFound) {
            continue; // Skip headers
          }
          if (line && !line.startsWith('#') && !line.startsWith('---')) {
            subtitle = line;
            subtitleFound = true;
            break;
          }
        }
        
        // Use frontmatter values if available, otherwise use UTC as default
        date = parsedContent.data.date || TimezoneService.getTodayDateStringInTimezone('UTC');
        readTime = parsedContent.data.readTime || calculateReadTime(content);
        category = parsedContent.data.category || 'General';
        
      } catch (error) {
        // Fallback: parse content directly
        content = fileContents;
        
        // Extract title from first H1 header
        const titleMatch = content.match(/^#\s+(.+)$/m);
        title = titleMatch ? titleMatch[1].trim() : slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Extract subtitle from first paragraph after title
        const lines = content.split('\n');
        let subtitleFound = false;
        subtitle = '';
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('#') && !subtitleFound) {
            continue; // Skip headers
          }
          if (line && !line.startsWith('#') && !line.startsWith('---')) {
            subtitle = line;
            subtitleFound = true;
            break;
          }
        }
        
        // Use defaults
        date = TimezoneService.getTodayDateStringInTimezone('UTC');
        readTime = calculateReadTime(content);
        category = 'General';
      }

      // Create excerpt from subtitle or first few sentences
      const excerpt = subtitle || content.split('\n').find(line => 
        line.trim() && !line.trim().startsWith('#') && !line.trim().startsWith('---')
      )?.trim() || '';

      blogPosts.push({
        slug,
        title,
        subtitle,
        date,
        readTime,
        category,
        content,
        excerpt: excerpt.length > 150 ? excerpt.substring(0, 150) + '...' : excerpt
      });
    }

    // Sort by date (newest first)
    return blogPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
  } catch (error) {
    console.error('Error reading blog posts:', error);
    return [];
  }
}

export function getBlogPost(slug: string): BlogPost | null {
  const blogPosts = getBlogPosts();
  return blogPosts.find(post => post.slug === slug) || null;
}

function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
}
