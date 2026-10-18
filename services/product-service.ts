import {products} from './mock-data';
import {readStore,writeStore} from './storage';
import {callCloud} from './cloud';
const key='vanity_products';
export const listProducts=async()=>callCloud('productService',{action:'list'},readStore(key,products));
export const saveProducts=async(items:any[])=>{writeStore(key,items);return callCloud('productService',{action:'replace',items},items)};
export const recognizeProduct=async(input:any)=>callCloud('recognizeProduct',{input},{...products[0],id:`p${Date.now()}`,product_name:'识别示例产品'});
export const analyzeIngredients=async(item:any)=>callCloud('analyzeIngredients',{item},{risk:'low',summary:'当前组合成分重叠较低，建议先做局部测试。'});
