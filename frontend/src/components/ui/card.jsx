import { cn } from "@/lib/utils";
export function Card({ className, ...props }) {
    return (<div className={cn("bg-white dark:bg-gray-900 rounded-2xl shadow-sm", className)} {...props}/>);
}
export function CardHeader({ className, ...props }) {
    return <div className={cn("px-6 py-4 border-b border-gray-100 dark:border-white/5", className)} {...props}/>;
}
export function CardTitle({ className, ...props }) {
    return <h3 className={cn("font-semibold text-gray-900 dark:text-white text-base", className)} {...props}/>;
}
export function CardContent({ className, ...props }) {
    return <div className={cn("p-6", className)} {...props}/>;
}
export function CardFooter({ className, ...props }) {
    return (<div className={cn("px-6 py-4 border-t border-gray-100 dark:border-white/5", className)} {...props}/>);
}
