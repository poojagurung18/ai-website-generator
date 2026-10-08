import { Button } from '@/components/ui/button'
import { OnSaveContext } from '@/context/OnSaveContext';
import Link from 'next/link';
import Image from 'next/image'
import React, { useContext } from 'react'

function PlaygroundHeader() {
  const {setOnSaveData} = useContext(OnSaveContext);
  return (
    <div className='flex justify-between items-center p-4 shadow'>
        <Link href={'/workspace'}>
        <Image src={'/logo.svg'} alt='logo' width={40} height={40}/>
        </Link>
        <Button onClick={()=>setOnSaveData(Date.now())}>Save</Button>
    </div>
  )
}

export default PlaygroundHeader