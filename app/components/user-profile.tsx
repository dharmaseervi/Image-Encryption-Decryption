'use client'
import { useUser } from '@clerk/nextjs';
import React from 'react'

function Userprofile() {
    const { user } = useUser();
    console.log(user);

    return (
        <div>
            <p>
                {user?.username || "Not set"}
            </p>
            <p>
                {user?.primaryEmailAddress?.emailAddress || "Not available"}
            </p>
        </div>
    )
}

export default Userprofile
