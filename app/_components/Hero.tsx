"use client"
import { Button } from '@/components/ui/button'
import { UserDetailContext } from '@/context/UserDetailContext'
import { SignInButton, useAuth, useUser } from '@clerk/nextjs'
import axios from 'axios'
import { ArrowUp, HomeIcon, ImagePlus, Key, LayoutDashboard, Loader2Icon, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useContext, useState } from 'react'
import { toast } from 'sonner'

const suggestions = [
  {
    label: 'Dashboard',
    prompt: 'Create an analytics dashboard to track customers and revenue data for a SaaS',
    icon: LayoutDashboard
  },
  {
    label: 'SignUp Form',
    prompt: 'Create a modern sign up form with email/password fields, Google and Github login options, and terms checkbox',
    icon: Key
  },
  {
    label: 'Hero',
    prompt: 'Create a modern header and centered hero section for a productivity SaaS. Include a badge for feature announcement, a title with a subtle gradient effect, subtitle, CTA, small social proof and an image.',
    icon: HomeIcon
  },
  {
    label: 'User Profile Card',
    prompt: 'Create a modern user profile card component for a social media website',
    icon: User
  }
]

function Hero() {
  const { user } = useUser();
  const [userInput, setUserInput] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const {has}= useAuth();
  const {userDetail, setUserDetail} = useContext(UserDetailContext);

  const hasUnlimitedCredits = has&&has({ plan: 'unlimited'});

  const CreateNewProject= async() => {
    if(!hasUnlimitedCredits && userDetail && (userDetail.credits ?? 0) <= 0) {
      toast.error('You have no remaining credits. Please upgrade your plan to create more projects.');
      return;
    }
    setLoading(true);
    try{
      const result = await axios.post('/api/projects',{
        userInput: userInput
      });
      const { projectId, frameId } = result.data;
      toast.success('Project Created');
      router.push(`/playground/${projectId}?frameId=${frameId}`)
      if (!hasUnlimitedCredits) {
        setUserDetail((prev)=> prev && ({
          ...prev,
          credits: (prev.credits ?? 0) - 1
        }))
      }
      setLoading(false);
    } catch(e) {
      toast.error(axios.isAxiosError(e) && e.response?.status === 403
        ? 'You have no remaining credits. Please upgrade your plan to create more projects.'
        : 'Internal server error');
      setLoading(false);
    }
  }
  return (
    <div className='flex flex-col items-center h-[80vh] justify-center'>
        <h2 className="font-bold text-6xl">What should we design?</h2>
        <p className='mt-2 text-xl text-gray-500'>Generate, Edit and Explore designs with AI, Export code as well</p>

        <div className='w-full max-w-2xl p-5 border mt-5 rounded-2xl'>
            <textarea placeholder='Describe your page design' className='w-full h-24 focus:outline-none focus:ring-0 resize-none' value={userInput} onChange={(event)=>setUserInput(event.target.value)}/>
            <div className='flex justify-between items-center'>
                <Button variant={'ghost'}><ImagePlus/></Button>
                { !user ? <SignInButton mode='modal' forceRedirectUrl={'/workspace'}>
                  <Button disabled={!userInput}> <ArrowUp /></Button>
                </SignInButton> :
                  <Button disabled={!userInput || loading} onClick={CreateNewProject}>{loading?<Loader2Icon className='animate-spin'/>:<ArrowUp/>}</Button>
                }
            </div>
        </div>
        <div className='mt-4 flex gap-3'>
            {suggestions.map((suggestion,index)=>(
                <Button key={index} variant={'outline'} onClick={()=>setUserInput(suggestion.prompt)}><suggestion.icon/>{suggestion.label}</Button>
            ))}
        </div>
    </div>
  )
}

export default Hero