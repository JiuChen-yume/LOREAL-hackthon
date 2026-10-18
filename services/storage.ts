export const readStore=<T>(key:string,fallback:T):T=>{try{const v=wx.getStorageSync(key);return v===undefined||v===null||v===''?fallback:v as T}catch{return fallback}};
export const writeStore=(key:string,value:unknown)=>{try{wx.setStorageSync(key,value)}catch{}};
export const removeStore=(key:string)=>{try{wx.removeStorageSync(key)}catch{}};
