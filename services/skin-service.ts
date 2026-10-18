import {feedback} from './mock-data';
import {readStore,writeStore} from './storage';
export const listFeedback=()=>readStore('skin_feedback',feedback);
export const saveFeedback=(item:any)=>{const next=[{...item,id:`f${Date.now()}`},...listFeedback()];writeStore('skin_feedback',next);return next};
