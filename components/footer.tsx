"use client"
import { useTheme } from "next-themes"

export function Footer() {
  const { theme } = useTheme();
  return (
    <footer className="w-full mt-20 pb-6 pt-8 flex flex-col items-center gap-3 text-sm text-muted-foreground select-none">
      <div className="flex flex-row items-center gap-2">
        <span>Made by</span>
        <span>Adnan El Guennouni</span>
        <span className="text-3xl pb-1 text-muted-foreground select-none mx-2">·</span>
        <span> Powered by:</span>
        <span className="flex items-center gap-2 mt-0.5">
          {/* React */}
          <span title="React" className="inline-flex items-center gap-1">
            <span className="text-sm text-muted-foreground">React</span>
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="React icon" width="20" height="20" style={{display:'inline',verticalAlign:'middle'}} />
          </span>
          <span className="text-lg text-muted-foreground select-none">|</span>
          {/* Next.js */}
          <span title="Next.js" className="inline-flex items-center gap-1">
            <span className="text-sm text-muted-foreground">Next.js</span>
            {/* Theme-aware Next.js icon using local theme variable */}
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
          <span className="text-lg text-muted-foreground select-none">|</span>
          {/* Firebase */}
          <span title="Firebase" className="inline-flex items-center gap-1">
            <span className="text-sm text-muted-foreground">Firebase</span>
            <img src="/firebase.svg" alt="Firebase icon" width="20" height="20" style={{display:'inline',verticalAlign:'middle'}} />
          </span>
          <span className="text-lg text-muted-foreground select-none">|</span>
          {/* n8n */}
          <span title="n8n" className="inline-flex items-center gap-1">
            <span className="text-sm text-muted-foreground">n8n</span>
            <img src="/n8n.svg" alt="n8n icon" width="28" height="20" style={{display:'inline',verticalAlign:'middle'}} />
          </span>
          <span className="text-lg text-muted-foreground select-none">|</span>
          {/* DeepSeek */}
          <span title="DeepSeek" className="inline-flex items-center gap-1">
            <span className="text-sm text-muted-foreground">DeepSeek</span>
            <img src="/deepseek.png" alt="DeepSeek icon" width="22" height="22" style={{display:'inline',verticalAlign:'middle',borderRadius:'6px'}} />
          </span>
          <span className="text-3xl pb-1 text-muted-foreground select-none mx-2">·</span>
          <span className="inline-flex items-center gap-1">
            <span>© {new Date().getFullYear()} BiasBrief. All rights reserved.</span>
          </span>
        </span>
      </div>
    </footer>
  )
}
