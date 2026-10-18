import {routine} from './mock-data';
import {readStore,writeStore} from './storage';
import {callCloud} from './cloud';
export const generateCarePlan=async(input:any)=>callCloud('generateCarePlan',input, routine);
export const saveCareCheckin=async(item:any)=>{const list=readStore('care_checkins',[] as any[]);list.unshift({...item,id:`c${Date.now()}`});writeStore('care_checkins',list);return callCloud('careCheckins',{item},list)};
export const listCareCheckins=async()=>readStore('care_checkins',[] as any[]);
