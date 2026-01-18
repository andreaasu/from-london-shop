import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductGallery({ images = [], productName = "Product" }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

    // Handle single image or empty states efficiently
    const hasMultipleImages = images && images.length > 1;
    const safeImages = images && images.length > 0 ? images : ["/placeholder.jpg"];

    // Update selected index when embla changes
    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on("select", onSelect);
        emblaApi.on("reInit", onSelect);
    }, [emblaApi, onSelect]);

    // Scroll to specific index (for thumbnails/dots)
    const scrollTo = useCallback(
        (index) => {
            if (emblaApi) emblaApi.scrollTo(index);
        },
        [emblaApi]
    );

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = "/placeholder.jpg";
    };

    return (
        <div className="space-y-4">
            {/* Main Slider Area */}
            <div className="relative group">
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden relative">
                    <div className="w-full h-full" ref={emblaRef}>
                        <div className="flex h-full touch-pan-y">
                            {safeImages.map((src, index) => (
                                <div
                                    className="flex-[0_0_100%] min-w-0 relative h-full"
                                    key={`${src}-${index}`}
                                >
                                    <img
                                        src={src}
                                        alt={`${productName} - View ${index + 1}`}
                                        className="w-full h-full object-cover block"
                                        onError={handleImageError}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Arrows - Only show if multiple images */}
                    {hasMultipleImages && (
                        <>
                            <button
                                onClick={scrollPrev}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 md:opacity-0 md:group-hover:opacity-100 touch-manipulation z-10 hidden sm:flex"
                                aria-label="Previous image"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={scrollNext}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 md:opacity-0 md:group-hover:opacity-100 touch-manipulation z-10 hidden sm:flex"
                                aria-label="Next image"
                            >
                                <ChevronRight size={24} />
                            </button>

                            {/* Mobile Arrows (Always visible or visible on tap logic handled naturally by touch, but let's make them persistent on mobile if needed, or rely on swipe. User requested 'always visible on mobile (or subtle)'. Let's add specific mobile-visible low-opacity arrows or just rely on swipe + arrows showing on tap. 
              Actually, Requirements said: "Left/right arrow buttons: ... visible on hover (desktop) and always visible on mobile".
              Let's adjust the classes above.
              */}
                        </>
                    )}

                    {/* Mobile Overlay Arrows (Simplified for touch targets) */}
                    {hasMultipleImages && (
                        <>
                            {/* Left Hit Area for Mobile */}
                            <div className="absolute top-0 bottom-0 left-0 w-12 flex items-center justify-center sm:hidden z-10" onClick={(e) => { e.stopPropagation(); scrollPrev(); }}>
                                <div className="bg-white/60 p-1.5 rounded-full shadow-sm backdrop-blur-[2px]">
                                    <ChevronLeft size={20} className="text-gray-800" />
                                </div>
                            </div>

                            {/* Right Hit Area for Mobile */}
                            <div className="absolute top-0 bottom-0 right-0 w-12 flex items-center justify-center sm:hidden z-10" onClick={(e) => { e.stopPropagation(); scrollNext(); }}>
                                <div className="bg-white/60 p-1.5 rounded-full shadow-sm backdrop-blur-[2px]">
                                    <ChevronRight size={20} className="text-gray-800" />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Dots */}
                {hasMultipleImages && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10 pointer-events-none">
                        {safeImages.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => scrollTo(index)}
                                className={`w-2 h-2 rounded-full transition-all shadow-sm cursor-pointer pointer-events-auto ${index === selectedIndex
                                        ? "bg-white scale-110 ring-1 ring-black/10"
                                        : "bg-white/50 hover:bg-white/80"
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Thumbnails */}
            {hasMultipleImages && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {safeImages.map((img, idx) => (
                        <button
                            key={`${img}-${idx}`}
                            onClick={() => scrollTo(idx)}
                            className={`w-20 h-20 flex-shrink-0 cursor-pointer border overflow-hidden rounded transition-all ${selectedIndex === idx
                                    ? "border-black ring-1 ring-black opacity-100"
                                    : "border-gray-200 hover:border-black opacity-70 hover:opacity-100"
                                }`}
                        >
                            <img
                                src={img}
                                alt={`Thumbnail ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={handleImageError}
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
