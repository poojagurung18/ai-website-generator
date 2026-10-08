'use client'
import React, { useEffect, useState } from 'react'
import PlaygroundHeader from '../_components/PlaygroundHeader'
import ChatSection from '../_components/ChatSection'
import WebsiteDesgin from '../_components/WebsiteDesgin'
import { useParams, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'

export type Frame = {
  projectId: string,
  frameId: string,
  designCode: string,
  chatMessages: Messages[]
}

export type Messages = {
  role: 'user' | 'assistant'
  content: string
}

function PlayGround() {
  const {projectId} = useParams();
  const params = useSearchParams();
  const frameId = params.get('frameId');
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Messages[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  useEffect(()=>{
    frameId && GetFrameDetails();
  }, [frameId])

  const GetFrameDetails = async () => {
    try {
      const result = await axios.get<Frame>('/api/frames', { params: { frameId, projectId } });
      const designCode = result.data?.designCode || "";

      if (designCode.includes("```html")) {
        const index = designCode.indexOf("```html") + 7;
        const lastIndex = designCode.lastIndexOf("```");
        setGeneratedCode(designCode.slice(index, lastIndex > index ? lastIndex : undefined));
      } else {
        setGeneratedCode(designCode);
      }

      const chatMessages = result.data?.chatMessages ?? [];
      // A new project only has the user's first prompt: generate the design for it now
      if (chatMessages.length == 1) {
        SendMessage(chatMessages[0].content, []);
      } else {
        setMessages(chatMessages);
      }
    } catch {
      toast.error('Could not load this project');
    }
  }

  const SendMessage = async (userInput: string, history: Messages[] = messages) => {
    setLoading(true);
    setGeneratedCode("");
    const withUserMsg: Messages[] = [...history, { role: 'user', content: userInput }];
    setMessages(withUserMsg);

    try {
      const result = await fetch('/api/ai-model', {
        method: 'POST',
        body: JSON.stringify({ userInput, projectId, frameId })
      });

      if (!result.ok || !result.body) {
        toast.error('Failed to generate. Please try again.');
        return;
      }

      const reader = result.body.getReader();
      const decoder = new TextDecoder();

      let fullAiResponse = '';

      while (true) {
        const { done, value } = await reader.read();
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

      const isCode = fullAiResponse.includes('<');
      if (isCode) {
        await SaveGeneratedCode(fullAiResponse);
      }

      const finalMessages: Messages[] = [
        ...withUserMsg,
        { role: 'assistant', content: isCode ? 'Your code is ready!!' : fullAiResponse }
      ];
      setMessages(finalMessages);
      await SaveMessages(finalMessages);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const SaveMessages = async (messagesToSave: Messages[]) => {
    await axios.put('/api/chats', {
      messages: messagesToSave,
      frameId: frameId,
      projectId: projectId
    })
  }

  const SaveGeneratedCode = async(code: string) => {
    await axios.put('/api/frames', {
      designCode: code,
      frameId: frameId,
      projectId: projectId
    });
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
