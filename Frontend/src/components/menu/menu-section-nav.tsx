"use client";

import { useEffect, useState } from "react";

interface Section {
  id: string;
  name: string;
  count: number;
}

// A sticky, horizontally scrollable row of section chips that highlights the
// section currently on screen. On a phone this is the whole navigation for a
// long menu, so it sits directly under the header and never scrolls away.
export function MenuSectionNav({ sections }: { sections: Section[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const headings = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el !== null);

    if (headings.length === 0) return;

    // The band starts just above where an anchored heading comes to rest
    // (scroll-mt-36 = 144px) — any lower and jumping to #desserts would leave
    // "Main Items" highlighted — and ends before the fold so the active chip
    // tracks the section being read, not whichever touches the viewport edge.
    // While nothing is inside the band the last match stays active, which is
    // what keeps a long section highlighted all the way through.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-136px 0px -60% 0px", threshold: 0 },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length < 2) return null;

  return (
    <div className="sticky top-16 z-30 -mx-4 border-b border-border/70 bg-background/95 px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-20">
      <nav
        aria-label="Menu sections"
        className="mx-auto flex max-w-7xl gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sections.map((section) => {
          const isActive = section.id === activeId;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={isActive ? "true" : undefined}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-bold transition-colors ${
                isActive
                  ? "bg-foreground text-background"
                  : "border border-border bg-card hover:border-foreground/30"
              }`}
            >
              {section.name}
              <span className={isActive ? "text-background/60" : "text-muted-foreground"}>
                {section.count}
              </span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
