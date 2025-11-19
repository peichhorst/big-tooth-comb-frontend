// app/page.tsx — FINAL. BLOCKS WORK. NO PAIN.
import Image from "next/image";
import Link from "next/link";
import { gqlFetch } from "@/lib/graphql";
import ReverbNationWidget from "./components/ReverbNationWidget";
import PageBanner from "./components/PageBanner";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  featuredImage?: { node?: { sourceUrl?: string; altText?: string } };
};

export default async function Home() {
  let title = "Page Title";
  let slogan = "Slogan";
  let hero = "/hero-1.jpg";
  let content = "";
  let posts: Post[] = [];
  const cleanSlogan = (s: string) =>
    s?.replace(/&#0*39;|&#8217;|&apos;/gi, "'") ?? s;

  
  try {
    const data = await gqlFetch(`
      query Home {
        page(id: "/", idType: URI) {
          title
          content
          featuredImage { node { sourceUrl } }
        }
        generalSettings { title description }
        posts(first: 3, where: { orderby: { field: DATE, order: DESC } }) {
          nodes {
            id
            title
            slug
            excerpt
            date
            featuredImage { node { sourceUrl altText } }
          }
        }
      }
    `);

    title = data.generalSettings?.title?.toUpperCase() ?? title;
    slogan = data.generalSettings?.description || slogan;
    hero = data.page?.featuredImage?.node?.sourceUrl || hero;
    content = data.page?.content || "";
    posts = data.posts?.nodes || [];
  } catch (e) {
    console.error("Home query failed", e);
  }

  return (
    <>
      {/* HERO */}
      <section
        className="relative min-h-[90vh] flex items-center justify-center bg-cover bg-center py-10 md:py-14"
        style={{ backgroundImage: `linear-gradient(#0008,#0000), url('${hero}')` }}
      >
        <div className="text-center px-6 z-10">
          <h1 className="glitch hero-glow font-display text-7xl md:text-9xl font-black text-white drop-shadow-2xl">
            {title}
          </h1>
          <p className="mt-8 font-creepy text-4xl md:text-6xl text-white slogan-fade">
            {cleanSlogan(slogan)}
          </p>
          <div className="mt-10">
            <Link
              href="/shows"
              className="inline-block bg-[#f2851f] text-black font-black px-8 py-3 rounded-full shadow-lg btn-glow"
            >
              View Upcoming Shows
            </Link>

          </div>
        </div>
      </section>

      {/* GUTENBERG BLOCKS — RENDER PERFECTLY */}
      <section className="max-w-7xl mx-auto px-6 pt-10">
        <div
          className="prose prose-invert prose-lg max-w-none
                     prose-headings:font-black prose-headings:text-blood-400
                     prose-a:text-blood-300 hover:prose-a:text-white
                     prose-img:rounded-xl prose-img:shadow-2xl prose-img:mx-auto
                     prose-blockquote:border-l-blood-600"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </section>


        
      {/* LATEST POSTS */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <PageBanner title="LATEST UPDATES" containerClassName="max-w-7xl" />
        <div className="grid md:grid-cols-3 gap-10">
          {posts.map((post) => (
            <article key={post.id} className="border-2 border-blood-800 rounded-xl overflow-hidden bg-black/60">
              {post.featuredImage?.node?.sourceUrl && (
                <Image
                  src={post.featuredImage.node.sourceUrl}
                  width={800}
                  height={533}
                  alt={post.featuredImage.node.altText || post.title}
                  className="w-full"
                />
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-blood-300">{post.title}</h3>
                <div className="mt-4 text-gray-300 line-clamp-3" dangerouslySetInnerHTML={{ __html: post.excerpt }} />
                <Link href={`/posts/${post.slug}`} className="mt-6 inline-block text-blood-500 hover:text-white font-bold">
                  READ MORE →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
