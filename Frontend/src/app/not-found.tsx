import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell flex flex-col items-center text-center">
      <h1 className="mb-4 font-heading text-3xl sm:text-4xl text-foreground">
        Page not found
      </h1>
      <p className="mb-8 text-base text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        href="/"
        className="action-primary"
      >
        Back to home
      </Link>
    </div>
  );
}
