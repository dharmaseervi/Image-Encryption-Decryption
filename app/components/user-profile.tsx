'use client';

import { SignInButton, useUser } from '@clerk/nextjs';
import React from 'react';

function Userprofile() {
    const { isSignedIn, user } = useUser();

    return (
        <div>
            {isSignedIn ? (
                <>
                    <p>Username: {user?.username || "Not set"}</p>
                    <p>Email: {user?.primaryEmailAddress?.emailAddress || "Not available"}</p>
                </>
            ) : (
                null
            )}
        </div>
    );
}

export default Userprofile;
