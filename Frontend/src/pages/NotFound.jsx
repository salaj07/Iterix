import { Link } from "react-router-dom";
import Button from "@/components/common/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <div className="font-display text-7xl font-bold text-[color:var(--primary)]">404</div>
        <h1 className="font-display text-2xl font-bold mt-2">Page not found</h1>
        <p className="text-sm text-muted-foreground mt-2">The page you're looking for doesn't exist.</p>
        <Link to="/" className="inline-block mt-6">
          <Button>Go home</Button>
        </Link>
      </div>
    </div>
  );
}
