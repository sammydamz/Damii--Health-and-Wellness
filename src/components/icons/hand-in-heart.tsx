import { cn } from "@/lib/utils";

export const HandInHeart = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("size-6", className)}
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    <path d="M9 14V9.5c0-.83.67-1.5 1.5-1.5S12 8.67 12 9.5V14" />
    <path d="M12 14v-2.5" />
    <path d="M15 14V11c0-.55-.45-1-1-1s-1 .45-1 1v3" />
  </svg>
);
