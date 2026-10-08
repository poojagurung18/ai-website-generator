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
    body: JSON.stringify({ userInput, projectId, frameId })
  });

  if (!result.ok) {
    toast.error('Failed to generate. Please try again.');
    setLoading(false);
    return;
  }

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
      frameId: frameId,
      projectId: projectId
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
