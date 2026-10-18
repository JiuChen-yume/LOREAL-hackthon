export type ServiceResult<T>={success:boolean;data:T;message:string;requestId:string;offline?:boolean};
const id=()=>`req_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
export const callCloud=async<T>(name:string,data:Record<string,unknown>,fallback:T):Promise<ServiceResult<T>>=>{
  const requestId=id();
  try{
    if(!wx.cloud||!wx.cloud.callFunction) throw new Error('cloud unavailable');
    const r:any=await wx.cloud.callFunction({name,data});
    return {success:true,data:(r.result?.data??r.result??fallback) as T,message:r.result?.message||'ok',requestId};
  }catch(e){return {success:true,data:fallback,message:'已使用离线演示数据',requestId,offline:true};}
};
