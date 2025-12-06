import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('blog');
  const items = posts.map(p => {
    const body = p.body || "";
    const firstPara = (body.split(/\n{2,}/)[0] || "").trim();
    return {
      title: p.data.title,
      summary: p.data.description || firstPara,
      firstParagraph: firstPara,
      url: `/blog/${p.slug}/`,
      pubDate: (p.data.pubDate || p.data.date || new Date()).toString()
    };
  }).sort((a,b)=> new Date(b.pubDate) - new Date(a.pubDate));
  return new Response(JSON.stringify({ items }), { headers: { 'Content-Type': 'application/json' }});
}
