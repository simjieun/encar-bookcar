import Image from "next/image";
import { BookOpen } from "lucide-react";

export function BookCover({
  src,
  title,
  priority = false,
}: {
  src: string | null;
  title: string;
  priority?: boolean;
}) {
  return (
    <div className="real-book-cover">
      {src ? (
        <Image
          src={src}
          alt={`${title} 표지`}
          fill
          sizes="(max-width: 640px) 44vw, (max-width: 1100px) 25vw, 220px"
          className="object-cover"
          priority={priority}
        />
      ) : (
        <div className="book-cover-fallback">
          <BookOpen size={30} aria-hidden="true" />
          <strong>{title}</strong>
        </div>
      )}
    </div>
  );
}
