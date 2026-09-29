export function ImagePreview({ title, src, meta }: { title: string; src: string; meta: string }) {
  return (
    <div className="media-preview">
      <div className="media-preview-head"><strong>{title}</strong><span>{meta}</span></div>
      <img src={src} alt={title} />
    </div>
  );
}
