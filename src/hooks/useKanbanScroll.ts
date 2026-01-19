/**
 * Custom hook for managing smooth scroll behavior in KanbanBoard
 */

import { useCallback, useRef } from "preact/hooks";

// Helper function for custom smooth scrolling
function customSmoothScrollTo(
  element: HTMLElement,
  to: number,
  duration: number,
) {
  const start = element.scrollLeft;
  const change = to - start;
  let currentTime = 0;
  const increment = 20; // Milliseconds per step

  // Easing function (quadratic ease-in-out)
  function easeInOutQuad(t: number, b: number, c: number, d: number): number {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  }

  function animateScroll() {
    currentTime += increment;
    const val = easeInOutQuad(currentTime, start, change, duration);
    element.scrollLeft = val;
    if (currentTime < duration) {
      setTimeout(animateScroll, increment);
    } else {
      element.scrollLeft = to; // Ensure it ends exactly at the target
    }
  }
  animateScroll();
}

interface KanbanScrollOperations {
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  scrollToTopic: (topicGroupId: string) => void;
}

/**
 * Hook that provides smooth scroll functionality for KanbanBoard
 */
export function useKanbanScroll(): KanbanScrollOperations {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToTopic = useCallback((topicGroupId: string) => {
    if (scrollContainerRef.current && topicGroupId) {
      const container = scrollContainerRef.current;
      const columnElement = container.querySelector<HTMLElement>(
        `[data-topic-group-id="${topicGroupId}"]`,
      );

      if (columnElement) {
        let scrollTargetLeft;
        if (topicGroupId === "default") {
          scrollTargetLeft = 0;
        } else {
          const containerWidth = container.clientWidth;
          const columnWidth = columnElement.clientWidth;
          scrollTargetLeft = columnElement.offsetLeft -
            (containerWidth / 2) + (columnWidth / 2);

          // Clamp the scroll target to be within valid scroll limits
          scrollTargetLeft = Math.max(0, scrollTargetLeft);
          scrollTargetLeft = Math.min(
            scrollTargetLeft,
            container.scrollWidth - containerWidth,
          );
        }

        customSmoothScrollTo(container, scrollTargetLeft, 500); // Use custom scroll over 500ms
      }
    }
  }, []);

  return {
    scrollContainerRef,
    scrollToTopic,
  };
}
