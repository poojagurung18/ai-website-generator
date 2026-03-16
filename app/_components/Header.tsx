"use client"

import { Button } from '@/components/ui/button'
import { SignInButton, useUser } from '@clerk/nextjs'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'


const MenuOptions=[
     {
        name: 'Pricing',
        path: '/pricing'
    },
     {
        name: 'Contact us',
        path: '/contact-us'
    }
]
function Header() {
    const { isSignedIn } = useUser()

    return (
        <div className='flex items-center justify-between p-4 shadow'>
        <div className='flex gap-2 items-center'>
            <Link href={'/'}>
            <Image src={'/logo.svg'} alt='logo' width={35} height={35}/>
            </Link>
            <h2 className='font-bold text-2xl'>AI Website Generator </h2>
        </div>
        <div className='flex gap-3'>
            {MenuOptions.map((menu,index)=>(
                <Button variant={'ghost'} key={index}>{menu.name}</Button>
            ))}
        </div>
        <div>
            {!isSignedIn ? (
                <SignInButton mode='modal' forceRedirectUrl={'/workspace'}>
                    <Button>Get Started <ArrowRight/></Button>
                </SignInButton>
            ) : (
                <Link href={'/workspace'}>
                    <Button>Get Started <ArrowRight/></Button>
                </Link>
            )}
        </div>
    </div>
  )
}

export default Header