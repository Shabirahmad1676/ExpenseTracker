import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, firestore } from "../config/firebase"; // adjust path to your config
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "expo-router";

// 1. Create Context
const AuthContext = createContext();

// 2. Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Keep track of auth state (login/logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(false);
      
      if (currentUser) {
        // Fetch user data from Firestore
        try {
          const docRef = doc(firestore, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              username: userData.username || 'User',
              ...userData
            });
          } else {
            // User document doesn't exist, create basic user object
            setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              username: 'User'
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            username: 'User'
          });
        }
        
        router.replace("(tabs)");
      } else {
        setUser(null);
        router.replace("(auth)/Welcome");
      }
    });

    return unsubscribe; // cleanup on unmount
  }, []);

  // --- Signup ---
  const signup = async (email, password, username) => {
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(firestore, "users", response?.user?.uid), {
        username,
        email,
        uid: response?.user?.uid,
      });
      return { success: true };
    } catch (error) {
      let msg = error.message;
      return { success: false, msg };
    }
  };

  // --- Login ---
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return {success:true};
    } catch (error) {
      // console.error("Login Error:", error.message);
      // throw error;
      let msg = error.message;
      return {success:false,msg}
    }
  };

 
  const logout = async () => {
    try {
      await signOut(auth);
      router.replace("(auth)/Welcome")
    } catch (error) {
      console.error("Logout Error:", error.message);
      throw error;
    }
  };

  
  return (
    <AuthContext.Provider value={{ user, loading, setLoading, signup, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Hook for easy access
export const useAuth = () => useContext(AuthContext);
