import React, { useEffect, useState } from "react";
import { GitPullRequest, Image as ImageIcon, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

const markdownSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), "video", "source", "picture"],
  attributes: {
    ...defaultSchema.attributes,
    img: [
      ...((defaultSchema.attributes && defaultSchema.attributes.img) || []),
      "width",
      "height",
      "align",
      "style",
      "loading",
      "srcset",
      "referrerpolicy",
    ],
    video: [
      "src",
      "controls",
      "width",
      "height",
      "poster",
      "autoplay",
      "loop",
      "muted",
      "playsinline",
      "preload",
      "style",
    ],
    source: ["src", "srcset", "type", "media"],
    a: [
      ...((defaultSchema.attributes && defaultSchema.attributes.a) || []),
      "target",
      "rel",
    ],
  },
};

const MarkdownImage = ({ node, src, alt, ...props }) => {
  const [errored, setErrored] = useState(false);
  if (errored || !src) {
    return (
      <div>
        <a
          href={src || "#"}
          target="_blank"
          rel="noreferrer"
          className="not-prose inline-flex items-center gap-1.5 px-2 py-1 border border-stone-300 bg-stone-50 text-xs text-stone-700 hover:bg-stone-100 hover:border-stone-500 font-mono"
          title={src}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span className="max-w-[20rem] truncate">
            {alt || "Image"} — open original
          </span>
        </a>
      </div>
    );
  }
  return (
    // eslint-disable-next-line jsx-a11y/alt-text
    <img
      {...props}
      src={src}
      alt={alt || ""}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className="max-w-full h-auto inline-block border border-stone-200"
    />
  );
};

const markdownComponents = {
  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
  img: MarkdownImage,
  video: ({ node, ...props }) => (
    <video
      {...props}
      controls
      className="max-w-full h-auto border border-stone-200"
    />
  ),
};

export const Logo = () => (
  <div className="flex items-center gap-3">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 bg-amber-400 rounded-sm rotate-3" />
      <div className="absolute inset-0 bg-stone-900 rounded-sm flex items-center justify-center -rotate-2">
        <GitPullRequest className="w-5 h-5 text-amber-100" />
      </div>
    </div>
    <div>
      <div className="font-serif text-xl leading-none text-stone-900 text-start">
        Reckoning
      </div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-0.5">
        GitHub Feedback Companion
      </div>
    </div>
  </div>
);

export const Section = ({ children, className = "" }) => (
  <div className={`bg-stone-50 border border-stone-200 ${className}`}>
    {children}
  </div>
);

export const Button = ({
  children,
  onClick,
  variant = "primary",
  disabled,
  className = "",
  type = "button",
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-stone-900 text-amber-50 hover:bg-stone-800 border border-stone-900",
    secondary:
      "bg-stone-50 text-stone-900 hover:bg-stone-100 border border-stone-300",
    ghost: "bg-transparent text-stone-700 hover:bg-stone-100",
    accent:
      "bg-amber-400 text-stone-900 hover:bg-amber-300 border border-amber-500",
    danger: "bg-transparent text-red-700 hover:bg-red-50 border border-red-200",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Input = ({ label, hint, className = "", ...props }) => (
  <label className="block">
    {label && (
      <div className="text-xs uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
        {label}
      </div>
    )}
    <input
      {...props}
      className={`w-full px-3 py-2 bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 text-sm ${className}`}
    />
    {hint && <div className="text-xs text-stone-500 mt-1">{hint}</div>}
  </label>
);

export const Modal = ({ open, onClose, title, headerRight, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white border border-stone-300 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-stone-200 flex items-start justify-between gap-3 bg-stone-50">
          <div className="min-w-0 flex-1">{title}</div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {headerRight}
            <button
              type="button"
              onClick={onClose}
              className="text-stone-500 hover:text-stone-900 p-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};

export const Markdown = ({ children }) => (
  <div
    className="prose prose-stone prose-sm max-w-none leading-relaxed
    prose-headings:font-serif prose-headings:text-stone-900
    prose-a:text-amber-700 prose-a:no-underline hover:prose-a:underline
    prose-code:bg-stone-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-none prose-code:before:content-none prose-code:after:content-none prose-code:text-stone-800 prose-code:font-mono prose-code:text-[0.85em]
    prose-pre:bg-stone-900 prose-pre:text-stone-100 prose-pre:border prose-pre:border-stone-800 prose-pre:rounded-none
    prose-blockquote:border-l-amber-400 prose-blockquote:text-stone-700 prose-blockquote:not-italic
    prose-img:border prose-img:border-stone-200
    prose-hr:border-stone-200
    prose-table:text-xs"
  >
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
      components={markdownComponents}
    >
      {children}
    </ReactMarkdown>
  </div>
);

export const Select = ({ label, children, ...props }) => (
  <label className="block">
    {label && (
      <div className="text-xs uppercase tracking-wider text-stone-600 mb-1.5 font-medium">
        {label}
      </div>
    )}
    <select
      {...props}
      className="w-full px-3 py-2 bg-white border border-stone-300 text-stone-900 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 text-sm"
    >
      {children}
    </select>
  </label>
);
