import type { PropsWithChildren } from "react";
import { motion } from "framer-motion";

type PageContainerProps = PropsWithChildren<{
  durationMs?: number;
  className?: string;
}>;

export function PageContainer({
  children,
  durationMs = 450,
  className,
}: PageContainerProps) {
  return (
    <motion.main
      className={className}
      initial={{ opacity: 0, y: 16, filter: "blur(2px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -16, filter: "blur(2px)" }}
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 20,
        duration: durationMs / 1000,
      }}
    >
      {children}
    </motion.main>
  );
}
