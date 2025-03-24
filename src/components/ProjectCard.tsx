import { slugifyStr } from "@utils/slugify";
import type { CollectionEntry } from "astro:content";

export interface Props {
  project: CollectionEntry<"projects">;
  secHeading?: boolean;
}

export default function ProjectCard({ project, secHeading = true }: Props) {
  const { data, slug } = project;
  const { venue, title, tag, description, imgpath, youtubeId, href } = data;
  
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
        {imgpath ? (
          // Display image if imgpath is provided
          <img 
            src={imgpath} 
            alt={title} 
            className="w-3/4 object-center object-cover p-4" 
          />
        ) : youtubeId ? (
          // Display YouTube video if youtubeId is provided
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
        ) : null}
      </div>

      {description && <p>{description}</p>}
    </li>
  );
}