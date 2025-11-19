"use client";

import { ReactNode } from "react";
import { Roboto_Mono, Orbitron } from "next/font/google";
import MusicPlayer from './components/MusicPlayer';



const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["700", "900"],
  display: "swap",
});

export function Providers({ children }: { children: ReactNode }) {
  return (
        <div className={`${robotoMono.variable} ${orbitron.variable}`}>
      <MusicPlayer />  
      {children}
    </div>
  );
}
