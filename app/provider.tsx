'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '@clerk/nextjs';
import { UserDetail, UserDetailContext } from '@/context/UserDetailContext';
import { OnSaveContext } from '@/context/OnSaveContext';

function UserDetailProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [onSaveData, setOnSaveData] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      createNewUser();
    }
  }, [user]);

  // The server reads the user from the Clerk session, so no body is needed
  const createNewUser = async () => {
    try {
      const result = await axios.post('/api/users');
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
