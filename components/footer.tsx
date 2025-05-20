"use client"
import { useTheme } from "next-themes"

export function Footer() {
  const { theme } = useTheme();
  return (
    <footer className="w-full mx-2 mt-10 mb-3 pb-6 pt-8 flex flex-col items-center gap-1 md:gap-2 text-[8px] md:text-[10px] text-muted-foreground select-none">
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-stretch justify-between gap-1 md:gap-2">
        {/* Left: Made by */}
        <div className="flex flex-row items-center gap-1 min-w-0 flex-1 w-full md:w-auto md:justify-start justify-center py-1 md:py-0">
          <span>Made by</span>
          <span>Adnan El Guennouni</span>
        </div>
        {/* Center: Powered by and icons */}
        <div className="flex flex-row items-center gap-1 flex-1 w-full md:w-auto md:justify-center justify-center py-1 md:py-0">
          {/* Inline flex for all tech icons, always in one row */}
          <span className="flex flex-row items-center gap-x-3 md:gap-x-3 gap-y-1 mt-0.5 flex-wrap md:flex-nowrap justify-center w-full">
            <span className="text-[8px] content-center md:text-[10px] whitespace-nowrap pr-2">Powered by:</span>
            {/* React */}
            <span title="React" className="inline-flex items-center gap-1">
              <span className="hidden md:inline text-[8px] md:text-[10px] text-muted-foreground">React</span>
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="React icon" width="20" height="20" style={{display:'inline',verticalAlign:'middle'}} />
            </span>
            <span className="text-base md:text-lg ms-4 text-muted-foreground select-none hidden md:inline">|</span>
            {/* Next.js */}
            <span title="Next.js" className="inline-flex items-center gap-1">
              <span className="hidden md:inline text-[8px] md:text-[10px] text-muted-foreground">Next.js</span>
              {theme === 'dark' ? (
                <img
                  src="https://img.icons8.com/fluent-systems-filled/512/FFFFFF/nextjs.png"
                  alt="Next.js logo dark"
                  width="20"
                  height="20"
                  style={{ display: 'inline', verticalAlign: 'middle', borderRadius: '6px' }}
                />
              ) : (
                <img
                  src="https://images.seeklogo.com/logo-png/39/1/next-js-logo-png_seeklogo-394608.png"
                  alt="Next.js logo"
                  width="20"
                  height="20"
                  style={{ display: 'inline', verticalAlign: 'middle', borderRadius: '6px' }}
                />
              )}
            </span>
            <span className="text-base ms-4 md:text-lg text-muted-foreground select-none hidden md:inline">|</span>
            {/* Firebase */}
            <span title="Firebase" className="inline-flex items-center gap-1">
              <span className="hidden md:inline text-[8px] md:text-[10px] text-muted-foreground">Firebase</span>
              <img src="/firebase.svg" alt="Firebase icon" width="20" height="20" style={{display:'inline',verticalAlign:'middle'}} />
            </span>
            <span className="text-base ms-4 md:text-lg text-muted-foreground select-none hidden md:inline">|</span>
            {/* n8n */}
            <span title="n8n" className="inline-flex items-center gap-1">
              <span className="hidden md:inline text-[8px] md:text-[10px] text-muted-foreground">n8n</span>
              <img src="/n8n.svg" alt="n8n icon" width="28" height="20" style={{display:'inline',verticalAlign:'middle'}} />
            </span>
            <span className="text-base ms-4 md:text-lg text-muted-foreground select-none hidden md:inline">|</span>
            {/* DeepSeek */}
            <span title="DeepSeek" className="inline-flex items-center gap-1">
              <span className="hidden md:inline text-[8px] md:text-[10px] text-muted-foreground">DeepSeek</span>
              <img src="/deepseek.png" alt="DeepSeek icon" width="22" height="22" style={{display:'inline',verticalAlign:'middle',borderRadius:'6px'}} />
            </span>
          </span>
        </div>
        {/* Right: Copyright */}
        <div className="flex flex-row items-center gap-1 min-w-0 flex-1 w-full md:w-auto md:justify-end justify-center py-1 md:py-0">
          <span className="text-[8px] md:text-[10px]">© {new Date().getFullYear()} BiasBrief. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}
