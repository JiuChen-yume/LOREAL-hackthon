import {circularRecords} from './mock-data';
import {readStore,writeStore} from './storage';
export const listRecycleRecords=()=>readStore('recycle_records',circularRecords);
export const addRecycleRecord=()=>{const list=listRecycleRecords();const next=[{id:`r${Date.now()}`,date:new Date().toISOString().slice(0,10),item_name:'空瓶回收',points:80,status:'待核验'},...list];writeStore('recycle_records',next);return next};
