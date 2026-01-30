import type { IBoilerplate } from "@/Interfaces/problemstest/problemtest";
import { useEffect, useState } from "react";
import { defaultCode } from "../const/defaultcode";

const langMap = {
  python: "py",
  javascript: "js",
  go: "go",
} as const;

export function  useCodeEditor(boilerplates?: IBoilerplate[]) {
    const [language,setLanguage] = useState<keyof typeof langMap>('python');
    const [code,setCode] = useState(defaultCode['python'])
    
    useEffect(()=>{
        const apiLang = langMap[language];
        const boilerplate = boilerplates?.find(b => b.Language === apiLang);

        setCode( boilerplate?.code ??
      defaultCode[language] ??
      "")
    },[language,boilerplates])


    return {
        language,
        setLanguage,
        code,
        setCode
    }

} 