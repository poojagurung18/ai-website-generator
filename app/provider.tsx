'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '@clerk/nextjs';
import { UserDetailContext } from '@/context/UserDetailContext';
import { OnSaveContext } from '@/context/OnSaveContext';

function UserDetailProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const [userDetail, setUserDetail] = useState<any>(null);
  const [onSaveData, setOnSaveData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      createNewUser();
    }
  }, [user]);

  const createNewUser = async () => {
    try {
      const result = await axios.post('/api/users', {
        email: user?.primaryEmailAddress?.emailAddress,
        name: user?.fullName,
        clerkId: user?.id,
      });

      setUserDetail(result.data?.user);
    } catch (error) {
      console.error('Failed to create user', error);
    }
  };

  return (
    <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
      <OnSaveContext.Provider value={{ onSaveData, setOnSaveData }}>
      {children}
      </OnSaveContext.Provider>
    </UserDetailContext.Provider>
  );
}

export default UserDetailProvider;
