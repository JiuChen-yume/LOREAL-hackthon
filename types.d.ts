declare interface IAppOption { globalData?: any; onLaunch?:()=>void }
declare const wx: any
declare function App<T=any>(options: T): any
declare function Page(options: any): any
declare function Component(options: any): any

