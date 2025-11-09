import { useNavigate } from "react-router-dom"
import useAuthStore from "../store/auth.store"
import { useEffect } from "react"

const useAuth =()=>{
    const {token,loading,setLoading,setToken}= useAuthStore()
    const nav= useNavigate()

    useEffect(()=>{
        if (loading == false && !token){
            nav("/login")
        }
    },[token,loading,nav]
)
return {token,loading,setLoading,setToken}
}