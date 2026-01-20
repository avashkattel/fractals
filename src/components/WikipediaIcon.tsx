
import { cn } from "../lib/utils";

export const WikipediaIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={cn("w-5 h-5", className)}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M12.09 5.86L10.05 13.56L8.14 5.86H5.43L8.85 18H11.23L13.11 10.67L15.01 18H17.38L20.81 5.86H18.1L16.2 13.56L14.15 5.86H12.09Z" />
    </svg>
);
