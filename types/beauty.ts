export type ProductCategory='skincare'|'base'|'eye'|'lip'|'tool';
export type ProductStatus='in_use'|'idle'|'expiring_soon'|'used_up';
export type ListRating='red'|'yellow'|'black'|'none';
export type CyclePhase='menstrual'|'follicular'|'ovulation'|'luteal';
export interface BeautyProduct{ id:string; brand:string; product_name:string; category:ProductCategory; subcategory:string; size?:string; expiry_date:string; status:ProductStatus; list_status:ListRating; ingredients:string[]; user_notes?:string; usage_count:number; image_url?:string; price?:number; }
export interface CareStep{step_number:number;category:string;title:string;product_name:string;brand?:string;dosage:string;wait_time:string;instruction:string;notes?:string;}
export interface RoutinePlan{id:string;title:string;time_budget:'3min'|'5min'|'full';only_vanity:boolean;skin_status_summary:string;morning_steps:CareStep[];evening_steps:CareStep[];}
export interface MakeupLook{id:string;title:string;type:'daily'|'imitation'|'cos';description:string;occasion:string;image:string;steps:string[];}
export interface MallItem{id:string;name:string;brand:string;price:number;reason:string;image:string;similarity?:number;commercial?:boolean;}
export interface CircularRecord{id:string;date:string;item_name:string;points:number;status:string;}
export interface Feedback{id:string;product:string;feel:string;note:string;image:string;}
