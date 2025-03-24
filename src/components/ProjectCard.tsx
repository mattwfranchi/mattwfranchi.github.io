import { slugifyStr } from "@utils/slugify";
import type { CollectionEntry } from "astro:content";

export interface Props {
  project: CollectionEntry<"projects">;
  secHeading?: boolean;
}

export default function ProjectCard({ project, secHeading = true }: Props) {
  const { data, slug } = project;
  const { venue, title, tag, description, youtubeId, href } = data;
  // Removed imgpath from destructuring since we're not using it anymore
  
  // Function to get YouTube embed URL from ID or full URL
  const getYoutubeEmbedUrl = (id: string) => {
    // Check if it's already an ID or a full URL
    if (id.includes('youtube.com') || id.includes('youtu.be')) {
      // Extract ID from URL
      const urlObj = new URL(id);
      if (id.includes('youtube.com')) {
        return `https://www.youtube.com/embed/${urlObj.searchParams.get('v')}`;
      } else if (id.includes('youtu.be')) {
        return `https://www.youtube.com/embed/${urlObj.pathname.substring(1)}`;
      }
    }
    // Assume it's already an ID
    return `https://www.youtube.com/embed/${id}`;
  };

  const headerProps = {
    style: { viewTransitionName: slugifyStr(title) },
    className: "text-lg font-medium decoration-dashed hover:underline",
  };

  return (
    <li className="my-6 project-card">
      <div>
        <span className="project-venue">{venue}</span>{" "}
        {tag && <span className="project-tag">{tag}</span>}
        <br />
      </div>
      
      <a
        href={href}
        className="inline-block text-lg font-medium text-skin-accent decoration-dashed underline-offset-4 focus-visible:no-underline focus-visible:underline-offset-0"
        target="_blank"
        rel="noopener noreferrer"
      >
        {secHeading ? (
          <h2 {...headerProps}>{title}</h2>
        ) : (
          <h3 {...headerProps}>{title}</h3>
        )}
      </a>

      <div className="flex justify-center">
        {data.image ? (
          // Use the optimized image from the schema with debugging
          <>
            {console.log(`[ProjectCard Debug] Image data for "${title}":`, 
              {
                src: data.image.src,
                width: data.image.width,
                height: data.image.height,
                imageType: typeof data.image,
                hasProps: !!data.image.src && !!data.image.width && !!data.image.height
              }
            )}
            {data.image.src ? (
              <img 
                src={data.image.src} 
                alt={title} 
                className="w-3/4 object-center object-cover p-4"
                width={data.image.width}
                height={data.image.height}
                loading="lazy"
                onError={(e) => {
                  console.error(`[ProjectCard Error] Failed to load image for "${title}":`, e);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => console.log(`[ProjectCard Success] Image loaded for "${title}"`)}
              />
            ) : (
              <div className="w-3/4 p-4 bg-red-100 text-red-800">
                Image source missing for: {title}
              </div>
            )}
          </>
        ) : youtubeId ? (
          // Display YouTube video
          <div className="w-3/4 p-4 aspect-video">
            <iframe
              className="w-full h-full"
              src={getYoutubeEmbedUrl(youtubeId)}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>
        ) : (
          // Fallback when no image or video is available
          <div className="w-3/4 p-4 bg-yellow-100 text-yellow-800">
            No image or video available for: {title}
          </div>
        )}
      </div>

      {description && <p>{description}</p>}
    </li>
  );
}