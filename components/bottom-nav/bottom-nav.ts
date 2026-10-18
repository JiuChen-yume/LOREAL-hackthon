type NavItem={key:string;label:string;icon:string;glyph:string;url:string}
Component({
  properties:{activeKey:{type:String,value:'home'}},
  data:{items:[] as NavItem[]},
  lifetimes:{attached(this:any){this.refreshItems()}},
  observers:{activeKey(this:any){this.refreshItems()}},
  methods:{
    refreshItems(this:any){
      const icon=(name:string)=>`/assets/tab-${name}.png`;
      const all:Record<string,NavItem>={
        home:{key:'home',label:'首页',glyph:'⌂',icon:icon('home'),url:'/pages/home/home'},
        vanity:{key:'vanity',label:'化妆台',glyph:'▤',icon:icon('vanity'),url:'/pages/vanity/vanity'},
        care:{key:'care',label:'AI陪伴',glyph:'✦',icon:icon('care'),url:'/pages/care/care'},
        makeup:{key:'makeup',label:'妆造',glyph:'✧',icon:icon('care'),url:'/pages/makeup/makeup'},
        skin:{key:'skin',label:'肌肤记忆',glyph:'▥',icon:icon('vanity'),url:'/pages/skin/skin'},
        store:{key:'store',label:'商城',glyph:'▢',icon:icon('store'),url:'/pages/store/store'},
        cycle:{key:'cycle',label:'美丽循环',glyph:'◌',icon:icon('cycle'),url:'/pages/cycle/cycle'},
        profile:{key:'profile',label:'我的',glyph:'♙',icon:icon('vanity'),url:'/pages/skin/skin'},
        analysis:{key:'analysis',label:'肌肤分析',glyph:'◉',icon:icon('vanity'),url:'/pages/skin/skin'},
        advisor:{key:'advisor',label:'AI美妆顾问',glyph:'✦',icon:icon('care'),url:'/pages/makeup/makeup'},
        diagnostic:{key:'diagnostic',label:'AI诊断',glyph:'◉',icon:icon('care'),url:'/pages/skin/skin'}
      };
      const layouts:Record<string,string[]>={
        home:['home','cycle','care','store','profile'],
        vanity:['home','vanity','care','profile'],
        care:['home','diagnostic','care','vanity','profile'],
        makeup:['home','care','makeup','cycle','profile'],
        skin:['home','care','analysis','skin','profile'],
        store:['home','diagnostic','store','vanity','profile'],
        cycle:['home','analysis','advisor','cycle','profile']
      };
      const order=['home','vanity','care','makeup','store','cycle','profile'];
      this.setData({items:order.map((key:string)=>all[key])});
    },
    handleTap(this:any,e:any){wx.reLaunch({url:e.currentTarget.dataset.url})}
  }
})
