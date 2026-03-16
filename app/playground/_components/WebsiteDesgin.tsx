import React, { useContext, useEffect, useRef, useState } from "react";
import WebPageTools from "./WebPageTools";
import ElementSettingSection from "./ElementSettingSection";
import ImageSettingSection from "./ImageSettingsSection";
import { OnSaveContext } from "@/context/OnSaveContext";
import { on } from "events";
import axios from "axios";
import { toast } from "sonner";
import { useParams, useSearchParams } from "next/navigation";

type Props = {
  generatedCode: string;
};

const HTML_SHELL_HEAD = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.css" rel="stylesheet" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.js"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <style>
      /* Ensure our selection outlines are always visible over Tailwind styles */
      .custom-hover-outline { outline: 2px dotted blue !important; outline-offset: -2px; }
      .custom-selected-outline { outline: 2px solid red !important; outline-offset: -2px; }
    </style>
</head>
<body id="root"></body>
</html>`;

function WebsiteDesign({ generatedCode }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selectedScreenSize, setSelectedScreenSize] = useState("web");
  const [selectedElement, setSelectedElement] = useState<HTMLElement|null>();
  const {onSaveData, setOnSaveData} = useContext(OnSaveContext);
  const {projectId} = useParams();
  const params = useSearchParams();
  const frameId = params.get('frameId');

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    if (doc.body.innerHTML === "" || !doc.getElementById("root")) {
      doc.open();
      doc.write(HTML_SHELL_HEAD);
      doc.close();
    }

    const root = doc.getElementById("root");
    if (!root) return;

    const cleanCode = generatedCode
      .replaceAll("```html", "")
      .replaceAll("```", "")
      .replace("html", "") ?? "";
    
    root.innerHTML = cleanCode;

    let hoverEl: HTMLElement | null = null;
    let selectedEl: HTMLElement | null = null;

    const handleMouseOver = (e: MouseEvent) => {
      if (selectedEl) return;
      const target = e.target as HTMLElement;
      if (target === doc.body || target === root) return; 
      
      if (hoverEl && hoverEl !== target) {
        hoverEl.classList.remove("custom-hover-outline");
      }
      hoverEl = target;
      hoverEl.classList.add("custom-hover-outline");
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (selectedEl) return;
      if (hoverEl) {
        hoverEl.classList.remove("custom-hover-outline");
        hoverEl = null;
      }
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;

      if (selectedEl && selectedEl !== target) {
        selectedEl.classList.remove("custom-selected-outline");
        selectedEl.removeAttribute("contenteditable");
      }

      selectedEl = target;
      selectedEl.classList.add("custom-selected-outline");
      selectedEl.setAttribute("contenteditable", "true");
      selectedEl.focus();
      setSelectedElement(selectedEl);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedEl) {
        selectedEl.classList.remove("custom-selected-outline");
        selectedEl.removeAttribute("contenteditable");
        selectedEl = null;
      }
    };

    doc.body.addEventListener("mouseover", handleMouseOver);
    doc.body.addEventListener("mouseout", handleMouseOut);
    doc.body.addEventListener("click", handleClick);
    doc.addEventListener("keydown", handleKeyDown);

    return () => {
      doc.body.removeEventListener("mouseover", handleMouseOver);
      doc.body.removeEventListener("mouseout", handleMouseOut);
      doc.body.removeEventListener("click", handleClick);
      doc.removeEventListener("keydown", handleKeyDown);
    };
  }, [generatedCode]);

  useEffect(() => {
    onSaveData && onSaveCode();
  }, [onSaveData]);

  const onSaveCode = async () => {
    if(iframeRef.current) {
      try {
        const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
        if(iframeDoc)
        {
          const cloneDoc = iframeDoc.documentElement.cloneNode(true) as HTMLElement;
          const AllELs = cloneDoc.querySelectorAll<HTMLElement>("*");
          AllELs.forEach(el => {
            el.style.outline='';
            el.style.cursor='';
          })
          const html = cloneDoc.outerHTML;
          console.log("HTML to save", html);

          const result=await axios.put('/api/frames', {
            designCode: html,
            frameId: frameId,
            projectId: projectId
          });
          console.log(result.data);
          toast.success("Saved")
        }
      } catch(err) {
        
      }
  }
  }

  return (
    <div className="flex gap-2 w-full">
      <div className="p-5 w-full flex items-center flex-col">
        <div className={`transition-all duration-300 ${selectedScreenSize === 'web' ? 'w-full' : 'w-100'} border-2 rounded-xl overflow-hidden shadow-lg`}>
          <iframe
            ref={iframeRef}
            className="w-full h-150 bg-white"
            sandbox="allow-scripts allow-same-origin"
            title="Preview"
          />
        </div>
        <WebPageTools 
          selectedScreenSize={selectedScreenSize}
          setselectedScreenSize={(v: string) => setSelectedScreenSize(v)}
          generatedCode={generatedCode}
        />
      </div>
      {/* @ts-ignore */}
      {/* <ElementSettingSection selectedEl={selectedElement} clearSelection={()=>setSelectedElement(null)}/> */}
      {selectedElement?.tagName=='IMG'? (
      // @ts-ignore
      <ImageSettingSection selectedEl={selectedElement}/>
      ):selectedElement?(<ElementSettingSection selectedEl={selectedElement} clearSelection={()=>setSelectedElement(null)}/>
      ):null}
    </div>
  );
}

export default WebsiteDesign;