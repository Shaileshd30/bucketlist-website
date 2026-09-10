"use client";
import { useState } from "react";
import Image from "next/image";
import styles from "./ItineraryPlanner.module.css";

export default function TripStudioPhoto({ urls, title, priority = false }: { urls: string[]; title: string; priority?: boolean }) {
  const [failed, setFailed] = useState<string[]>([]);
  const src = urls.find(url => !failed.includes(url));
  return <div className={styles.studioPhoto}>
    {src ? <Image src={src} alt={title} fill unoptimized sizes="(max-width: 760px) 90vw, 45vw" priority={priority} onError={() => setFailed(old => [...old, src])} style={{ objectFit: "cover" }} /> : <div className={styles.photoFallback}>
      <svg viewBox="0 0 500 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="500" height="300" fill="#e2e9de"/><circle cx="355" cy="73" r="36" fill="#e8b185"/><path d="M-20 285 160 80 345 310Z" fill="#718775"/><path d="m160 80-45 80 45-22 49 28Z" fill="#faf6ed"/><path d="M165 310 352 125 540 310Z" fill="#3c5a49"/><path d="M-30 310 Q190 160 540 305Z" fill="#243d2f"/></svg>
      <span>BUCKETLIST ADVENTURE</span>
    </div>}
  </div>;
}
