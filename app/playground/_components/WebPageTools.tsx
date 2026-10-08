import { Button } from '@/components/ui/button'
import { Code, Download, Monitor, SquareArrowOutUpRight, TabletSmartphone } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import ViewCodeBlock from './ViewCodeBlock'

const HTML_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="AI Website Builder - Modern TailwindCSS + Flowbite Template" />
    <title>AI Website Builder</title>

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Flowbite CSS & JS -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.css" rel="stylesheet" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.js"></script>

    <!-- Font Awesome / Lucide -->
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body id="root">
    {code}
</body>
</html>`
type Props = {
  selectedScreenSize: string,
  setselectedScreenSize: (size: string) => void,
  generatedCode: string
}

function WebPageTools({selectedScreenSize, setselectedScreenSize, generatedCode}: Props) {
  
  const [finalCode, setFinalCode] = useState<string>('');

  useEffect(()=> {
    // Strip markdown fences from the AI output only, not from the surrounding HTML template
    const body = (generatedCode || '').replaceAll("```html", '').replaceAll('```', '');
    setFinalCode(HTML_CODE.replace('{code}', () => body));
  }, [generatedCode])

  const ViewInNewTab = () => {
    if(!finalCode) return;
    

    // blob: URLs inherit our origin, so render the generated page inside a sandboxed
    // iframe (opaque origin) to keep its scripts away from the user's session.
    const escaped = finalCode.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
    const wrapper = `<!DOCTYPE html><html><head><title>Preview</title></head>
<body style="margin:0"><iframe sandbox="allow-scripts allow-forms allow-popups" srcdoc="${escaped}" style="border:0;width:100vw;height:100vh"></iframe></body></html>`;
    const blob = new Blob([wrapper], {type:'text/html'});
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
  }  

  const downloadCode = ()=> {
    const blob = new Blob([finalCode??''], {type:'text/html'});
    const url = URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='index.html'
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  return (
    <div className='p-2 shadow rounded-xl w-full flex items-center justify-between'>
        <div className='flex gap-2'>
            <Button variant={"ghost"} 
            className= {`${selectedScreenSize== 'web' ? 'border border-primary': null }`}
            onClick={()=>setselectedScreenSize('web')}><Monitor/></Button>
            <Button variant={"ghost"} 
            className= {`${selectedScreenSize== 'mobile' ? 'border border-primary': null }`}
            onClick={()=>setselectedScreenSize('mobile')}><TabletSmartphone/></Button>
        </div>
        <div className='flex gap-2'>
            <Button variant={'outline'} onClick={()=>ViewInNewTab()}>View <SquareArrowOutUpRight /></Button>
            <ViewCodeBlock code={finalCode}>
                <Button>View <Code /></Button>
            </ViewCodeBlock>
            <Button onClick={downloadCode}>Download <Download /></Button>

        </div>
    </div>
  )
}

export default WebPageTools