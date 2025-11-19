type PageBannerProps = {
  title: string;
  containerClassName?: string;
};

export default function PageBanner({ title, containerClassName = "max-w-7xl" }: PageBannerProps) {
  return (
    <div className="mb-10">
      <div className={`${containerClassName} mx-auto px-6 py-10 page-banner rounded-b-2xl`}>
        <h1 className="text-4xl md:text-6xl font-black">{title}</h1>
      </div>
    </div>
  );
}
