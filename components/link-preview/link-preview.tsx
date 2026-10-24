"use client";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils"; // If using standard shadcn/tailwind setup

type LinkPreviewProps = {
  children: React.ReactNode;
  url: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
  layout?: string;
  isStatic?: boolean;
  imageSrc?: string;
  badge?: string;
  title?: string;
};

export const LinkPreview = ({
  children,
  url,
  className,
  width = 240,
  height = 150,
  quality = 50,
  layout = "fixed",
  isStatic = false,
  imageSrc = "",
  badge,
  title,
}: LinkPreviewProps) => {
  let src;
  if (!isStatic) {
    const params = new URLSearchParams({
      url,
      screenshot: "true",
      meta: "false",
      embed: "screenshot.url",
      colorScheme: "dark",
      "viewport.isMobile": "true",
      "viewport.deviceScaleFactor": "1",
      "viewport.width": (width * 3).toString(),
      "viewport.height": (height * 3).toString(),
    });
    src = `https://api.microlink.io/?${params.toString()}`;
  } else {
    src = imageSrc;
  }

  const [isOpen, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const springConfig = { stiffness: 100, damping: 15 };
  const x = useMotionValue(0);
  const translateX = useSpring(x, springConfig);

  const handleMouseMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const targetRect = event.currentTarget.getBoundingClientRect();
    const eventOffsetX = event.clientX - targetRect.left;
    const offsetFromCenter = (eventOffsetX - targetRect.width / 2) / 2; // Subtle spring tilt
    x.set(offsetFromCenter);
  };

  return (
    <>
      {isMounted ? (
        <div className="hidden">
          {/* Preload screenshot/image */}
          <Image
            src={src}
            width={width}
            height={height}
            quality={quality}
            priority={true}
            alt="hidden preload"
          />
        </div>
      ) : null}

      <HoverCardPrimitive.Root
        openDelay={50}
        closeDelay={100}
        onOpenChange={(open) => {
          setOpen(open);
        }}
      >
        <HoverCardPrimitive.Trigger
          onMouseMove={handleMouseMove}
          className={cn(
            "text-foreground underline decoration-dotted decoration-[1.5px] underline-offset-4 hover:decoration-solid cursor-pointer font-medium transition-all",
            className
          )}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </HoverCardPrimitive.Trigger>

        <HoverCardPrimitive.Content
          className="[transform-origin:var(--radix-hover-card-content-transform-origin)] z-50"
          side="top"
          align="center"
          sideOffset={10}
        >
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.88 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  },
                }}
                exit={{ opacity: 0, y: 10, scale: 0.9, transition: { duration: 0.15 } }}
                className="shadow-2xl rounded-2xl p-1 bg-neutral-900/90 dark:bg-neutral-900/90 border border-white/10 backdrop-blur-md"
                style={{
                  x: translateX,
                }}
              >
                <Link
                  href={url}
                  className="block p-1 bg-transparent hover:opacity-95 transition-opacity"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
                    <Image
                      src={src}
                      width={width}
                      height={height}
                      quality={quality}
                      priority={true}
                      className="rounded-xl object-cover"
                      alt="preview image"
                    />
                  </div>
                  {(title || badge) && (
                    <div className="flex items-center justify-between px-2 pt-2 pb-1 text-xs">
                      {title && <span className="font-medium text-white/90 truncate max-w-[170px]">{title}</span>}
                      {badge && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-neutral-400">{badge}</span>}
                    </div>
                  )}
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Root>
    </>
  );
};

export default LinkPreview;
