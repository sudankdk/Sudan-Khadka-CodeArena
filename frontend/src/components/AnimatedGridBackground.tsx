import { useEffect, useRef } from "react";

const AnimatedGridBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const isMouseMoving = useRef(false);
  const mouseTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationId: number;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 500; // Distance from center to orbit

    const animate = (time: number) => {
      // If mouse is moving, use mouse position; otherwise use animation
      if (!isMouseMoving.current) {
        // Create circular/elliptical motion around the center title
        const speed = 1/3500;
        const x = centerX + Math.cos(time * speed) * radius;
        const y = centerY + Math.sin(time * speed * 0.8) * (radius * 0.6);

        container.style.setProperty("--mouse-x", `${x}px`);
        container.style.setProperty("--mouse-y", `${y}px`);
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    const handleMouseMove = (e: MouseEvent) => {
      isMouseMoving.current = true;
      const rect = container.getBoundingClientRect();
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      // Update the radial gradient position
      container.style.setProperty("--mouse-x", `${mousePos.current.x}px`);
      container.style.setProperty("--mouse-y", `${mousePos.current.y}px`);

      // Clear existing timeout
      if (mouseTimeout.current) {
        clearTimeout(mouseTimeout.current);
      }

      // Return to animation after 2 seconds of no mouse movement
      mouseTimeout.current = setTimeout(() => {
        isMouseMoving.current = false;
      }, 3000);
    };

    container.addEventListener("mousemove", handleMouseMove);
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
      if (mouseTimeout.current) {
        clearTimeout(mouseTimeout.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={
        {
          "--mouse-x": "50%",
          "--mouse-y": "50%",
        } as React.CSSProperties
      }
    >
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Glowing Radial Light Effect */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: "var(--mouse-x)",
          top: "var(--mouse-y)",
          width: "400px",
          height: "400px",
          transform: "translate(-50%, -50%)",
          background: `
            radial-gradient(
              circle,
              rgba(100, 200, 255, 0.3) 0%,
              rgba(100, 150, 255, 0.15) 30%,
              rgba(50, 100, 200, 0.05) 60%,
              transparent 100%
            )
          `,
          filter: "blur(40px)",
          zIndex: 10,
        }}
      />

      {/* Optional: Additional glow layer for intensity */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: "var(--mouse-x)",
          top: "var(--mouse-y)",
          width: "200px",
          height: "200px",
          transform: "translate(-50%, -50%)",
          background: `
            radial-gradient(
              circle,
              rgba(100, 200, 255, 0.2) 0%,
              transparent 70%
            )
          `,
          filter: "blur(20px)",
          zIndex: 5,
        }}
      />
    </div>
  );
};

export default AnimatedGridBackground;
