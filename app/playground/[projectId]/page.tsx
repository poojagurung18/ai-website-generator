'use client'
import React, { useEffect, useState } from 'react'
import PlaygroundHeader from '../_components/PlaygroundHeader'
import ChatSection from '../_components/ChatSection'
import WebsiteDesgin from '../_components/WebsiteDesgin'
import ElementSettingSection from '../_components/ElementSettingSection'
import { useParams, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'

export type Frame = {
  projectId: string,
  frameId: number,
  designCode: string,
  chatMessages: Messages[]
}

export type Messages = {
  role: 'user' | 'assistant'
  content: string
}

const Prompt = `
userInput: {userInput}

Instructions:

1. If the user input is explicitly asking to generate code, design, or HTML/CSS/JS output (e.g., "Create a landing page", "Build a dashboard", "Generate HTML Tailwind CSS code"), then:

    - Generate a complete HTML Tailwind CSS code using Flowbite UI components.
    - Use a modern design with **blue as the primary color theme**.
    - Only include the <body> content (do not add <head> or <title>).
    - Make it fully responsive for all screen sizes.
    - All primary components must match the theme color.
    - Add proper padding and margin for each element.
    - Components should be independent; do not connect them.
    - Use placeholders for all images:
        - Light mode: https://community.softr.io/uploads/db9110/original/2X/7/74e6c7c382d0ff5d7773ca9a87e6f6f8817a68a6.jpeg
        - Dark mode: https://www.cibaky.com/wp-content/uploads/2015/12/placeholder-3.jpg
    - Add alt tag describing the image prompt.
    - Use the following libraries/components where appropriate:
        - FontAwesome icons (fa fa-)
        - Flowbite UI components: buttons, modals, forms, tables, tabs, alerts, cards, dialogs, dropdowns, accordions, etc.
        - Chart.js for charts & graphs
        - Swiper.js for sliders/carousels
        - Tippy.js for tooltips & popovers
    - Include interactive components like modals, dropdowns, and accordions.
    - Ensure proper spacing, alignment, hierarchy, and theme consistency.
    - Ensure charts are visually appealing and match the theme color.
    - Header menu options should be spread out and not connected.
    - Do not include broken links.
    - Do not add any extra text before or after the HTML code.

2. If the user input is **general text or greetings** (e.g., "Hi", "Hello", "How are you?") **or does not explicitly ask to generate code**, then:

    - Respond with a simple, friendly text message instead of generating any code.

Example:

- User: "Hi" -> Response: "Hello! How can I help you today?"
- User: "Build a responsive landing page with Tailwind CSS" -> Response: [Generate full HTML code as per instructions above]
`;

function PlayGround
() {
  const {projectId} = useParams();
  const params = useSearchParams();
  const frameId = params.get('frameId');
  const [frameDetail, setFrameDetail] = useState<Frame>();
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Messages[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  useEffect(()=>{
    frameId && GetFrameDetails();
  }, [frameId])
  
  const GetFrameDetails = async () => {
  const result = await axios.get('/api/frames?frameId=' + frameId + "&projectId=" + projectId);
  setFrameDetail(result.data);
  
  const designCode = result.data?.designCode || "";
 
  if (designCode.includes("```html")) {
    const index = designCode.indexOf("```html") + 7;
    const lastIndex = designCode.lastIndexOf("```");
    setGeneratedCode(designCode.slice(index, lastIndex > index ? lastIndex : undefined));
  } else {
    setGeneratedCode(designCode);
  }

  if (result.data?.chatMessages?.length == 1) {
    const userMsg = result.data?.chatMessages[0].content;
    SendMessage(userMsg);
  } else {
    setMessages(result.data?.chatMessages);
  }
}

  const SendMessage = async (userInput: string) => {
  setLoading(true);
  setGeneratedCode(""); 
  setMessages((prev: any) => [...prev, { role: 'user', content: userInput }]);

  const result = await fetch('/api/ai-model', {
    method: 'POST',
    body: JSON.stringify({
      messages: [{ role: "user", content: Prompt?.replace('{userInput}', userInput) }]
    })
  });

  const reader = result.body?.getReader();
  const decoder = new TextDecoder();

  let fullAiResponse = '';

  while (true) {
    const { done, value } = await reader?.read()!;
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    fullAiResponse += chunk;

    let cleanCode = fullAiResponse;
    if (cleanCode.includes("```html")) {
        cleanCode = cleanCode.split("```html")[1].split("```")[0];
    } else {
        const firstBracket = cleanCode.indexOf('<');
        if (firstBracket !== -1) {
            cleanCode = cleanCode.slice(firstBracket);
        }
    }
 
    if (cleanCode.includes('<')) {
        setGeneratedCode(cleanCode);
    }
  }

  await SaveGeneratedCode(fullAiResponse);

  const isCode = fullAiResponse.includes('<');
  setMessages((prev) => [
    ...prev, 
    { role: 'assistant', content: isCode ? 'Your code is ready!!' : fullAiResponse }
  ]);
  setLoading(false);
}
  useEffect(() => {
    if(messages.length>0)
    {
      SaveMessages();
    }
  }, [messages])
  const SaveMessages= async() => {
    const result = await axios.put('/api/chats', {
      messages: messages,
      frameId: frameId
    })
  }

  const SaveGeneratedCode = async(code: string) => {
    const result=await axios.put('/api/frames', {
      designCode: code,
      frameId: frameId,
      projectId: projectId
    });
    console.log(result.data);
    toast.success("Website is Ready!")
  }
  return (
    <div>
        <PlaygroundHeader />
        <div className='flex'>
            <ChatSection messages={messages??[]}
            onSend={(input: string)=>SendMessage(input)}
            loading={loading}
            />
            <WebsiteDesgin generatedCode={generatedCode?.replace('```','')}/>
        </div>
    </div>
  )
}

export default PlayGround
