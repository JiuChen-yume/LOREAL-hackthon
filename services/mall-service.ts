import {mallItems} from './mock-data';
import {readStore,writeStore} from './storage';
export const listMallItems=()=>mallItems;
export const listShopping=()=>readStore('shopping_list',[] as any[]);
export const toggleShopping=(item:any)=>{const list=listShopping();const i=list.findIndex((x:any)=>x.id===item.id);if(i>=0)list.splice(i,1);else list.push(item);writeStore('shopping_list',list);return list};
