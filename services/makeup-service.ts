import {looks} from './mock-data';
import {readStore,writeStore} from './storage';
import {callCloud} from './cloud';
export const listLooks=async()=>readStore('makeup_looks',looks);
export const createMakeupTask=async(input:any)=>callCloud('makeupService',input,{status:'success',imageUrl:input.imageUrl||'/assets/zip/makeup_model_glamour_1792151327511.jpg',title:'AI 妆容结果'});
export const saveMakeupLook=async(item:any)=>{const list=readStore('makeup_looks',looks as any[]);const next=[item,...list];writeStore('makeup_looks',next);return next};
