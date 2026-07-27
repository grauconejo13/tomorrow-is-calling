import "./PageLoader.css";

type PageLoaderProps = {
  label?: string;
};

export function PageLoader({ label = "Loading" }: PageLoaderProps) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="page-loader__indicator" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
